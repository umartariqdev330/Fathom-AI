import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import type { SearchHit } from '../types'
import { api } from '../lib/api'
import { meetingDate, timecode } from '../lib/format'
import { PageHeader } from '../components/AppLayout'
import { Badge, EmptyState, Skeleton, cx } from '../components/ui'

const KIND_LABEL: Record<SearchHit['kind'], string> = {
  transcript: 'Transcript',
  title: 'Meeting title',
  summary: 'Summary',
  'action-item': 'Action item',
  highlight: 'Highlight',
  participant: 'Participant',
}

const SUGGESTIONS = ['deploy', 'redaction', 'pgvector', 'churn', 'search', 'Priya']

export function SearchPage() {
  const [params, setParams] = useSearchParams()
  const [value, setValue] = useState(params.get('q') ?? '')
  const [query, setQuery] = useState(value)
  const [focused, setFocused] = useState<number | null>(null)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => input.current?.focus(), [])

  // Debounced so typing does not fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(value)
      setParams(value ? { q: value } : {}, { replace: true })
      setFocused(null)
    }, 200)
    return () => clearTimeout(timer)
  }, [value, setParams])

  const { data, isFetching } = useQuery({
    queryKey: ['search', query],
    queryFn: () => api.search(query),
    enabled: query.trim().length > 1,
  })

  const groups = useMemo(() => {
    const byMeeting = new Map<number, SearchHit[]>()
    data?.hits.forEach((hit) =>
      byMeeting.set(hit.meeting_id, [...(byMeeting.get(hit.meeting_id) ?? []), hit]),
    )
    return [...byMeeting.values()]
  }, [data])

  const shown = focused === null ? groups : groups.filter((hits) => hits[0].meeting_id === focused)
  const idle = query.trim().length <= 1

  return (
    <div className="pb-14">
      <PageHeader
        title="Search"
        subtitle="Across every transcript, summary, action item and highlight."
      />

      <div className="relative mt-5">
        <Search
          size={18}
          className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-faint"
        />
        <input
          ref={input}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Search everything you have recorded"
          aria-label="Search meetings"
          className="h-14 w-full border border-line bg-surface pr-11 pl-12 text-lg outline-none placeholder:text-ink-faint focus:border-accent"
        />
        {value && (
          <button
            onClick={() => setValue('')}
            aria-label="Clear search"
            className="absolute top-1/2 right-4 -translate-y-1/2 text-ink-faint transition hover:text-ink"
          >
            <X size={17} />
          </button>
        )}
      </div>

      {idle && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-[13px] text-ink-faint">Try</span>
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setValue(suggestion)}
              className="border border-line bg-surface px-2.5 py-1 text-[13px] text-ink-soft transition hover:border-line-strong hover:text-ink"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {isFetching && !idle && (
        <div className="mt-6 space-y-2.5">
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} className="h-20 w-full" />
          ))}
        </div>
      )}

      {data && !isFetching && data.total === 0 && (
        <EmptyState
          icon={<Search size={22} />}
          title={`Nothing matched “${data.query}”`}
          description="Try a shorter phrase, or a person's name."
        />
      )}

      {data && !isFetching && data.total > 0 && (
        <div className="mt-6 gap-8 lg:grid lg:grid-cols-[208px_minmax(0,1fr)]">
          {/* Which calls the phrase turns up in is itself an answer, so the
              breakdown is a filter rather than a line of prose. */}
          <aside className="mb-5 lg:mb-0" aria-label="Meetings matched">
            <div className="lg:sticky lg:top-[4.5rem]">
              <p className="mb-1.5 text-[10px] font-semibold tracking-[0.12em] text-ink-faint uppercase">
                {data.total} results in {groups.length}{' '}
                {groups.length === 1 ? 'meeting' : 'meetings'}
              </p>

              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-slim lg:block lg:overflow-visible lg:pb-0">
                <MeetingFilter active={focused === null} onClick={() => setFocused(null)}>
                  All meetings
                </MeetingFilter>
                {groups.map((hits) => (
                  <MeetingFilter
                    key={hits[0].meeting_id}
                    active={focused === hits[0].meeting_id}
                    count={hits.length}
                    onClick={() => setFocused(hits[0].meeting_id)}
                  >
                    {hits[0].meeting_title}
                  </MeetingFilter>
                ))}
              </div>
            </div>
          </aside>

          <div className="min-w-0 space-y-7">
            {shown.map((hits) => (
              <section key={hits[0].meeting_id}>
                <div className="mb-2 flex items-baseline gap-2 border-b border-line pb-1.5">
                  <Link
                    to={`/meetings/${hits[0].meeting_id}`}
                    className="truncate text-sm font-semibold text-ink transition hover:text-accent"
                  >
                    {hits[0].meeting_title}
                  </Link>
                  <span className="shrink-0 text-[11px] text-ink-faint">
                    {meetingDate(hits[0].meeting_date)}
                  </span>
                </div>

                <ul>
                  {hits.map((hit, index) => (
                    <li key={`${hit.kind}-${index}`}>
                      <Link
                        to={`/meetings/${hit.meeting_id}${hit.timestamp !== null ? `?t=${Math.floor(hit.timestamp)}` : ''}`}
                        className="flex gap-4 border-b border-line py-2.5 transition-colors hover:bg-raised/40"
                      >
                        <div className="flex w-20 shrink-0 flex-col items-start gap-1">
                          <Badge>{KIND_LABEL[hit.kind]}</Badge>
                          {hit.timestamp !== null && (
                            <span className="font-mono text-[11px] text-ink-faint">
                              {timecode(hit.timestamp)}
                            </span>
                          )}
                        </div>
                        <p className="min-w-0 text-[13.5px] leading-[1.65] text-ink-soft">
                          {hit.speaker && <span className="font-medium text-ink">{hit.speaker}: </span>}
                          {mark(hit.text, data.query)}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function MeetingFilter({
  active,
  count,
  onClick,
  children,
}: {
  active: boolean
  count?: number
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        'flex w-auto shrink-0 items-center gap-2 border px-2.5 py-1.5 text-left text-[13px] whitespace-nowrap transition lg:w-full lg:border-0 lg:border-l-2 lg:py-1.5 lg:whitespace-normal',
        active
          ? 'border-accent bg-accent-soft text-accent-ink lg:bg-transparent lg:font-medium lg:text-accent'
          : 'border-line bg-surface text-ink-soft hover:text-ink lg:bg-transparent',
      )}
    >
      <span className="truncate lg:line-clamp-2 lg:whitespace-normal">{children}</span>
      {count !== undefined && (
        <span className="ml-auto shrink-0 font-mono text-[11px] text-ink-faint">{count}</span>
      )}
    </button>
  )
}

function mark(text: string, query: string) {
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig'))
  return parts.map((part, index) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={index} className="rounded bg-caution/25 text-ink">
        {part}
      </mark>
    ) : (
      part
    ),
  )
}
