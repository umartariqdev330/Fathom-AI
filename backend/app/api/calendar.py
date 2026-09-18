from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app import models, schemas
from app.api.meetings import to_card
from app.database import get_db

router = APIRouter(prefix="/api", tags=["calendar"])


class CalendarResponse(BaseModel):
    upcoming: list[schemas.MeetingCard]
    past: list[schemas.MeetingCard]


class ConnectRequest(BaseModel):
    provider: str  # google | outlook


class ConnectResponse(BaseModel):
    provider: str
    account: str
    connected: bool
    synced_events: int


@router.get("/calendar", response_model=CalendarResponse)
def get_calendar(db: Session = Depends(get_db)):
    meetings = db.query(models.Meeting).order_by(models.Meeting.date).all()
    now = datetime.utcnow()

    return CalendarResponse(
        upcoming=[to_card(m) for m in meetings if m.date >= now or m.status == "upcoming"],
        past=[to_card(m) for m in meetings if m.date < now and m.status == "recorded"][::-1],
    )


@router.post("/calendar/connect", response_model=ConnectResponse)
def connect_calendar(payload: ConnectRequest, db: Session = Depends(get_db)):
    """Simulated OAuth.

    A real integration would redirect to the provider, exchange the code for
    tokens, and sync events into the meetings table. The seeded upcoming meetings
    stand in for that sync so the rest of the product is exercisable.
    """
    synced = db.query(models.Meeting).filter(models.Meeting.status == "upcoming").count()
    account = "muhammad@meetly.ai" if payload.provider == "google" else "muhammad@outlook.com"
    return ConnectResponse(
        provider=payload.provider, account=account, connected=True, synced_events=synced
    )
