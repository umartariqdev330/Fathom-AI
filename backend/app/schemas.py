from datetime import datetime

from pydantic import BaseModel, ConfigDict


class Base(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class Participant(Base):
    id: int
    name: str
    email: str | None = None
    avatar: str | None = None
    role: str | None = None


class TranscriptSegment(Base):
    id: int
    speaker: str
    start_time: float
    end_time: float
    text: str


class Summary(Base):
    id: int
    overview: str
    key_points: list[str] = []
    decisions: list[str] = []
    topics: list[str] = []
    insights: list[str] = []
    generated_by: str = "mock"


class SummaryItem(BaseModel):
    text: str
    # Set when the item is a transcript line, so the reader can jump to it.
    timestamp: float | None = None


class SummarySection(BaseModel):
    label: str
    items: list[SummaryItem]


class SummaryView(BaseModel):
    """A meeting summary read through one template."""

    template: str
    overview: str
    sections: list[SummarySection] = []
    topics: list[str] = []
    generated_by: str = "mock"


class TemplateOption(BaseModel):
    id: str
    label: str
    description: str


class ActionItem(Base):
    id: int
    meeting_id: int
    task: str
    assignee: str | None = None
    due_date: str | None = None
    status: str = "open"
    timestamp: float | None = None


class ActionItemCreate(BaseModel):
    task: str
    assignee: str | None = None
    due_date: str | None = None
    timestamp: float | None = None


class ActionItemUpdate(BaseModel):
    task: str | None = None
    assignee: str | None = None
    due_date: str | None = None
    status: str | None = None


class Highlight(Base):
    id: int
    meeting_id: int
    title: str
    start_time: float
    end_time: float
    transcript_excerpt: str | None = None
    speaker: str | None = None
    category: str = "key-moment"


class HighlightCreate(BaseModel):
    title: str
    start_time: float
    end_time: float
    transcript_excerpt: str | None = None
    speaker: str | None = None
    category: str = "key-moment"


class MeetingCard(Base):
    """Shape used by list views. No transcript, so the payload stays small."""

    id: int
    title: str
    description: str | None = None
    date: datetime
    duration: int
    meeting_type: str
    platform: str | None = None
    status: str
    participants: list[Participant] = []
    action_item_count: int = 0
    highlight_count: int = 0
    overview: str | None = None


class Meeting(Base):
    id: int
    title: str
    description: str | None = None
    date: datetime
    duration: int
    meeting_type: str
    platform: str | None = None
    recording_url: str | None = None
    status: str
    participants: list[Participant] = []
    segments: list[TranscriptSegment] = []
    summary: Summary | None = None
    action_items: list[ActionItem] = []
    highlights: list[Highlight] = []


class MeetingCreate(BaseModel):
    title: str
    meeting_type: str = "Internal"
    platform: str | None = None
    duration: int = 0
    description: str | None = None


class ClipCreate(BaseModel):
    meeting_id: int
    title: str
    start_time: float
    end_time: float


class Clip(Base):
    id: int
    meeting_id: int
    title: str
    start_time: float
    end_time: float
    share_token: str
    created_at: datetime


class SharedClip(BaseModel):
    """Public payload for the share page. No auth, so only what a viewer needs."""

    clip: Clip
    meeting_title: str
    meeting_date: datetime
    recording_url: str | None = None
    participants: list[Participant] = []
    segments: list[TranscriptSegment] = []


class SearchHit(BaseModel):
    meeting_id: int
    meeting_title: str
    meeting_date: datetime
    kind: str  # transcript | title | summary | action-item | highlight | participant
    text: str
    speaker: str | None = None
    timestamp: float | None = None


class SearchResponse(BaseModel):
    query: str
    total: int
    hits: list[SearchHit]


class Stats(BaseModel):
    meetings_this_week: int
    hours_recorded: float
    open_action_items: int
    highlights: int
