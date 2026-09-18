from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/api", tags=["search"])

MAX_HITS = 60


@router.get("/search", response_model=schemas.SearchResponse)
def search(q: str = "", db: Session = Depends(get_db)):
    query = q.strip()
    if len(query) < 2:
        return schemas.SearchResponse(query=query, total=0, hits=[])

    pattern = f"%{query}%"
    hits: list[schemas.SearchHit] = []

    segments = (
        db.query(models.TranscriptSegment)
        .filter(models.TranscriptSegment.text.ilike(pattern))
        .limit(MAX_HITS)
        .all()
    )
    for segment in segments:
        hits.append(
            _hit(
                segment.meeting,
                kind="transcript",
                text=segment.text,
                speaker=segment.speaker,
                timestamp=segment.start_time,
            )
        )

    meetings = db.query(models.Meeting).filter(models.Meeting.title.ilike(pattern)).all()
    for meeting in meetings:
        hits.append(_hit(meeting, kind="title", text=meeting.title))

    summaries = db.query(models.Summary).filter(models.Summary.overview.ilike(pattern)).all()
    for summary in summaries:
        hits.append(_hit(summary.meeting, kind="summary", text=summary.overview))

    items = db.query(models.ActionItem).filter(models.ActionItem.task.ilike(pattern)).all()
    for item in items:
        hits.append(_hit(item.meeting, kind="action-item", text=item.task, speaker=item.assignee))

    highlights = db.query(models.Highlight).filter(models.Highlight.title.ilike(pattern)).all()
    for highlight in highlights:
        hits.append(
            _hit(
                highlight.meeting,
                kind="highlight",
                text=highlight.title,
                speaker=highlight.speaker,
                timestamp=highlight.start_time,
            )
        )

    people = db.query(models.Participant).filter(models.Participant.name.ilike(pattern)).all()
    seen_meetings = set()
    for person in people:
        if person.meeting_id in seen_meetings:
            continue
        seen_meetings.add(person.meeting_id)
        hits.append(_hit(person.meeting, kind="participant", text=person.name, speaker=person.name))

    return schemas.SearchResponse(query=query, total=len(hits), hits=hits[:MAX_HITS])


def _hit(meeting, *, kind, text, speaker=None, timestamp=None) -> schemas.SearchHit:
    return schemas.SearchHit(
        meeting_id=meeting.id,
        meeting_title=meeting.title,
        meeting_date=meeting.date,
        kind=kind,
        text=text,
        speaker=speaker,
        timestamp=timestamp,
    )
