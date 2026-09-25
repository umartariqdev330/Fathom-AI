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
  /** Changes on every deliberate jump, which re-arms following. */
  followKey?: number
  onSeek: (time: number) => void
  onHighlight: (segment: TranscriptSegment) => void
}

export function Transcript({
  segments,
  meetingTitle,
  activeId,
  followKey,
  onSeek,
  onHighlight,
}: Props) {
  const [query, setQuery] = useState('')
  const [autoScroll, setAutoScroll] = useState(true)
  const activeRef = useRef<HTMLLIElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
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
    const line = activeRef.current
    const list = listRef.current
    if (!line || !list) return

    // Scrolling the list itself rather than scrollIntoView, which drags every
    // scrollable ancestor along and would jerk the whole page on each line.
    const offset =
      line.getBoundingClientRect().top - list.getBoundingClientRect().top + list.scrollTop
    list.scrollTop = offset - list.clientHeight / 3
  }, [activeId, autoScroll, query])

  // Jumping to a moment from the timeline, a highlight or the summary is an
  // explicit request to go there, so it overrides having scrolled away earlier.
  useEffect(() => {
    if (followKey !== undefined) setAutoScroll(true)
  }, [followKey])

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
            className="h-8 w-full rounded-sm border border-line bg-canvas pr-7 pl-7.5 text-sm outline-none placeholder:text-ink-faint focus:border-accent"
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
        ref={listRef}
        className="min-h-0 flex-1 overflow-y-auto px-2 py-2 scrollbar-slim"
        onWheel={() => setAutoScroll(false)}
      >
        {visible.map((segment, index) => {
          const active = segment.id === activeId
          // Consecutive lines from one speaker read as a single turn, so the
          // name and avatar only appear when the speaker actually changes.
          const continues = visible[index - 1]?.speaker === segment.speaker

          return (
            <li key={segment.id} ref={active ? activeRef : undefined}>
              <div
                // Clicking a line seeks to it, unless the click was a text selection.
                onClick={() => {
                  if (window.getSelection()?.toString()) return
                  setAutoScroll(true)
                  onSeek(segment.start_time)
                }}
                className={cx(
                  'group relative cursor-pointer rounded-sm border-l-2 py-1.5 pr-1.5 pl-2.5 transition-colors',
                  continues ? 'mt-0' : 'mt-2 first:mt-0',
                  active
                    ? 'border-accent bg-accent-soft/70'
                    : 'border-transparent hover:bg-raised',
                )}
              >
                {!continues && (
                  <div className="mb-1 flex items-center gap-2">
                    <Avatar name={segment.speaker} size={20} />
                    <span className="text-[13px] font-semibold text-ink">{segment.speaker}</span>
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
                  </div>
                )}

                <div className="flex items-start gap-2 pl-7">
                  <p className="min-w-0 flex-1 text-[13.5px] leading-[1.65] text-ink-soft">
                    {mark(segment.text, query)}
                  </p>

                  <button
                    onClick={(event) => {
                      event.stopPropagation()
                      onHighlight(segment)
                    }}
                    className="shrink-0 rounded-md p-1 text-ink-faint transition hover:text-accent sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                    aria-label={`Highlight this moment at ${timecode(segment.start_time)}`}
                    title="Add highlight"
                  >
                    <Star size={13} />
                  </button>
                </div>
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
