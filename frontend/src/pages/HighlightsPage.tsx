import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Play, Star } from 'lucide-react'
import type { Highlight } from '../types'
import { api } from '../lib/api'
import { timecode } from '../lib/format'
import { PageHeader } from '../components/AppLayout'
import { EmptyState, Skeleton, cx } from '../components/ui'

const CATEGORIES: { value: Highlight['category'] | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'key-moment', label: 'Key moments' },
  { value: 'decision', label: 'Decisions' },
  { value: 'risk', label: 'Risks' },
  { value: 'insight', label: 'Insights' },
]

/** Category shows as a coloured rule down the quote rather than a badge. */
const RULE: Record<Highlight['category'], string> = {
  'key-moment': 'border-accent',
  decision: 'border-positive',
  risk: 'border-critical',
  insight: 'border-caution',
}

const LABEL: Record<Highlight['category'], string> = {
  'key-moment': 'Key moment',
  decision: 'Decision',
  risk: 'Risk',
  insight: 'Insight',
}

const INK: Record<Highlight['category'], string> = {
  'key-moment': 'text-accent',
  decision: 'text-positive',
  risk: 'text-critical',
  insight: 'text-caution',
}

export function HighlightsPage() {
  const highlights = useQuery({ queryKey: ['highlights'], queryFn: api.allHighlights })
  const meetings = useQuery({ queryKey: ['meetings', 'recorded'], queryFn: () => api.meetings() })
  const [category, setCategory] = useState<Highlight['category'] | 'all'>('all')

  const titleById = useMemo(() => {
    const map = new Map<number, string>()
    meetings.data?.forEach((meeting) => map.set(meeting.id, meeting.title))
    return map
  }, [meetings.data])

  const all = highlights.data ?? []
  const counts = useMemo(() => {
    const map = new Map<string, number>([['all', all.length]])
    all.forEach((h) => map.set(h.category, (map.get(h.category) ?? 0) + 1))
    return map
  }, [all])

  // Grouped by the call they came from: a highlight only means something next
  // to the conversation it was pulled out of.
  const groups = useMemo(() => {
    const visible = all.filter((h) => category === 'all' || h.category === category)
    const byMeeting = new Map<number, Highlight[]>()
    visible.forEach((h) => byMeeting.set(h.meeting_id, [...(byMeeting.get(h.meeting_id) ?? []), h]))
    return [...byMeeting]
  }, [all, category])

  return (
    <div className="pb-14">
      <PageHeader
        title="Highlights"
        subtitle="Moments worth keeping, from every meeting you have recorded."
      />

      <div className="sticky top-14 z-10 -mb-px flex gap-1 overflow-x-auto border-b border-line bg-canvas/95 backdrop-blur-sm scrollbar-slim">
        {CATEGORIES.map((option) => (
          <button
            key={option.value}
            onClick={() => setCategory(option.value)}
            aria-pressed={category === option.value}
            className={cx(
              'shrink-0 border-b-2 px-3 py-2.5 text-[13px] font-medium whitespace-nowrap transition-colors',
              category === option.value
                ? 'border-accent text-ink'
                : 'border-transparent text-ink-soft hover:text-ink',
            )}
          >
            {option.label}
            <span className="ml-1.5 font-mono text-[11px] text-ink-faint">
              {counts.get(option.value) ?? 0}
            </span>
          </button>
        ))}
      </div>

      {highlights.isLoading && (
        <div className="mt-6 space-y-3">
          {[0, 1, 2, 3].map((key) => (
            <Skeleton key={key} className="h-24 w-full" />
          ))}
        </div>
      )}

      {highlights.data && groups.length === 0 && (
        <EmptyState
          icon={<Star size={22} />}
          title="No highlights here"
          description="Open a meeting and star a transcript line to create one."
        />
      )}

      <div className="mt-7 space-y-9">
        {groups.map(([meetingId, items]) => (
          <section key={meetingId} aria-label={titleById.get(meetingId) ?? 'Meeting'}>
            <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-line pb-2">
              <Link
                to={`/meetings/${meetingId}`}
                className="truncate text-sm font-semibold text-ink transition hover:text-accent"
              >
                {titleById.get(meetingId) ?? 'Meeting'}
              </Link>
              <span className="shrink-0 font-mono text-[11px] text-ink-faint">
                {items.length} {items.length === 1 ? 'moment' : 'moments'}
              </span>
            </div>

            <ul className="grid gap-x-8 gap-y-5 lg:grid-cols-2">
              {items.map((highlight) => (
                <li key={highlight.id}>
                  <Link
                    to={`/meetings/${highlight.meeting_id}?t=${Math.floor(highlight.start_time)}`}
                    className={cx(
                      'group block border-l-2 pl-3.5 transition-colors hover:bg-raised/40',
                      RULE[highlight.category],
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={cx(
                          'text-[10px] font-semibold tracking-[0.08em] uppercase',
                          INK[highlight.category],
                        )}
                      >
                        {LABEL[highlight.category]}
                      </span>
                      <span className="font-mono text-[11px] text-ink-faint">
                        {timecode(highlight.start_time)}
                      </span>
                      <Play
                        size={12}
                        className="ml-auto text-ink-faint transition sm:opacity-0 sm:group-hover:opacity-100"
                      />
                    </div>

                    <p className="mt-1 text-[15px] leading-snug font-medium text-ink">
                      {highlight.title}
                    </p>

                    {highlight.transcript_excerpt && (
                      <p className="mt-1.5 line-clamp-3 text-[13px] leading-[1.65] text-ink-soft">
                        {highlight.speaker && (
                          <span className="font-medium text-ink-faint">{highlight.speaker}: </span>
                        )}
                        {highlight.transcript_excerpt}
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
