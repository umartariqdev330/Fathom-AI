import type {
  ActionItem,
  CalendarResponse,
  Clip,
  Highlight,
  Meeting,
  MeetingCard,
  SearchResponse,
  SharedClip,
  Stats,
} from '../types'

// Empty in dev, where Vite proxies /api to the local backend.
const BASE = import.meta.env.VITE_API_URL ?? ''

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
  })

  if (!response.ok) {
    const detail = await response.json().catch(() => null)
    throw new Error(detail?.detail ?? `Request failed (${response.status})`)
  }
  return response.status === 204 ? (undefined as T) : response.json()
}

const post = <T>(path: string, body: unknown) =>
  request<T>(path, { method: 'POST', body: JSON.stringify(body) })

export const api = {
  meetings: (status: 'recorded' | 'upcoming' | 'all' = 'recorded') =>
    request<MeetingCard[]>(`/api/meetings?status=${status}`),

  meeting: (id: number) => request<Meeting>(`/api/meetings/${id}`),

  deleteMeeting: (id: number) => request<void>(`/api/meetings/${id}`, { method: 'DELETE' }),

  stats: () => request<Stats>('/api/stats'),

  calendar: () => request<CalendarResponse>('/api/calendar'),

  connectCalendar: (provider: 'google' | 'outlook') =>
    post<{ provider: string; account: string; synced_events: number }>('/api/calendar/connect', {
      provider,
    }),

  search: (q: string) => request<SearchResponse>(`/api/search?q=${encodeURIComponent(q)}`),

  allHighlights: () => request<Highlight[]>('/api/highlights'),

  createActionItem: (
    meetingId: number,
    body: { task: string; assignee?: string | null; due_date?: string | null; timestamp?: number | null },
  ) => post<ActionItem>(`/api/meetings/${meetingId}/action-items`, body),

  updateActionItem: (id: number, body: Partial<Pick<ActionItem, 'task' | 'assignee' | 'due_date' | 'status'>>) =>
    request<ActionItem>(`/api/action-items/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  deleteActionItem: (id: number) => request<void>(`/api/action-items/${id}`, { method: 'DELETE' }),

  createHighlight: (
    meetingId: number,
    body: {
      title: string
      start_time: number
      end_time: number
      transcript_excerpt?: string | null
      speaker?: string | null
      category?: string
    },
  ) => post<Highlight>(`/api/meetings/${meetingId}/highlights`, body),

  deleteHighlight: (id: number) => request<void>(`/api/highlights/${id}`, { method: 'DELETE' }),

  createClip: (body: { meeting_id: number; title: string; start_time: number; end_time: number }) =>
    post<Clip>('/api/clips', body),

  clip: (token: string) => request<SharedClip>(`/api/clips/${token}`),

  startRecording: (platform: string) =>
    post<{ recording_id: string; platform: string }>('/api/recordings/start', { platform }),

  stopRecording: (id: string) =>
    post<{ meeting_id: number; title: string }>(`/api/recordings/${id}/stop`, {}),
}
