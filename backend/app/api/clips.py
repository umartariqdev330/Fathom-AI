import secrets

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.api.meetings import get_meeting_or_404
from app.database import get_db

router = APIRouter(prefix="/api", tags=["clips"])


@router.post("/clips", response_model=schemas.Clip, status_code=201)
def create_clip(payload: schemas.ClipCreate, db: Session = Depends(get_db)):
    get_meeting_or_404(payload.meeting_id, db)
    if payload.end_time <= payload.start_time:
        raise HTTPException(status_code=400, detail="Clip end must come after its start")

    clip = models.Clip(**payload.model_dump(), share_token=secrets.token_urlsafe(8))
    db.add(clip)
    db.commit()
    db.refresh(clip)
    return clip


@router.get("/clips/{token}", response_model=schemas.SharedClip)
def get_shared_clip(token: str, db: Session = Depends(get_db)):
    """Public. Anyone with the link can view, including people not on the call."""
    clip = db.query(models.Clip).filter(models.Clip.share_token == token).first()
    if not clip:
        raise HTTPException(status_code=404, detail="This clip link is not valid")

    clip.views += 1
    db.commit()

    meeting = clip.meeting
    segments = [
        s for s in meeting.segments if s.end_time > clip.start_time and s.start_time < clip.end_time
    ]
    return schemas.SharedClip(
        clip=schemas.Clip.model_validate(clip),
        meeting_title=meeting.title,
        meeting_date=meeting.date,
        recording_url=meeting.recording_url,
        participants=[schemas.Participant.model_validate(p) for p in meeting.participants],
        segments=[schemas.TranscriptSegment.model_validate(s) for s in segments],
    )
