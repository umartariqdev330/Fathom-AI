from datetime import datetime

from sqlalchemy import JSON, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    avatar = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)


class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    date = Column(DateTime, nullable=False)
    duration = Column(Integer, nullable=False)  # seconds
    meeting_type = Column(String, nullable=False)
    platform = Column(String)
    recording_url = Column(String)
    status = Column(String, default="recorded")  # recorded | upcoming
    created_at = Column(DateTime, default=datetime.utcnow)

    participants = relationship("Participant", back_populates="meeting", cascade="all, delete-orphan")
    segments = relationship(
        "TranscriptSegment",
        back_populates="meeting",
        cascade="all, delete-orphan",
        order_by="TranscriptSegment.start_time",
    )
    summary = relationship("Summary", back_populates="meeting", uselist=False, cascade="all, delete-orphan")
    action_items = relationship("ActionItem", back_populates="meeting", cascade="all, delete-orphan")
    highlights = relationship(
        "Highlight",
        back_populates="meeting",
        cascade="all, delete-orphan",
        order_by="Highlight.start_time",
    )
    clips = relationship("Clip", back_populates="meeting", cascade="all, delete-orphan")


class Participant(Base):
    __tablename__ = "participants"

    id = Column(Integer, primary_key=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    email = Column(String)
    avatar = Column(String)
    role = Column(String)

    meeting = relationship("Meeting", back_populates="participants")


class TranscriptSegment(Base):
    __tablename__ = "transcript_segments"

    id = Column(Integer, primary_key=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    speaker = Column(String, nullable=False)
    start_time = Column(Float, nullable=False)
    end_time = Column(Float, nullable=False)
    text = Column(Text, nullable=False)

    meeting = relationship("Meeting", back_populates="segments")


class Summary(Base):
    __tablename__ = "summaries"

    id = Column(Integer, primary_key=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    overview = Column(Text, nullable=False)
    key_points = Column(JSON, default=list)
    decisions = Column(JSON, default=list)
    topics = Column(JSON, default=list)
    insights = Column(JSON, default=list)
    generated_by = Column(String, default="mock")  # mock | llm

    meeting = relationship("Meeting", back_populates="summary")


class ActionItem(Base):
    __tablename__ = "action_items"

    id = Column(Integer, primary_key=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    task = Column(String, nullable=False)
    assignee = Column(String)
    due_date = Column(String)
    status = Column(String, default="open")  # open | done
    timestamp = Column(Float)

    meeting = relationship("Meeting", back_populates="action_items")


class Highlight(Base):
    __tablename__ = "highlights"

    id = Column(Integer, primary_key=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    start_time = Column(Float, nullable=False)
    end_time = Column(Float, nullable=False)
    transcript_excerpt = Column(Text)
    speaker = Column(String)
    category = Column(String, default="key-moment")
    created_at = Column(DateTime, default=datetime.utcnow)

    meeting = relationship("Meeting", back_populates="highlights")


class Clip(Base):
    __tablename__ = "clips"

    id = Column(Integer, primary_key=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    start_time = Column(Float, nullable=False)
    end_time = Column(Float, nullable=False)
    share_token = Column(String, unique=True, nullable=False)
    views = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    meeting = relationship("Meeting", back_populates="clips")
