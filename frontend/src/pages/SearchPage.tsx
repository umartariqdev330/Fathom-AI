import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import type { SearchHit } from '../types'
import { api } from '../lib/api'
import { meetingDate, timecode } from '../lib/format'
import { PageHeader } from '../components/AppLayout'
import { Badge, EmptyState, Skeleton } from '../components/ui'

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
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => input.current?.focus(), [])

  // Debounced so typing does not fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(value)
      setParams(value ? { q: value } : {}, { replace: true })
    }, 200)
    return () => clearTimeout(timer)
  }, [value, setParams])

  const { data, isFetching } = useQuery({
    queryKey: ['search', query],
    queryFn: () => api.search(query),
    enabled: query.trim().length > 1,
  })

  const grouped = useMemo(() => {
    const byMeeting = new Map<number, SearchHit[]>()
    data?.hits.forEach((hit) => {
      const list = byMeeting.get(hit.meeting_id) ?? []
      list.push(hit)
      byMeeting.set(hit.meeting_id, list)
    })
    return [...byMeeting.values()]
  }, [data])

  return (
    <div>
      <PageHeader title="Search" subtitle="Across every transcript, summary, action item and highlight." />

      <div className="mx-auto max-w-4xl px-5 py-5 lg:px-8">
        <div className="relative mb-4">
          <Search
            size={17}
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-faint"
          />
          <input
            ref={input}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Search everything you have recorded"
            aria-label="Search meetings"
            className="h-11 w-full rounded-xl border border-line bg-surface pr-4 pl-11 text-[15px] outline-none placeholder:text-ink-faint focus:border-accent"
          />
        </div>

        {query.trim().length <= 1 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-ink-soft">Try</span>
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setValue(suggestion)}
                className="rounded-lg border border-line bg-surface px-2.5 py-1 text-sm text-ink-soft transition hover:border-line-strong hover:text-ink"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {isFetching && query.trim().length > 1 && (
          <div className="space-y-2.5">
            {[0, 1, 2].map((key) => (
              <Skeleton key={key} className="h-24 w-full" />
            ))}
          </div>
        )}

        {data && !isFetching && (
          <>
            <p className="mb-3 text-sm text-ink-soft">
              {data.total === 0
                ? `Nothing matched “${data.query}”.`
                : `${data.total} result${data.total === 1 ? '' : 's'} across ${grouped.length} meeting${grouped.length === 1 ? '' : 's'}`}
            </p>

            {data.total === 0 ? (
              <EmptyState
                icon={<Search size={22} />}
                title="No matches"
                description="Try a shorter phrase, or a person's name."
              />
            ) : (
              <div className="space-y-4">
                {grouped.map((hits) => (
                  <section key={hits[0].meeting_id}>
                    <div className="mb-1.5 flex items-baseline gap-2">
                      <Link
                        to={`/meetings/${hits[0].meeting_id}`}
                        className="text-sm font-semibold text-ink hover:text-accent"
                      >
                        {hits[0].meeting_title}
                      </Link>
                      <span className="text-xs text-ink-faint">
                        {meetingDate(hits[0].meeting_date)}
                      </span>
                    </div>

                    <ul className="space-y-1.5">
                      {hits.map((hit, index) => (
                        <li key={`${hit.kind}-${index}`}>
                          <Link
                            to={`/meetings/${hit.meeting_id}${hit.timestamp !== null ? `?t=${Math.floor(hit.timestamp)}` : ''}`}
                            className="flex gap-3 rounded-lg border border-line bg-surface p-3 transition hover:border-line-strong hover:bg-raised/40"
                          >
                            <div className="flex w-20 shrink-0 flex-col gap-1">
                              <Badge>{KIND_LABEL[hit.kind]}</Badge>
                              {hit.timestamp !== null && (
                                <span className="font-mono text-[11px] text-ink-faint">
                                  {timecode(hit.timestamp)}
                                </span>
                              )}
                            </div>
                            <p className="min-w-0 text-sm leading-relaxed text-ink-soft">
                              {hit.speaker && (
                                <span className="font-medium text-ink">{hit.speaker}: </span>
                              )}
                              {mark(hit.text, data.query)}
                            </p>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
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
