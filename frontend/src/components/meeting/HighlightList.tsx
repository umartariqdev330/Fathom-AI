import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Play, Scissors, Star, Trash2 } from 'lucide-react'
import type { Highlight, Meeting } from '../../types'
import { api } from '../../lib/api'
import { timecode } from '../../lib/format'
import { Badge, Button, EmptyState } from '../ui'
import { useToast } from '../Toast'

const CATEGORY_TONE: Record<Highlight['category'], 'accent' | 'positive' | 'critical' | 'caution'> = {
  'key-moment': 'accent',
  decision: 'positive',
  risk: 'critical',
  insight: 'caution',
}

const CATEGORY_LABEL: Record<Highlight['category'], string> = {
  'key-moment': 'Key moment',
  decision: 'Decision',
  risk: 'Risk',
  insight: 'Insight',
}

export function HighlightList({
  meeting,
  onPlay,
  onShareClip,
}: {
  meeting: Meeting
  onPlay: (time: number) => void
  onShareClip: (highlight: Highlight) => void
}) {
  const queryClient = useQueryClient()
  const toast = useToast()

  const remove = useMutation({
    mutationFn: (id: number) => api.deleteHighlight(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting', meeting.id] })
      toast('Highlight deleted')
    },
    onError: (error: Error) => toast(error.message, 'error'),
  })

  if (meeting.highlights.length === 0) {
    return (
      <EmptyState
        icon={<Star size={22} />}
        title="No highlights yet"
        description="Hover any transcript line and press the star to mark a moment worth keeping."
      />
    )
  }

  return (
    <ul className="space-y-2 p-4">
      {meeting.highlights.map((highlight) => (
        <li
          key={highlight.id}
          className="group rounded-lg border border-line bg-canvas p-3 transition hover:border-line-strong"
        >
          <div className="flex items-start gap-2">
            <Badge tone={CATEGORY_TONE[highlight.category]}>
              {CATEGORY_LABEL[highlight.category]}
            </Badge>
            <button
              onClick={() => onPlay(highlight.start_time)}
              className="font-mono text-[11px] text-ink-faint transition hover:text-accent"
              aria-label={`Play highlight from ${timecode(highlight.start_time)}`}
            >
              {timecode(highlight.start_time)}
            </button>

            <div className="ml-auto flex gap-0.5 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPlay(highlight.start_time)}
                aria-label={`Play: ${highlight.title}`}
              >
                <Play size={13} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onShareClip(highlight)}
                aria-label={`Share clip of: ${highlight.title}`}
              >
                <Scissors size={13} />
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => remove.mutate(highlight.id)}
                aria-label={`Delete: ${highlight.title}`}
              >
                <Trash2 size={13} />
              </Button>
            </div>
          </div>

          <p className="mt-2 text-sm font-medium text-ink">{highlight.title}</p>
          {highlight.transcript_excerpt && (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-soft">
              {highlight.speaker && <span className="text-ink-faint">{highlight.speaker}: </span>}
              {highlight.transcript_excerpt}
            </p>
          )}
        </li>
      ))}
    </ul>
  )
}
