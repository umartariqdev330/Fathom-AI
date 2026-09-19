"""Recording capture.

Two ways in:

- `POST /api/meetings/record` takes a real audio file recorded in the browser,
  stores it, and processes it in the background: transcribe, then summarise.
- `POST /api/recordings/start` + `/stop` keep the simulated path alive for
  demos on a machine with no microphone, and for reviewers who would rather not
  grant permission. It is labelled as simulated everywhere it surfaces.
"""

import secrets
from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app import models
from app.database import SessionLocal, get_db
from app.seed import SIMULATED_RECORDING
from app.services import ai, clipper, storage, transcription

router = APIRouter(prefix="/api", tags=["recordings"])

active: dict[str, dict] = {}


class StartRequest(BaseModel):
    platform: str
    title: str | None = None


class StartResponse(BaseModel):
    recording_id: str
    platform: str
    started_at: datetime


class RecordedResponse(BaseModel):
    meeting_id: int
    title: str


def process_recording(meeting_id: int) -> None:
    """Transcribe then summarise, in the background.

    Runs with its own session because the request that scheduled it is long
    gone. Any failure is written to the meeting so the UI can say what broke
    instead of spinning on "Processing" forever.
    """
    db = SessionLocal()
    try:
        meeting = db.get(models.Meeting, meeting_id)
        if not meeting:
            return

        path = storage.path_for(meeting.media_filename)
        if not path:
            raise RuntimeError("The uploaded recording could not be found on disk")

        segments = transcription.transcribe(path)
        if not segments:
            raise RuntimeError("No speech was found in this recording")

        for segment in segments:
            db.add(models.TranscriptSegment(meeting_id=meeting.id, **segment))

        # The media's own length is authoritative; the transcript only covers
        # speech, so it can end well before the recording does.
        meeting.duration = int(
            clipper.media_duration(path) or max(s["end_time"] for s in segments)
        )
        _summarise(db, meeting, segments)

        meeting.processing_status = "ready"
        meeting.processing_error = None
        db.commit()
    except Exception as error:
        db.rollback()
        meeting = db.get(models.Meeting, meeting_id)
        if meeting:
            meeting.processing_status = "failed"
            meeting.processing_error = str(error)[:500]
            db.commit()
    finally:
        db.close()


def _summarise(db: Session, meeting: models.Meeting, segments: list[dict]) -> None:
    generated = ai.summarise(meeting.title, segments)

    db.add(
        models.Summary(
            meeting_id=meeting.id,
            overview=generated["overview"],
            key_points=generated.get("key_points", []),
            decisions=generated.get("decisions", []),
            topics=generated.get("topics", []),
            insights=generated.get("insights", []),
            generated_by=generated.get("generated_by", "mock"),
        )
    )
    for item in generated.get("action_items", []):
        db.add(
            models.ActionItem(
                meeting_id=meeting.id,
                task=item["task"],
                assignee=item.get("assignee"),
                due_date=item.get("due_date"),
            )
        )


@router.post("/meetings/record", response_model=RecordedResponse, status_code=201)
async def upload_recording(
    background: BackgroundTasks,
    audio: UploadFile = File(...),
    title: str = Form("Untitled recording"),
    platform: str = Form("Meetly"),
    db: Session = Depends(get_db),
):
    """Store a real browser recording and start processing it."""
    try:
        filename = storage.save(await audio.read(), audio.content_type or "")
    except storage.UploadRejected as error:
        raise HTTPException(status_code=400, detail=str(error))

    meeting = models.Meeting(
        title=title.strip() or "Untitled recording",
        description="Recorded with Meetly.",
        date=datetime.utcnow(),
        duration=0,  # replaced once the transcript gives us a real length
        meeting_type="Internal",
        platform=platform,
        status="recorded",
        source="recorded",
        processing_status="processing",
        media_filename=filename,
        media_mime=audio.content_type,
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)

    background.add_task(process_recording, meeting.id)
    return RecordedResponse(meeting_id=meeting.id, title=meeting.title)


@router.post("/recordings/start", response_model=StartResponse)
def start_recording(payload: StartRequest):
    recording_id = secrets.token_urlsafe(6)
    started_at = datetime.utcnow()
    active[recording_id] = {"platform": payload.platform, "title": payload.title, "started_at": started_at}
    return StartResponse(recording_id=recording_id, platform=payload.platform, started_at=started_at)


@router.post("/recordings/{recording_id}/stop", response_model=RecordedResponse)
def stop_recording(recording_id: str, db: Session = Depends(get_db)):
    """Finish a simulated recording, producing a meeting from a canned transcript."""
    session = active.pop(recording_id, None)
    if not session:
        raise HTTPException(status_code=404, detail="No active recording with that id")

    template = SIMULATED_RECORDING
    meeting = models.Meeting(
        title=session["title"] or template["title"],
        description=template["description"],
        date=session["started_at"],
        duration=int(template["segments"][-1]["end_time"]),
        meeting_type=template["meeting_type"],
        platform=session["platform"],
        status="recorded",
        source="simulated",
        processing_status="ready",
    )
    db.add(meeting)
    db.flush()

    for person in template["participants"]:
        db.add(models.Participant(meeting_id=meeting.id, **person))
    for segment in template["segments"]:
        db.add(models.TranscriptSegment(meeting_id=meeting.id, **segment))

    _summarise(db, meeting, template["segments"])
    db.commit()
    return RecordedResponse(meeting_id=meeting.id, title=meeting.title)
