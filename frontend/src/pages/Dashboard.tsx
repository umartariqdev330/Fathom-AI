import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, CalendarDays, Clock, ListTodo, Star, Video } from 'lucide-react'
import { api } from '../lib/api'
import { greeting } from '../lib/format'
import { CURRENT_USER, PageHeader } from '../components/AppLayout'
import { MeetingListItem, UpcomingRow } from '../components/MeetingListItem'
import { Card, EmptyState, Skeleton } from '../components/ui'

export function Dashboard() {
  const meetings = useQuery({ queryKey: ['meetings', 'recorded'], queryFn: () => api.meetings() })
  const calendar = useQuery({ queryKey: ['calendar'], queryFn: api.calendar })
  const stats = useQuery({ queryKey: ['stats'], queryFn: api.stats })

  const firstName = CURRENT_USER.name.split(' ')[0]

  return (
    <div>
      <PageHeader
        title={`${greeting()}, ${firstName}`}
        subtitle="Everything from your recent calls, already written up."
      />

      <div className="space-y-7 px-5 py-6 lg:px-8">
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
    <Card className="p-4 transition hover:border-line-strong">
      <div className="flex items-center gap-1.5 text-ink-faint">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      {loading ? (
        <Skeleton className="mt-2 h-7 w-12" />
      ) : (
        <p className="mt-1.5 text-2xl font-semibold tracking-tight text-ink">{value ?? 0}</p>
      )}
    </Card>
  )

  return to ? <Link to={to}>{body}</Link> : body
}
