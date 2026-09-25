import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Highlight, TranscriptSegment } from '../../types'
import { api } from '../../lib/api'
import { timecode } from '../../lib/format'
import { Button, cx } from '../ui'
import { Modal } from '../Modal'
import { useToast } from '../Toast'

const CATEGORIES: { value: Highlight['category']; label: string }[] = [
  { value: 'key-moment', label: 'Key moment' },
  { value: 'decision', label: 'Decision' },
  { value: 'risk', label: 'Risk' },
  { value: 'insight', label: 'Insight' },
]

export function HighlightDialog({
  meetingId,
  segment,
  onClose,
}: {
  meetingId: number
  segment: TranscriptSegment | null
  onClose: () => void
}) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<Highlight['category']>('key-moment')
  const queryClient = useQueryClient()
  const toast = useToast()

  useEffect(() => {
    if (!segment) return
    // The line itself is usually the right title, trimmed to something scannable.
    setTitle(segment.text.length > 70 ? `${segment.text.slice(0, 67).trimEnd()}...` : segment.text)
    setCategory('key-moment')
  }, [segment])

  const create = useMutation({
    mutationFn: () =>
      api.createHighlight(meetingId, {
        title: title.trim(),
        start_time: segment!.start_time,
        end_time: segment!.end_time,
        transcript_excerpt: segment!.text,
        speaker: segment!.speaker,
        category,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting', meetingId] })
      toast('Highlight created')
      onClose()
    },
    onError: (error: Error) => toast(error.message, 'error'),
  })

  return (
    <Modal
      open={segment !== null}
      onClose={onClose}
      title="Add highlight"
      description={segment ? `${segment.speaker} at ${timecode(segment.start_time)}` : undefined}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => create.mutate()}
            disabled={!title.trim() || create.isPending}
          >
            Save highlight
          </Button>
        </>
      }
    >
      {segment && (
        <div className="space-y-3">
          <p className="rounded-sm border border-line bg-canvas px-3 py-2.5 text-sm leading-relaxed text-ink-soft">
            {segment.text}
          </p>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-soft">Title</span>
            <input
              autoFocus
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="h-9 w-full rounded-sm border border-line bg-canvas px-3 text-sm outline-none focus:border-accent"
            />
          </label>

          <div>
            <span className="mb-1.5 block text-xs font-medium text-ink-soft">Category</span>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setCategory(option.value)}
                  aria-pressed={category === option.value}
                  className={cx(
                    'rounded-sm border px-2.5 py-1.5 text-xs font-medium transition',
                    category === option.value
                      ? 'border-accent bg-accent-soft text-accent-ink'
                      : 'border-line text-ink-soft hover:bg-raised',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
