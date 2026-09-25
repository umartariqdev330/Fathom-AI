"""Rebuild the database.

Run from the backend directory:

    python seed.py            empty workspace, ready for your own recordings
    python seed.py --demo     load the authored demo meetings instead

Either way the tables are dropped and recreated, so both are a clean start.
"""

import sys
from datetime import datetime, timedelta

from app.database import Base, SessionLocal, engine
from app.models import (
    ActionItem,
    Clip,
    Highlight,
    Meeting,
    Participant,
    Summary,
    TranscriptSegment,
    User,
)
from app.seed import MEETINGS, UPCOMING, build_segments
from app.services import storage

OWNER = {"name": "Muhammad Umar", "email": "muhammad@meetly.ai"}


def at(days_offset: int, hour: int) -> datetime:
    day = datetime.utcnow() + timedelta(days=days_offset)
    return day.replace(hour=hour, minute=0, second=0, microsecond=0)


def nearest_segment(segments: list[dict], time: float) -> int:
    """Index of the segment starting closest to `time`.

    Action-item timestamps are authored by hand against the shape of the
    conversation while segment times are generated from speaking pace, so they
    are approximate. Snapping keeps them on a real line rather than in a gap.
    """
    return min(range(len(segments)), key=lambda i: abs(segments[i]["start_time"] - time))


def segment_matching(segments: list[dict], quote: str) -> int:
    """Index of the segment containing `quote`.

    Highlights are anchored to the words they refer to rather than to a
    timestamp, so they stay correct when speaking pace changes. A stale anchor
    raises here, at seed time, instead of shipping a highlight that plays the
    wrong moment.
    """
    for i, segment in enumerate(segments):
        if quote in segment["text"]:
            return i
    raise ValueError(f"No transcript segment contains: {quote!r}")


def add_recorded_meeting(db, data: dict) -> Meeting:
    segments = build_segments(data["blocks"])
    duration = int(segments[-1]["end_time"]) + 20  # a short tail after the last word

    meeting = Meeting(
        title=data["title"],
        description=data["description"],
        date=at(-data["days_ago"], data["hour"]),
        duration=duration,
        meeting_type=data["meeting_type"],
        platform=data["platform"],
        status="recorded",
        source="seed",
        processing_status="ready",
    )
    db.add(meeting)
    db.flush()

    # The timeline draws one lane per speaker, so a voice that belongs to nobody
    # in the room shows up as an extra person. Catch it here instead.
    people = {person["name"] for person in data["participants"]}
    strangers = {s["speaker"] for s in segments} - people
    if strangers:
        raise ValueError(f"{data['title']}: {', '.join(sorted(strangers))} speak but are not participants")

    for person in data["participants"]:
        db.add(Participant(meeting_id=meeting.id, **person))

    for segment in segments:
        db.add(TranscriptSegment(meeting_id=meeting.id, **segment))

    db.add(Summary(meeting_id=meeting.id, generated_by="authored", **data["summary"]))

    for item in data["action_items"]:
        item = dict(item)
        if item.get("timestamp") is not None:
            item["timestamp"] = segments[nearest_segment(segments, item["timestamp"])]["start_time"]
        db.add(ActionItem(meeting_id=meeting.id, **item))

    for highlight in data["highlights"]:
        highlight = dict(highlight)
        start = segment_matching(segments, highlight.pop("quote"))
        end = min(start + 1, len(segments) - 1)  # a highlight covers a line or two
        db.add(
            Highlight(
                meeting_id=meeting.id,
                start_time=segments[start]["start_time"],
                end_time=segments[end]["end_time"],
                transcript_excerpt=segments[start]["text"],
                **highlight,
            )
        )

    return meeting


def add_upcoming_meeting(db, data: dict) -> Meeting:
    meeting = Meeting(
        title=data["title"],
        description=data["description"],
        date=at(data["days_ahead"], data["hour"]),
        duration=data["duration"],
        meeting_type=data["meeting_type"],
        platform=data["platform"],
        status="upcoming",
        source="seed",
        processing_status="ready",
    )
    db.add(meeting)
    db.flush()

    for person in data["participants"]:
        db.add(Participant(meeting_id=meeting.id, **person))
    return meeting


def add_demo_clip(db) -> None:
    """A clip with a stable token, so /share/demo-clip is always a live link."""
    meeting = db.query(Meeting).filter(Meeting.title.like("AI Platform%")).first()
    if not meeting:
        return

    highlight = next(
        (h for h in meeting.highlights if h.title.startswith("Partial is fine")),
        meeting.highlights[0],
    )
    db.add(
        Clip(
            meeting_id=meeting.id,
            title=highlight.title,
            start_time=highlight.start_time,
            end_time=highlight.end_time + 25,
            share_token="demo-clip",
        )
    )


def main(demo: bool = False):
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        db.add(User(**OWNER))

        if not demo:
            db.commit()
            # No meetings means no rows referencing stored audio, so anything
            # left in the media directory is now orphaned.
            removed = storage.remove_unreferenced(set())
            print(f"Empty workspace ready. Removed {removed} unreferenced media file(s).")
            print("Add data by recording a meeting in the app: Record -> share the call tab.")
            return

        for data in MEETINGS:
            add_recorded_meeting(db, data)
        for data in UPCOMING:
            add_upcoming_meeting(db, data)

        db.flush()
        add_demo_clip(db)
        db.commit()

        recorded = db.query(Meeting).filter(Meeting.status == "recorded").count()
        upcoming = db.query(Meeting).filter(Meeting.status == "upcoming").count()
        segments = db.query(TranscriptSegment).count()
        print(f"Seeded {recorded} recorded meetings, {upcoming} upcoming, {segments} transcript segments.")
    finally:
        db.close()


if __name__ == "__main__":
    main(demo="--demo" in sys.argv)
