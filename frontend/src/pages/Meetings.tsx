import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { LayoutGrid, List, Search, Video } from 'lucide-react'
import { api } from '../lib/api'
import { PageHeader } from '../components/AppLayout'
import { MeetingListItem, MeetingTile } from '../components/MeetingListItem'
import { Card, EmptyState, ErrorState, Skeleton, cx } from '../components/ui'

type Sort = 'newest' | 'oldest'
type View = 'list' | 'grid'

export function Meetings() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['meetings', 'recorded'],
    queryFn: () => api.meetings(),
  })

  const [query, setQuery] = useState('')
  const [type, setType] = useState('all')
  const [person, setPerson] = useState('all')
  const [sort, setSort] = useState<Sort>('newest')
  const [view, setView] = useState<View>('list')

  const people = useMemo(() => {
    const names = new Set<string>()
    data?.forEach((meeting) => meeting.participants.forEach((p) => names.add(p.name)))
    return [...names].sort()
  }, [data])

  const meetings = useMemo(() => {
    const needle = query.trim().toLowerCase()

    return (data ?? [])
      .filter((meeting) => {
        if (type !== 'all' && meeting.meeting_type !== type) return false
        if (person !== 'all' && !meeting.participants.some((p) => p.name === person)) return false
        if (!needle) return true
        return (
          meeting.title.toLowerCase().includes(needle) ||
          (meeting.overview ?? '').toLowerCase().includes(needle)
        )
      })
      .sort((a, b) =>
        sort === 'newest'
          ? Date.parse(b.date) - Date.parse(a.date)
          : Date.parse(a.date) - Date.parse(b.date),
      )
  }, [data, query, type, person, sort])

  const select =
    'h-9 rounded-lg border border-line bg-surface px-2.5 text-sm text-ink-soft outline-none focus:border-accent'

  return (
    <div>
      <PageHeader
        title="Meetings"
        subtitle={data ? `${data.length} recorded meetings` : 'Loading your meetings'}
      />

      <div className="px-5 py-5 lg:px-8">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search
              size={15}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-faint"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter by title or summary"
              aria-label="Filter meetings"
              className="h-9 w-full rounded-lg border border-line bg-surface pr-3 pl-9 text-sm outline-none placeholder:text-ink-faint focus:border-accent"
            />
          </div>

          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
            aria-label="Filter by meeting type"
            className={select}
          >
            <option value="all">All types</option>
            <option value="Internal">Internal</option>
            <option value="External">External</option>
          </select>

          <select
            value={person}
            onChange={(event) => setPerson(event.target.value)}
            aria-label="Filter by participant"
            className={select}
          >
            <option value="all">Anyone</option>
            {people.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as Sort)}
            aria-label="Sort meetings"
            className={select}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>

          <div className="flex rounded-lg border border-line bg-surface p-0.5">
            {([
              { id: 'list' as const, icon: List, label: 'List view' },
              { id: 'grid' as const, icon: LayoutGrid, label: 'Grid view' },
            ]).map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setView(id)}
                aria-label={label}
                aria-pressed={view === id}
                className={cx(
                  'rounded-md p-1.5 transition',
                  view === id ? 'bg-raised text-ink' : 'text-ink-faint hover:text-ink',
                )}
              >
                <Icon size={15} />
              </button>
            ))}
          </div>
        </div>

        {isLoading && (
          <div className="space-y-2.5">
            {[0, 1, 2, 3, 4].map((key) => (
              <Skeleton key={key} className="h-[104px] w-full" />
            ))}
          </div>
        )}

        {error && <ErrorState message={(error as Error).message} onRetry={refetch} />}

        {data && meetings.length === 0 && (
          <Card>
            <EmptyState
              icon={<Video size={22} />}
              title="No meetings match"
              description="Try a different filter or clear the search."
            />
          </Card>
        )}

        {meetings.length > 0 &&
          (view === 'list' ? (
            <ul className="space-y-2.5">
              {meetings.map((meeting) => (
                <MeetingListItem key={meeting.id} meeting={meeting} />
              ))}
            </ul>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {meetings.map((meeting) => (
                <MeetingTile key={meeting.id} meeting={meeting} />
              ))}
            </ul>
          ))}
      </div>
    </div>
  )
}
