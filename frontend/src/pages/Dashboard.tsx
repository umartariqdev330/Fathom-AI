import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, CalendarDays, KeyRound, Sparkles, Video } from 'lucide-react'
import type { AiSettings, MeetingCard } from '../types'
import { api } from '../lib/api'
import { byDay, durationLabel, greeting, meetingTime, relativeDay } from '../lib/format'
import { CURRENT_USER, PageHeader } from '../components/AppLayout'
import { DayHeading, MeetingRow } from '../components/MeetingRow'
import { AvatarStack, Badge, EmptyState, Skeleton } from '../components/ui'

export function Dashboard() {
  const meetings = useQuery({ queryKey: ['meetings', 'recorded'], queryFn: () => api.meetings() })
  const calendar = useQuery({ queryKey: ['calendar'], queryFn: api.calendar })
  const stats = useQuery({ queryKey: ['stats'], queryFn: api.stats })
  const aiSettings = useQuery({ queryKey: ['ai-settings'], queryFn: api.aiSettings })

  const recent = (meetings.data ?? []).slice(0, 8)

  return (
    <div className="pb-14">
      <PageHeader
        title={`${greeting()}, ${CURRENT_USER.name.split(' ')[0]}`}
        subtitle={
          recent.length === 0
            ? 'Record a call and it will be transcribed, summarised and searchable here.'
            : 'Everything from your recent calls, already written up.'
        }
      />

      <div className="mt-5 space-y-7">
        <AiKeyBanner settings={aiSettings.data} isLoading={aiSettings.isLoading} />

        {/* One ribbon rather than four tiles: these are four readings of the same
            week, so they belong on one line instead of in four boxes. */}
        <dl className="grid grid-cols-2 divide-line border-y border-line sm:grid-cols-4 sm:divide-x">
          <Figure label="Meetings this week" value={stats.data?.meetings_this_week} loading={stats.isLoading} />
          <Figure label="Hours recorded" value={stats.data?.hours_recorded} loading={stats.isLoading} />
          <Figure label="Open action items" value={stats.data?.open_action_items} loading={stats.isLoading} to="/meetings" />
          <Figure label="Highlights" value={stats.data?.highlights} loading={stats.isLoading} to="/highlights" />
        </dl>

        <UpcomingStrip
          meetings={calendar.data?.upcoming.slice(0, 6) ?? []}
          loading={calendar.isLoading}
        />

        <section aria-labelledby="recent-heading">
          <div className="mb-1 flex items-center justify-between">
            <h2 id="recent-heading" className="text-sm font-semibold text-ink">
              Recent meetings
            </h2>
            <Link
              to="/meetings"
              className="flex items-center gap-1 text-xs font-medium text-ink-soft transition hover:text-accent"
            >
              All meetings
              <ArrowRight size={13} />
            </Link>
          </div>

          {meetings.isLoading && (
            <div className="space-y-2.5 pt-3">
              {[0, 1, 2, 3].map((key) => (
                <Skeleton key={key} className="h-20 w-full" />
              ))}
            </div>
          )}

          {meetings.data &&
            (recent.length === 0 ? (
              <EmptyState
                icon={<Video size={22} />}
                title="No meetings yet"
                description="Record one to see the transcript, summary and action items here."
              />
            ) : (
              byDay(recent).map(([day, group]) => (
                <div key={day}>
                  <DayHeading label={day} count={group.length} />
                  <ul>
                    {group.map((meeting) => (
                      <MeetingRow key={meeting.id} meeting={meeting} />
                    ))}
                  </ul>
                </div>
              ))
            ))}
        </section>
      </div>
    </div>
  )
}

function Figure({
  label,
  value,
  loading,
  to,
}: {
  label: string
  value?: number
  loading: boolean
  to?: string
}) {
  const body = (
    <div className="px-1 py-3.5 sm:px-4">
      <dt className="text-[11px] tracking-[0.06em] text-ink-faint uppercase">{label}</dt>
      <dd className="mt-1">
        {loading ? (
          <Skeleton className="h-7 w-12" />
        ) : (
          <span className="text-[26px] leading-none font-semibold tabular-nums text-ink">
            {value ?? 0}
          </span>
        )}
      </dd>
    </div>
  )

  return to ? (
    <Link to={to} className="transition-colors hover:bg-raised/50">
      {body}
    </Link>
  ) : (
    body
  )
}

