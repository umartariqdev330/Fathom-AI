"""Simulated capture.

The real product runs a bot that joins the call, or captures audio on the
device. That is deliberately out of scope here. These endpoints produce a
genuine meeting record from a canned transcript so the whole post-meeting
experience, including the AI pipeline, runs end to end.
"""

import secrets
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app import models
from app.database import get_db
from app.seed import SIMULATED_RECORDING
from app.services import ai

router = APIRouter(prefix="/api/recordings", tags=["recordings"])

active: dict[str, dict] = {}


class StartRequest(BaseModel):
    platform: str  # Google Meet | Zoom | Microsoft Teams
    title: str | None = None


class StartResponse(BaseModel):
    recording_id: str
    platform: str
    started_at: datetime


class StopResponse(BaseModel):
    meeting_id: int
    title: str


@router.post("/start", response_model=StartResponse)
def start_recording(payload: StartRequest):
    recording_id = secrets.token_urlsafe(6)
    started_at = datetime.utcnow()
    active[recording_id] = {"platform": payload.platform, "title": payload.title, "started_at": started_at}
    return StartResponse(recording_id=recording_id, platform=payload.platform, started_at=started_at)


@router.post("/{recording_id}/stop", response_model=StopResponse)
def stop_recording(recording_id: str, db: Session = Depends(get_db)):
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
        recording_url=template["recording_url"],
        status="recorded",
    )
    db.add(meeting)
    db.flush()

    for person in template["participants"]:
        db.add(models.Participant(meeting_id=meeting.id, **person))
    for segment in template["segments"]:
        db.add(models.TranscriptSegment(meeting_id=meeting.id, **segment))

    generated = ai.summarise(meeting.title, template["segments"])
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

    db.commit()
    return StopResponse(meeting_id=meeting.id, title=meeting.title)
