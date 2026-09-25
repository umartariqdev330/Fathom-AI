"""Recording capture.

`POST /api/meetings/record` takes a real audio file recorded in the browser,
stores it on disk, and processes it in the background: transcribe with Whisper,
then summarise. There is no canned alternative — a meeting only exists here
because audio was actually captured and transcribed.
"""

from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app import models
from app.database import SessionLocal, get_db
from app.services import ai, clipper, storage, transcription

router = APIRouter(prefix="/api", tags=["recordings"])

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
            generated_by=generated.get("generated_by", "local"),
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
