import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, CalendarDays, Clock, KeyRound, ListTodo, Sparkles, Star, Video } from 'lucide-react'
import { api } from '../lib/api'
import { greeting } from '../lib/format'
import { CURRENT_USER, PageHeader } from '../components/AppLayout'
import { MeetingListItem, UpcomingRow } from '../components/MeetingListItem'
import { Badge, Card, EmptyState, Skeleton } from '../components/ui'
import type { AiSettings } from '../types'

export function Dashboard() {
  const meetings = useQuery({ queryKey: ['meetings', 'recorded'], queryFn: () => api.meetings() })
  const calendar = useQuery({ queryKey: ['calendar'], queryFn: api.calendar })
  const stats = useQuery({ queryKey: ['stats'], queryFn: api.stats })
  const aiSettings = useQuery({ queryKey: ['ai-settings'], queryFn: api.aiSettings })

  const firstName = CURRENT_USER.name.split(' ')[0]

  return (
    <div>
      <PageHeader
        title={`${greeting()}, ${firstName}`}
        subtitle="Everything from your recent calls, already written up."
      />

      <div className="space-y-6 px-5 py-6 lg:px-8">
        <AiKeyBanner settings={aiSettings.data} isLoading={aiSettings.isLoading} />

        <section aria-label="This week at a glance">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat
              icon={<Video size={15} />}
              label="Meetings this week"
              value={stats.data?.meetings_this_week}
              loading={stats.isLoading}
            />
            <Stat
              icon={<Clock size={15} />}
              label="Hours recorded"
              value={stats.data?.hours_recorded}
              loading={stats.isLoading}
            />
            <Stat
              icon={<ListTodo size={15} />}
              label="Open action items"
              value={stats.data?.open_action_items}
              loading={stats.isLoading}
              to="/meetings"
            />
            <Stat
              icon={<Star size={15} />}
              label="Highlights"
              value={stats.data?.highlights}
              loading={stats.isLoading}
              to="/highlights"
            />
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section aria-labelledby="recent-heading">
            <SectionHeader id="recent-heading" title="Recent meetings" to="/meetings" />

            {meetings.isLoading && (
              <div className="space-y-2.5">
                {[0, 1, 2, 3].map((key) => (
                  <Skeleton key={key} className="h-[104px] w-full" />
                ))}
              </div>
            )}

            {meetings.data && (
              <ul className="space-y-2.5">
                {meetings.data.slice(0, 6).map((meeting) => (
                  <MeetingListItem key={meeting.id} meeting={meeting} />
                ))}
              </ul>
            )}

            {meetings.data?.length === 0 && (
              <Card>
                <EmptyState
                  icon={<Video size={22} />}
                  title="No meetings yet"
                  description="Record one to see the transcript, summary and action items here."
                />
              </Card>
            )}
          </section>

          <section aria-labelledby="upcoming-heading">
            <SectionHeader id="upcoming-heading" title="Upcoming" to="/calendar" />

            {calendar.isLoading && (
              <div className="space-y-2.5">
                {[0, 1, 2].map((key) => (
                  <Skeleton key={key} className="h-[68px] w-full" />
                ))}
              </div>
            )}

            {calendar.data && calendar.data.upcoming.length > 0 && (
              <ul className="space-y-2.5">
                {calendar.data.upcoming.slice(0, 5).map((meeting) => (
                  <UpcomingRow key={meeting.id} meeting={meeting} />
                ))}
              </ul>
            )}

            {calendar.data?.upcoming.length === 0 && (
              <Card>
                <EmptyState
                  icon={<CalendarDays size={22} />}
                  title="Nothing scheduled"
                  description="Connect a calendar to see what is coming up."
                />
              </Card>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

function SectionHeader({ id, title, to }: { id: string; title: string; to: string }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 id={id} className="text-sm font-semibold text-ink">
        {title}
      </h2>
      <Link
        to={to}
        className="flex items-center gap-1 text-xs font-medium text-ink-soft transition hover:text-accent"
      >
        View all
        <ArrowRight size={13} />
      </Link>
    </div>
  )
}

function Stat({
  icon,
  label,
  value,
  loading,
  to,
}: {
  icon: React.ReactNode
  label: string
  value?: number
  loading: boolean
  to?: string
}) {
  const body = (
    <Card className="flex items-center gap-3 p-3.5 transition-colors hover:border-line-strong">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-raised text-ink-soft">
        {icon}
      </span>
      <div className="min-w-0">
        {loading ? (
          <Skeleton className="h-6 w-10" />
        ) : (
          <p className="text-xl font-semibold text-ink tabular-nums">{value ?? 0}</p>
        )}
        <p className="mt-0.5 truncate text-xs text-ink-faint">{label}</p>
      </div>
    </Card>
  )

  return to ? (
    <Link to={to} className="block">
      {body}
    </Link>
  ) : (
    body
  )
}

function AiKeyBanner({ settings, isLoading }: { settings?: AiSettings; isLoading: boolean }) {
  if (isLoading) {
    return <Skeleton className="h-14 w-full rounded-xl" />
  }

  if (!settings || !settings.configured || settings.key_source !== 'saved') {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-caution/30 bg-caution/5 px-4 py-3 text-sm">
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-caution/15 text-caution">
            <KeyRound size={17} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-ink">OpenAI API Key Not Set</span>
              <Badge tone="caution">Setup Required</Badge>
            </div>
            <p className="mt-0.5 text-xs text-ink-soft">
              Real Whisper transcription and AI meeting summaries require an OpenAI key. Configure it in Settings to enable live AI features.
            </p>
          </div>
        </div>
        <Link
          to="/settings"
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-caution/15 px-3 py-1.5 text-xs font-semibold text-caution transition-colors hover:bg-caution/25"
        >
          <span>Go to Settings</span>
          <ArrowRight size={13} />
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-positive/10 text-positive">
          <Sparkles size={17} />
        </span>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-ink">OpenAI API Key Active</span>
            <Badge tone="positive">Connected</Badge>
            {settings.masked_key && (
              <span className="font-mono text-xs text-ink-faint hidden sm:inline">
                ({settings.masked_key})
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-ink-faint">
            AI summaries enabled with <span className="font-medium text-ink-soft">{settings.summary_model}</span> · Whisper transcription ready
          </p>
        </div>
      </div>
      <Link
        to="/settings"
        className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-ink-soft hover:text-accent transition-colors"
      >
        <span>Manage in Settings</span>
        <ArrowRight size={13} />
      </Link>
    </div>
  )
}

