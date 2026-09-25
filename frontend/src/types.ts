export type Participant = {
  id: number
  name: string
  email: string | null
  avatar: string | null
  role: string | null
}

export type TranscriptSegment = {
  id: number
  speaker: string
  start_time: number
  end_time: number
  text: string
}

export type Summary = {
  id: number
  overview: string
  key_points: string[]
  decisions: string[]
  topics: string[]
  insights: string[]
  generated_by: 'mock' | 'llm'
}

export type TemplateOption = {
  id: string
  label: string
  description: string
}

export type SummaryItem = {
  text: string
  /** Set when the item is a transcript line, so it can be played. */
  timestamp: number | null
}

export type SummarySection = {
  label: string
  items: SummaryItem[]
}

export type SummaryView = {
  template: string
  overview: string
  sections: SummarySection[]
  topics: string[]
  generated_by: 'mock' | 'llm'
}

export type ActionItemStatus = 'open' | 'done'

export type ActionItem = {
  id: number
  meeting_id: number
  task: string
  assignee: string | null
  due_date: string | null
  status: ActionItemStatus
  timestamp: number | null
}

export type HighlightCategory = 'key-moment' | 'decision' | 'risk' | 'insight'

export type Highlight = {
  id: number
  meeting_id: number
  title: string
  start_time: number
  end_time: number
  transcript_excerpt: string | null
  speaker: string | null
  category: HighlightCategory
}

export type MeetingSource = 'seed' | 'recorded'
export type ProcessingStatus = 'uploading' | 'processing' | 'ready' | 'failed'

export type MeetingCard = {
  id: number
  title: string
  description: string | null
  date: string
  duration: number
  meeting_type: string
  platform: string | null
  status: 'recorded' | 'upcoming'
  source: MeetingSource
  processing_status: ProcessingStatus
  participants: Participant[]
  action_item_count: number
  highlight_count: number
  overview: string | null
}

export type Meeting = {
  id: number
  title: string
  description: string | null
  date: string
  duration: number
  meeting_type: string
  platform: string | null
  recording_url: string | null
  status: 'recorded' | 'upcoming'
  source: MeetingSource
  processing_status: ProcessingStatus
  processing_error: string | null
  has_media: boolean
  participants: Participant[]
  segments: TranscriptSegment[]
  summary: Summary | null
  action_items: ActionItem[]
  highlights: Highlight[]
}

export type Clip = {
  id: number
  meeting_id: number
  title: string
  start_time: number
  end_time: number
  share_token: string
  created_at: string
}

export type SharedClip = {
  clip: Clip
  meeting_title: string
  meeting_date: string
  recording_url: string | null
  media_url: string | null
  participants: Participant[]
  segments: TranscriptSegment[]
}

export type SearchHit = {
  meeting_id: number
  meeting_title: string
  meeting_date: string
  kind: 'transcript' | 'title' | 'summary' | 'action-item' | 'highlight' | 'participant'
  text: string
  speaker: string | null
  timestamp: number | null
}

export type SearchResponse = {
  query: string
  total: number
  hits: SearchHit[]
}

export type Stats = {
  meetings_this_week: number
  hours_recorded: number
  open_action_items: number
  highlights: number
}

export type CalendarResponse = {
  upcoming: MeetingCard[]
  past: MeetingCard[]
}

export type AiSettings = {
  configured: boolean
  key_source: 'saved' | 'none'
  masked_key: string | null
  summary_model: string
  transcribe_model: string
  transcribe_models: string[]
}

export type AiSettingsUpdate = {
  api_key?: string
  summary_model?: string
  transcribe_model?: string
}
