import { useRef, useState } from 'react'
import {
  Maximize2,
  Pause,
  Play,
  Scissors,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react'
import type { Player } from '../../hooks/usePlayer'
import type { Highlight, Participant, TranscriptSegment } from '../../types'
import { timecode } from '../../lib/format'
import { Avatar, Button, cx } from '../ui'

const RATES = [1, 1.25, 1.5, 2]

const HIGHLIGHT_TINT: Record<string, string> = {
  'key-moment': 'bg-accent',
  decision: 'bg-positive',
  risk: 'bg-critical',
  insight: 'bg-caution',
}

type Props = {
  player: Player
  duration: number
  participants: Participant[]
  activeSegment: TranscriptSegment | null
  highlights: Highlight[]
  onShareClip: () => void
}

export function RecordingPlayer({
  player,
  duration,
  participants,
  activeSegment,
  highlights,
  onShareClip,
}: Props) {
  const { currentTime, playing, rate, volume, seek, toggle, setRate, setVolume } = player
  const frame = useRef<HTMLDivElement>(null)
  const [muted, setMuted] = useState(false)

  const speaker = activeSegment?.speaker ?? participants[0]?.name ?? 'Recording'
  const others = participants.filter((person) => person.name !== speaker)

  function scrubTo(event: React.MouseEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect()
    seek(((event.clientX - bounds.left) / bounds.width) * duration)
  }

  return (
    <div ref={frame} className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="relative aspect-video bg-gradient-to-b from-[#1f1f26] to-[#101014]">
        {/* Bottom inset leaves room for the participant strip on narrow screens. */}
        <div className="absolute inset-x-0 top-0 bottom-12 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <Avatar name={speaker} size={72} />
          <p className="text-sm font-medium text-white/90">{speaker}</p>
          {activeSegment && (
            <p className="line-clamp-2 max-w-xl text-sm leading-relaxed text-white/70 sm:line-clamp-3 sm:text-[15px]">
              {activeSegment.text}
            </p>
          )}
        </div>

        <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
          {others.slice(0, 6).map((person) => (
            <span key={person.id} className="opacity-60">
              <Avatar name={person.name} size={26} />
            </span>
          ))}
          {others.length > 6 && (
            <span className="text-xs text-white/60">+{others.length - 6}</span>
          )}
        </div>

        {playing && (
          <span className="absolute top-3 left-3 flex items-center gap-1.5 rounded-md bg-black/50 px-2 py-1 text-[11px] font-medium text-white">
            <span className="size-1.5 animate-pulse rounded-full bg-critical" />
            Playing
          </span>
        )}
      </div>

      <div className="px-3 pt-3 pb-2.5">
        <div
          className="group relative h-6 cursor-pointer"
          onClick={scrubTo}
          role="slider"
          tabIndex={0}
          aria-label="Seek recording"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(currentTime)}
          aria-valuetext={timecode(currentTime)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight') seek(currentTime + 10)
            if (event.key === 'ArrowLeft') seek(currentTime - 10)
          }}
        >
          <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-raised">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>

          {highlights.map((highlight) => (
            <button
              key={highlight.id}
              className={cx(
                'absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-surface transition hover:scale-150',
                HIGHLIGHT_TINT[highlight.category] ?? 'bg-accent',
              )}
              style={{ left: `${(highlight.start_time / duration) * 100}%` }}
              title={`${timecode(highlight.start_time)} · ${highlight.title}`}
              onClick={(event) => {
                event.stopPropagation()
                seek(highlight.start_time)
              }}
            />
          ))}

          <span
            className="pointer-events-none absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow"
            style={{ left: `${(currentTime / duration) * 100}%` }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button variant="ghost" size="sm" onClick={() => seek(currentTime - 10)} aria-label="Back 10 seconds">
            <SkipBack size={16} />
          </Button>
          <Button variant="primary" size="sm" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
            {playing ? <Pause size={15} /> : <Play size={15} />}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => seek(currentTime + 10)} aria-label="Forward 10 seconds">
            <SkipForward size={16} />
          </Button>

          <span className="ml-1 font-mono text-xs tabular-nums text-ink-soft">
            {timecode(currentTime)} <span className="text-ink-faint">/ {timecode(duration)}</span>
          </span>

          <div className="ml-auto flex items-center gap-1.5">
            <Button variant="ghost" size="sm" onClick={onShareClip}>
              <Scissors size={15} />
              <span className="hidden sm:inline">Share clip</span>
            </Button>

            <button
              className="rounded-md px-2 py-1 text-xs font-medium text-ink-soft transition hover:bg-raised"
              onClick={() => setRate(RATES[(RATES.indexOf(rate) + 1) % RATES.length])}
              aria-label={`Playback speed ${rate} times`}
            >
              {rate}x
            </button>

            <div className="hidden items-center gap-1 sm:flex">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMuted((value) => !value)}
                aria-label={muted ? 'Unmute' : 'Mute'}
              >
                {muted || volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </Button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={(event) => {
                  setMuted(false)
                  setVolume(Number(event.target.value))
                }}
                className="w-16 accent-[var(--color-accent)]"
                aria-label="Volume"
              />
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => frame.current?.requestFullscreen?.()}
              aria-label="Fullscreen"
            >
              <Maximize2 size={15} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
