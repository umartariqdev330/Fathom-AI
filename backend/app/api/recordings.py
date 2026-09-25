"""Recording capture.

`POST /api/meetings/record` takes a real audio file recorded in the browser,
stores it on disk, and processes it in the background: transcribe with Whisper,
then summarise. There is no canned alternative — a meeting only exists here
because audio was actually captured and transcribed.
"""

import json
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


def process_recording(meeting_id: int, marks: list[float] | None = None) -> None:
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
        _highlight_marks(db, meeting, segments, marks or [])

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


def _highlight_marks(
    db: Session, meeting: models.Meeting, segments: list[dict], marks: list[float]
) -> None:
    """Turn moments marked during the call into highlights.

    A mark is pressed a beat after the thing worth keeping was said, so it
    resolves to the line that was being spoken at that time rather than the
    nearest line start. The line's own text becomes the excerpt, which is what
    makes the highlight land on the right moment in playback.
    """
    for mark in sorted(set(marks)):
        spoken = [s for s in segments if s["start_time"] <= mark]
        line = spoken[-1] if spoken else segments[0]

        db.add(
            models.Highlight(
                meeting_id=meeting.id,
                title=line["text"].strip()[:90],
                category="key-moment",
                start_time=line["start_time"],
                end_time=line["end_time"],
                transcript_excerpt=line["text"].strip(),
                speaker=line.get("speaker"),
            )
        )


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
    marks: str = Form("[]"),
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

    background.add_task(process_recording, meeting.id, _parse_marks(marks))
    return RecordedResponse(meeting_id=meeting.id, title=meeting.title)


def _parse_marks(raw: str) -> list[float]:
    """Marks arrive as a JSON array of elapsed seconds. Bad input is not fatal."""
    try:
        values = json.loads(raw or "[]")
    except json.JSONDecodeError:
        return []
    return [float(v) for v in values if isinstance(v, (int, float)) and v >= 0]
