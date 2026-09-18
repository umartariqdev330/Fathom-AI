from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/api", tags=["meetings"])


def to_card(meeting: models.Meeting) -> schemas.MeetingCard:
    card = schemas.MeetingCard.model_validate(meeting)
    card.action_item_count = len(meeting.action_items)
    card.highlight_count = len(meeting.highlights)
    card.overview = meeting.summary.overview if meeting.summary else None
    return card


def get_meeting_or_404(meeting_id: int, db: Session) -> models.Meeting:
    meeting = db.get(models.Meeting, meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting


@router.get("/meetings", response_model=list[schemas.MeetingCard])
def list_meetings(status: str = "recorded", db: Session = Depends(get_db)):
    query = db.query(models.Meeting)
    if status != "all":
        query = query.filter(models.Meeting.status == status)
    meetings = query.order_by(models.Meeting.date.desc()).all()
    return [to_card(m) for m in meetings]


@router.get("/meetings/{meeting_id}", response_model=schemas.Meeting)
def get_meeting(meeting_id: int, db: Session = Depends(get_db)):
    return get_meeting_or_404(meeting_id, db)


@router.post("/meetings", response_model=schemas.Meeting, status_code=201)
def create_meeting(payload: schemas.MeetingCreate, db: Session = Depends(get_db)):
    meeting = models.Meeting(**payload.model_dump(), date=datetime.utcnow())
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    return meeting


@router.delete("/meetings/{meeting_id}", status_code=204)
def delete_meeting(meeting_id: int, db: Session = Depends(get_db)):
    db.delete(get_meeting_or_404(meeting_id, db))
    db.commit()


@router.get("/meetings/{meeting_id}/transcript", response_model=list[schemas.TranscriptSegment])
def get_transcript(meeting_id: int, db: Session = Depends(get_db)):
    return get_meeting_or_404(meeting_id, db).segments


@router.get("/meetings/{meeting_id}/summary", response_model=schemas.Summary)
def get_summary(meeting_id: int, db: Session = Depends(get_db)):
    summary = get_meeting_or_404(meeting_id, db).summary
    if not summary:
        raise HTTPException(status_code=404, detail="No summary for this meeting")
    return summary


@router.get("/stats", response_model=schemas.Stats)
def get_stats(db: Session = Depends(get_db)):
    week_ago = datetime.utcnow() - timedelta(days=7)
    recorded = db.query(models.Meeting).filter(models.Meeting.status == "recorded")

    return schemas.Stats(
        meetings_this_week=recorded.filter(models.Meeting.date >= week_ago).count(),
        hours_recorded=round(sum(m.duration for m in recorded.all()) / 3600, 1),
        open_action_items=db.query(models.ActionItem)
        .filter(models.ActionItem.status == "open")
        .count(),
        highlights=db.query(models.Highlight).count(),
    )
