import { useEffect, useMemo, useRef, useState } from 'react'
import { Copy, Download, Search, Star, X } from 'lucide-react'
import type { TranscriptSegment } from '../../types'
import { timecode } from '../../lib/format'
import { Avatar, Button, cx } from '../ui'
import { useToast } from '../Toast'

type Props = {
  segments: TranscriptSegment[]
  meetingTitle: string
  activeId: number | null
  onSeek: (time: number) => void
  onHighlight: (segment: TranscriptSegment) => void
}

export function Transcript({ segments, meetingTitle, activeId, onSeek, onHighlight }: Props) {
  const [query, setQuery] = useState('')
  const [autoScroll, setAutoScroll] = useState(true)
  const activeRef = useRef<HTMLLIElement>(null)
  const toast = useToast()

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return segments
    return segments.filter(
      (segment) =>
        segment.text.toLowerCase().includes(needle) ||
        segment.speaker.toLowerCase().includes(needle),
    )
  }, [segments, query])

  useEffect(() => {
    if (!autoScroll || query) return
    activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [activeId, autoScroll, query])

  async function copyAll() {
    await navigator.clipboard.writeText(asText(segments))
    toast('Transcript copied')
  }

  function download() {
    const blob = new Blob([asText(segments)], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${meetingTitle.replace(/[^\w]+/g, '-').toLowerCase()}-transcript.txt`
    link.click()
    URL.revokeObjectURL(url)
    toast('Transcript downloaded')
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 border-b border-line px-3 py-2.5">
        <div className="relative flex-1">
          <Search
            size={14}
            className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-ink-faint"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search this transcript"
            aria-label="Search transcript"
            className="h-8 w-full rounded-lg border border-line bg-canvas pr-7 pl-7.5 text-sm outline-none placeholder:text-ink-faint focus:border-accent"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              aria-label="Clear transcript search"
              className="absolute top-1/2 right-2 -translate-y-1/2 text-ink-faint hover:text-ink"
            >
              <X size={13} />
            </button>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={copyAll} aria-label="Copy transcript">
          <Copy size={15} />
        </Button>
        <Button variant="ghost" size="sm" onClick={download} aria-label="Download transcript">
          <Download size={15} />
        </Button>
      </div>

      {query && (
        <p className="border-b border-line px-3 py-1.5 text-xs text-ink-soft">
          {visible.length} of {segments.length} lines match
        </p>
      )}

      <ul
        className="min-h-0 flex-1 overflow-y-auto px-1.5 py-2 scrollbar-slim"
        onWheel={() => setAutoScroll(false)}
      >
        {visible.map((segment) => {
          const active = segment.id === activeId
          return (
            <li key={segment.id} ref={active ? activeRef : undefined}>
              <div
                className={cx(
                  'group relative rounded-lg px-2 py-2 transition',
                  active ? 'bg-accent-soft' : 'hover:bg-raised',
                )}
              >
                <div className="flex items-center gap-2">
                  <Avatar name={segment.speaker} size={22} />
                  <span className="text-[13px] font-medium text-ink">{segment.speaker}</span>
                  <button
                    onClick={() => {
                      setAutoScroll(true)
                      onSeek(segment.start_time)
                    }}
                    className="font-mono text-[11px] text-ink-faint transition hover:text-accent"
                    aria-label={`Play from ${timecode(segment.start_time)}`}
                  >
                    {timecode(segment.start_time)}
                  </button>

                  <button
                    onClick={() => onHighlight(segment)}
                    className="ml-auto rounded-md p-1 text-ink-faint opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100 hover:text-accent"
                    aria-label={`Highlight this moment at ${timecode(segment.start_time)}`}
                    title="Add highlight"
                  >
                    <Star size={14} />
                  </button>
                </div>

                <p className="mt-1 pl-7.5 text-sm leading-relaxed text-ink-soft">
                  {mark(segment.text, query)}
                </p>
              </div>
            </li>
          )
        })}

        {visible.length === 0 && (
          <li className="px-3 py-10 text-center text-sm text-ink-soft">
            No lines match “{query}”.
          </li>
        )}
      </ul>

      {!autoScroll && (
        <button
          onClick={() => setAutoScroll(true)}
          className="border-t border-line px-3 py-2 text-xs font-medium text-accent hover:bg-raised"
        >
          Follow playback
        </button>
      )}
    </div>
  )
}

function mark(text: string, query: string) {
  const needle = query.trim()
  if (!needle) return text

  const parts = text.split(new RegExp(`(${escapeRegex(needle)})`, 'ig'))
  return parts.map((part, index) =>
    part.toLowerCase() === needle.toLowerCase() ? (
      <mark key={index} className="rounded bg-caution/25 text-ink">
        {part}
      </mark>
    ) : (
      part
    ),
  )
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function asText(segments: TranscriptSegment[]) {
  return segments
    .map((segment) => `${timecode(segment.start_time)}  ${segment.speaker}\n${segment.text}\n`)
    .join('\n')
}
