from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.services import ai, storage, templates

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
    meeting = get_meeting_or_404(meeting_id, db)
    payload = schemas.Meeting.model_validate(meeting)
    payload.has_media = storage.path_for(meeting.media_filename) is not None
    return payload


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


@router.get("/meetings/{meeting_id}/media")
def get_media(meeting_id: int, db: Session = Depends(get_db)):
    """Serve the stored recording.

    FileResponse handles Range requests, which is what lets the player seek
    instead of having to download the whole file first.
    """
    meeting = get_meeting_or_404(meeting_id, db)
    path = storage.path_for(meeting.media_filename) if meeting.media_filename else None
    if not path:
        raise HTTPException(status_code=404, detail="This meeting has no recording")

    return FileResponse(path, media_type=meeting.media_mime or "audio/webm")


@router.get("/templates", response_model=list[schemas.TemplateOption])
def list_templates():
    return [
        schemas.TemplateOption(id=t.id, label=t.label, description=t.description)
        for t in templates.TEMPLATES.values()
    ]


@router.get("/meetings/{meeting_id}/summary", response_model=schemas.SummaryView)
def get_summary(
    meeting_id: int, template: str = templates.DEFAULT_TEMPLATE, db: Session = Depends(get_db)
):
    meeting = get_meeting_or_404(meeting_id, db)
    chosen = templates.get(template)

    if chosen.id == templates.DEFAULT_TEMPLATE:
        return stored_summary_view(meeting)

    segments = [
        {"speaker": s.speaker, "start_time": s.start_time, "end_time": s.end_time, "text": s.text}
        for s in meeting.segments
    ]
    if not segments:
        raise HTTPException(status_code=404, detail="This meeting has no transcript to summarise")

    generated = ai.apply_template(meeting.title, segments, chosen)
    return schemas.SummaryView(template=chosen.id, **generated)


def stored_summary_view(meeting: models.Meeting) -> schemas.SummaryView:
    """The seeded summary, shaped like every other template."""
    summary = meeting.summary
    if not summary:
        raise HTTPException(status_code=404, detail="No summary for this meeting")

    groups = [
        ("Key points", summary.key_points),
        ("Decisions", summary.decisions),
        ("AI insights", summary.insights),
    ]
    return schemas.SummaryView(
        template=templates.DEFAULT_TEMPLATE,
        overview=summary.overview,
        sections=[
            schemas.SummarySection(label=label, items=[schemas.SummaryItem(text=t) for t in texts])
            for label, texts in groups
            if texts
        ],
        topics=summary.topics or [],
        generated_by=summary.generated_by,
    )


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
