import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { LayoutGrid, Rows3, Search, Video, X } from 'lucide-react'
import { api } from '../lib/api'
import { byDay } from '../lib/format'
import { PageHeader } from '../components/AppLayout'
import { MeetingTile } from '../components/MeetingListItem'
import { DayHeading, MeetingRow } from '../components/MeetingRow'
import { EmptyState, ErrorState, Skeleton, cx } from '../components/ui'

type Sort = 'newest' | 'oldest'
type View = 'rows' | 'grid'

export function Meetings() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['meetings', 'recorded'],
    queryFn: () => api.meetings(),
  })

  const [query, setQuery] = useState('')
  const [type, setType] = useState('all')
  const [person, setPerson] = useState('all')
  const [sort, setSort] = useState<Sort>('newest')
  const [view, setView] = useState<View>('rows')

  // Counts come from the unfiltered set, so a name never reads as "0" just
  // because another filter is currently hiding it.
  const people = useMemo(() => {
    const counts = new Map<string, number>()
    data?.forEach((meeting) =>
      meeting.participants.forEach((p) => counts.set(p.name, (counts.get(p.name) ?? 0) + 1)),
    )
    return [...counts].sort((a, b) => b[1] - a[1])
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

  const filtered = type !== 'all' || person !== 'all' || query.trim() !== ''
  // Nothing recorded yet and nothing matching a filter are different problems,
  // and only one of them is solved by clearing the filter.
  const empty = data?.length === 0

  return (
    <div className="pb-14">
      <PageHeader
        title="Meetings"
        subtitle={data ? `${data.length} recorded meetings` : 'Loading your meetings'}
      />

      <div
        className={cx('mt-5 gap-8', !empty && 'lg:grid lg:grid-cols-[176px_minmax(0,1fr)]')}
      >
        {!empty && (
          <FilterRail
          type={type}
          onType={setType}
          sort={sort}
          onSort={setSort}
          person={person}
          onPerson={setPerson}
            people={people}
          />
        )}

        <div className="min-w-0">
          {!empty && (
            <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search
                size={15}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-faint"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Filter by title or summary"
                aria-label="Filter meetings"
                className="h-9 w-full border border-line bg-surface pr-8 pl-9 text-sm outline-none placeholder:text-ink-faint focus:border-accent"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  aria-label="Clear filter"
                  className="absolute top-1/2 right-2 -translate-y-1/2 text-ink-faint hover:text-ink"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex border border-line bg-surface p-0.5">
              {(
                [
                  { id: 'rows' as const, icon: Rows3, label: 'Row view' },
                  { id: 'grid' as const, icon: LayoutGrid, label: 'Grid view' },
                ]
              ).map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setView(id)}
                  aria-label={label}
                  aria-pressed={view === id}
                  className={cx(
                    'p-1.5 transition',
                    view === id ? 'bg-raised text-ink' : 'text-ink-faint hover:text-ink',
                  )}
                >
                  <Icon size={15} />
                </button>
              ))}
              </div>
            </div>
          )}

          {filtered && data && (
            <p className="mt-2.5 text-xs text-ink-faint">
              {meetings.length} of {data.length} meetings
            </p>
          )}

          {isLoading && (
            <div className="mt-4 space-y-2.5">
              {[0, 1, 2, 3, 4].map((key) => (
                <Skeleton key={key} className="h-20 w-full" />
              ))}
            </div>
          )}

          {error && (
            <div className="mt-4">
              <ErrorState message={(error as Error).message} onRetry={refetch} />
            </div>
          )}

          {data && meetings.length === 0 && (
            <EmptyState
              icon={<Video size={22} />}
              title={empty ? 'No meetings yet' : 'No meetings match'}
              description={
                empty
                  ? 'Press Record, share the tab your call is running in, and Meetly will transcribe and summarise it.'
                  : 'Try a different filter or clear the search.'
              }
            />
          )}

          {meetings.length > 0 &&
            (view === 'rows' ? (
              <div className="mt-2">
                {byDay(meetings).map(([day, group]) => (
                  <div key={day}>
                    <DayHeading label={day} count={group.length} />
                    <ul>
                      {group.map((meeting) => (
                        <MeetingRow key={meeting.id} meeting={meeting} />
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <ul className="mt-4 grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                {meetings.map((meeting) => (
                  <MeetingTile key={meeting.id} meeting={meeting} />
                ))}
              </ul>
            ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Filters live in a rail rather than a toolbar: they are the state of the page,
 * and a rail keeps every option and its current value visible while you scroll.
 * Below lg it folds into a scrolling row above the list.
 */
function FilterRail({
  type,
  onType,
  sort,
  onSort,
  person,
  onPerson,
  people,
}: {
  type: string
  onType: (value: string) => void
  sort: Sort
  onSort: (value: Sort) => void
  person: string
  onPerson: (value: string) => void
  people: [string, number][]
}) {
  return (
    <aside className="mb-4 lg:mb-0" aria-label="Filters">
      <div className="lg:sticky lg:top-[4.5rem] lg:space-y-6">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-slim lg:block lg:space-y-6 lg:overflow-visible lg:pb-0">
          <Group label="Type">
            {[
              ['all', 'All'],
              ['Internal', 'Internal'],
              ['External', 'External'],
            ].map(([value, label]) => (
              <Choice key={value} active={type === value} onClick={() => onType(value)}>
                {label}
              </Choice>
            ))}
          </Group>

          <Group label="Order">
            {(
              [
                ['newest', 'Newest first'],
                ['oldest', 'Oldest first'],
              ] as [Sort, string][]
            ).map(([value, label]) => (
              <Choice key={value} active={sort === value} onClick={() => onSort(value)}>
                {label}
              </Choice>
            ))}
          </Group>
        </div>

        <Group label="Person" className="hidden lg:block">
          <div className="max-h-64 overflow-y-auto scrollbar-slim">
            <Choice active={person === 'all'} onClick={() => onPerson('all')}>
              Anyone
            </Choice>
            {people.map(([name, count]) => (
              <Choice key={name} active={person === name} onClick={() => onPerson(name)} count={count}>
                {name}
              </Choice>
            ))}
          </div>
        </Group>

        <label className="block lg:hidden">
          <span className="sr-only">Filter by participant</span>
          <select
            value={person}
            onChange={(event) => onPerson(event.target.value)}
            className="h-9 w-full border border-line bg-surface px-2.5 text-sm text-ink-soft outline-none focus:border-accent"
          >
            <option value="all">Anyone</option>
            {people.map(([name]) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>
    </aside>
  )
}

function Group({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cx('shrink-0', className)}>
      <p className="mb-1.5 hidden text-[10px] font-semibold tracking-[0.12em] text-ink-faint uppercase lg:block">
        {label}
      </p>
      <div className="flex gap-1.5 lg:block lg:gap-0">{children}</div>
    </div>
  )
}

function Choice({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean
  onClick: () => void
  count?: number
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        'flex w-auto shrink-0 items-center gap-2 border px-2.5 py-1.5 text-[13px] whitespace-nowrap transition lg:w-full lg:border-0 lg:border-l-2 lg:py-1 lg:pr-1',
        active
          ? 'border-accent bg-accent-soft text-accent-ink lg:bg-transparent lg:font-medium lg:text-accent'
          : 'border-line bg-surface text-ink-soft hover:text-ink lg:border-line lg:bg-transparent',
      )}
    >
      <span className="truncate">{children}</span>
      {count !== undefined && (
        <span className="ml-auto hidden font-mono text-[11px] text-ink-faint lg:inline">{count}</span>
      )}
    </button>
  )
}