/**
 * Upcoming calls run across the page rather than down a sidebar. They are read
 * once, in time order, and then ignored — a horizontal strip says that.
 */
function UpcomingStrip({ meetings, loading }: { meetings: MeetingCard[]; loading: boolean }) {
  return (
    <section aria-labelledby="upcoming-heading">
      <div className="mb-2.5 flex items-center justify-between">
        <h2 id="upcoming-heading" className="text-sm font-semibold text-ink">
          Coming up
        </h2>
        <Link
          to="/calendar"
          className="flex items-center gap-1 text-xs font-medium text-ink-soft transition hover:text-accent"
        >
          Calendar
          <ArrowRight size={13} />
        </Link>
      </div>

      {loading && (
        <div className="flex gap-3">
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} className="h-24 w-64 shrink-0" />
          ))}
        </div>
      )}

      {!loading && meetings.length === 0 && (
        <div className="flex items-center gap-2.5 border border-dashed border-line px-4 py-3.5 text-[13px] text-ink-soft">
          <CalendarDays size={16} className="text-ink-faint" />
          Nothing scheduled. Connect a calendar to see what is coming up.
        </div>
      )}

      {meetings.length > 0 && (
        <ul className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-slim lg:-mx-7 lg:px-7">
          {meetings.map((meeting) => (
            <li
              key={meeting.id}
              className="w-64 shrink-0 border border-line bg-surface p-3.5 transition-colors hover:border-line-strong"
            >
              <div className="flex items-baseline gap-2">
                <span className="text-[11px] font-semibold text-accent">
                  {relativeDay(meeting.date)}
                </span>
                <span className="font-mono text-[11px] text-ink-faint">
                  {meetingTime(meeting.date)}
                </span>
              </div>
              <p className="mt-1.5 line-clamp-2 text-[13.5px] leading-snug font-medium text-ink">
                {meeting.title}
              </p>
              <div className="mt-2.5 flex items-center justify-between gap-2">
                <span className="text-[11px] text-ink-faint">
                  {durationLabel(meeting.duration)}
                  {meeting.platform && ` · ${meeting.platform}`}
                </span>
                <AvatarStack
                  names={meeting.participants.map((person) => person.name)}
                  max={3}
                  size={20}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function AiKeyBanner({ settings, isLoading }: { settings?: AiSettings; isLoading: boolean }) {
  if (isLoading) return <Skeleton className="h-14 w-full" />

  const ready = settings?.configured && settings.key_source === 'saved'

  if (!ready) {
    return (
      <div className="flex flex-col justify-between gap-3 border-l-2 border-caution bg-caution/5 px-4 py-3 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <KeyRound size={17} className="mt-0.5 shrink-0 text-caution" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-ink">OpenAI API key not set</span>
              <Badge tone="caution">Setup required</Badge>
            </div>
            <p className="mt-0.5 text-xs text-ink-soft">
              Whisper transcription and AI summaries need a key. Add one in Settings to turn on
              live AI features.
            </p>
          </div>
        </div>
        <Link
          to="/settings"
          className="inline-flex shrink-0 items-center gap-1.5 self-start text-xs font-semibold text-caution transition hover:underline sm:self-center"
        >
          Go to Settings
          <ArrowRight size={13} />
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col justify-between gap-3 border-l-2 border-positive bg-positive/5 px-4 py-2.5 sm:flex-row sm:items-center">
      <div className="flex items-center gap-3">
        <Sparkles size={17} className="shrink-0 text-positive" />
        <p className="text-xs text-ink-soft">
          <span className="font-semibold text-ink">AI is connected.</span> Summaries run on{' '}
          <span className="font-medium text-ink-soft">{settings.summary_model}</span>, Whisper
          transcription ready
          {settings.masked_key && (
            <span className="hidden font-mono text-ink-faint sm:inline"> · {settings.masked_key}</span>
          )}
        </p>
      </div>
      <Link
        to="/settings"
        className="shrink-0 text-xs font-medium text-ink-soft transition hover:text-accent"
      >
        Manage
      </Link>
    </div>
  )
}
