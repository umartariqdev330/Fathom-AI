import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Play, Star } from 'lucide-react'
import type { Highlight } from '../types'
import { api } from '../lib/api'
import { timecode } from '../lib/format'
import { PageHeader } from '../components/AppLayout'
import { Badge, Card, EmptyState, Skeleton, cx } from '../components/ui'

const CATEGORIES: { value: Highlight['category'] | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'key-moment', label: 'Key moments' },
  { value: 'decision', label: 'Decisions' },
  { value: 'risk', label: 'Risks' },
  { value: 'insight', label: 'Insights' },
]

const TONE: Record<Highlight['category'], 'accent' | 'positive' | 'critical' | 'caution'> = {
  'key-moment': 'accent',
  decision: 'positive',
  risk: 'critical',
  insight: 'caution',
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

  const visible = (highlights.data ?? []).filter(
    (highlight) => category === 'all' || highlight.category === category,
  )

  return (
    <div>
      <PageHeader
        title="Highlights"
        subtitle="Moments worth keeping, from every meeting you have recorded."
      />

      <div className="px-5 py-5 lg:px-8">
        <div className="mb-4 flex flex-wrap gap-1.5">
          {CATEGORIES.map((option) => (
            <button
              key={option.value}
              onClick={() => setCategory(option.value)}
              aria-pressed={category === option.value}
              className={cx(
                'rounded-lg border px-2.5 py-1.5 text-sm font-medium transition',
                category === option.value
                  ? 'border-accent bg-accent-soft text-accent-ink'
                  : 'border-line bg-surface text-ink-soft hover:text-ink',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {highlights.isLoading && (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((key) => (
              <Skeleton key={key} className="h-36 w-full" />
            ))}
          </div>
        )}

        {highlights.data && visible.length === 0 && (
          <Card>
            <EmptyState
              icon={<Star size={22} />}
              title="No highlights here"
              description="Open a meeting and star a transcript line to create one."
            />
          </Card>
        )}

        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((highlight) => (
            <li key={highlight.id}>
              <Link
                to={`/meetings/${highlight.meeting_id}?t=${Math.floor(highlight.start_time)}`}
                className="group flex h-full flex-col rounded-xl border border-line bg-surface p-4 transition hover:border-line-strong hover:bg-raised/40"
              >
                <div className="flex items-center gap-2">
                  <Badge tone={TONE[highlight.category]}>{highlight.category.replace('-', ' ')}</Badge>
                  <span className="font-mono text-[11px] text-ink-faint">
                    {timecode(highlight.start_time)}
                  </span>
                  <Play
                    size={13}
                    className="ml-auto text-ink-faint opacity-0 transition group-hover:opacity-100"
                  />
                </div>

                <p className="mt-2 font-medium text-ink">{highlight.title}</p>

                {highlight.transcript_excerpt && (
                  <p className="mt-1.5 line-clamp-3 flex-1 text-sm leading-relaxed text-ink-soft">
                    {highlight.transcript_excerpt}
                  </p>
                )}

                <p className="mt-3 truncate border-t border-line pt-2.5 text-xs text-ink-faint">
                  {titleById.get(highlight.meeting_id) ?? 'Meeting'}
                  {highlight.speaker && ` · ${highlight.speaker}`}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
