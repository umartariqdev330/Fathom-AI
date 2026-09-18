import { useEffect, useState } from 'react'
import { Check, Copy, ExternalLink } from 'lucide-react'
import { api } from '../../lib/api'
import { timecode } from '../../lib/format'
import { Button } from '../ui'
import { Modal } from '../Modal'
import { useToast } from '../Toast'

export type ClipRange = { start: number; end: number; title: string }

export function ShareClipDialog({
  meetingId,
  duration,
  range,
  onClose,
}: {
  meetingId: number
  duration: number
  range: ClipRange | null
  onClose: () => void
}) {
  const [start, setStart] = useState('0:00')
  const [end, setEnd] = useState('0:30')
  const [title, setTitle] = useState('')
  const [link, setLink] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  useEffect(() => {
    if (!range) return
    setStart(timecode(range.start))
    setEnd(timecode(Math.min(range.end, duration)))
    setTitle(range.title)
    setLink(null)
  }, [range, duration])

  async function create() {
    const startSeconds = parseTimecode(start)
    const endSeconds = parseTimecode(end)

    if (startSeconds === null || endSeconds === null) {
      toast('Times must look like 12:34', 'error')
      return
    }
    if (endSeconds <= startSeconds) {
      toast('The clip must end after it starts', 'error')
      return
    }

    setSaving(true)
    try {
      const clip = await api.createClip({
        meeting_id: meetingId,
        title: title.trim() || 'Untitled clip',
        start_time: startSeconds,
        end_time: Math.min(endSeconds, duration),
      })
      setLink(`${window.location.origin}/share/${clip.share_token}`)
      toast('Clip created')
    } catch (error) {
      toast((error as Error).message, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function copy() {
    if (!link) return
    await navigator.clipboard.writeText(link)
    toast('Clip link copied')
  }

  const field =
    'h-9 w-full rounded-lg border border-line bg-canvas px-3 text-sm outline-none placeholder:text-ink-faint focus:border-accent'

  return (
    <Modal
      open={range !== null}
      onClose={onClose}
      title="Share a clip"
      description={
        link ? undefined : 'Anyone with the link can watch, including people who were not on the call.'
      }
      footer={
        link ? (
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        ) : (
          <>
            <Button onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={create} disabled={saving}>
              Create clip
            </Button>
          </>
        )
      }
    >
      {link ? (
        <div className="space-y-3">
          <p className="flex items-center gap-2 text-sm font-medium text-positive">
            <Check size={16} />
            Clip created successfully
          </p>
          <div className="flex gap-2">
            <input readOnly value={link} className={field} aria-label="Share link" />
            <Button onClick={copy} aria-label="Copy link">
              <Copy size={15} />
            </Button>
            <Button
              onClick={() => window.open(link, '_blank', 'noopener')}
              aria-label="Open link in a new tab"
            >
              <ExternalLink size={15} />
            </Button>
          </div>
          <p className="text-xs text-ink-faint">
            The link opens without signing in and shows the clip with its transcript.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-soft">Clip title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="What is this moment?"
              className={field}
            />
          </label>

          <div className="flex gap-3">
            <label className="flex-1">
              <span className="mb-1 block text-xs font-medium text-ink-soft">Start</span>
              <input value={start} onChange={(event) => setStart(event.target.value)} className={field} />
            </label>
            <label className="flex-1">
              <span className="mb-1 block text-xs font-medium text-ink-soft">End</span>
              <input value={end} onChange={(event) => setEnd(event.target.value)} className={field} />
            </label>
          </div>

          <p className="text-xs text-ink-faint">Recording length {timecode(duration)}.</p>
        </div>
      )}
    </Modal>
  )
}

/** Accepts mm:ss or h:mm:ss. Returns null when it is not a time. */
function parseTimecode(value: string): number | null {
  const parts = value.trim().split(':').map(Number)
  if (parts.some(Number.isNaN) || parts.length < 2 || parts.length > 3) return null

  return parts.length === 2 ? parts[0] * 60 + parts[1] : parts[0] * 3600 + parts[1] * 60 + parts[2]
}
