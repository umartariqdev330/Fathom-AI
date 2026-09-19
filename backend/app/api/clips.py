import secrets

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app import models, schemas
from app.api.meetings import get_meeting_or_404
from app.database import get_db
from app.services import clipper, storage

router = APIRouter(prefix="/api", tags=["clips"])


@router.post("/clips", response_model=schemas.Clip, status_code=201)
def create_clip(payload: schemas.ClipCreate, db: Session = Depends(get_db)):
    meeting = get_meeting_or_404(payload.meeting_id, db)
    if payload.end_time <= payload.start_time:
        raise HTTPException(status_code=400, detail="Clip end must come after its start")

    # When the meeting has real audio the range is actually cut out of it. A
    # seeded meeting has no media, so the clip stays a range played against the
    # parent, which is the honest answer rather than a fabricated file.
    source = storage.path_for(meeting.media_filename) if meeting.media_filename else None
    media_filename = (
        clipper.cut(source, payload.start_time, payload.end_time) if source else None
    )

    clip = models.Clip(
        **payload.model_dump(),
        share_token=secrets.token_urlsafe(12),
        media_filename=media_filename,
    )
    db.add(clip)
    db.commit()
    db.refresh(clip)
    return clip


@router.get("/clips/{token}", response_model=schemas.SharedClip)
def get_shared_clip(token: str, db: Session = Depends(get_db)):
    """Public. Anyone with the link can view, including people not on the call."""
    clip = _clip_or_404(token, db)

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
        media_url=f"/api/clips/{token}/media" if _clip_media(clip) else None,
        participants=[schemas.Participant.model_validate(p) for p in meeting.participants],
        segments=[schemas.TranscriptSegment.model_validate(s) for s in segments],
    )


@router.get("/clips/{token}/media")
def get_clip_media(token: str, db: Session = Depends(get_db)):
    """Public too: the share page has to be able to play without an account."""
    path = _clip_media(_clip_or_404(token, db))
    if not path:
        raise HTTPException(status_code=404, detail="This clip has no media")
    return FileResponse(path, media_type="audio/webm")


def _clip_or_404(token: str, db: Session) -> models.Clip:
    clip = db.query(models.Clip).filter(models.Clip.share_token == token).first()
    if not clip:
        raise HTTPException(status_code=404, detail="This clip link is not valid")
    return clip


def _clip_media(clip: models.Clip):
    return storage.path_for(clip.media_filename) if clip.media_filename else None
