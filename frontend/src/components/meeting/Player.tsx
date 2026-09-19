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
  platform: string | null
  participants: Participant[]
  activeSegment: TranscriptSegment | null
  highlights: Highlight[]
  onShareClip: () => void
}

export function RecordingPlayer({
  player,
  duration,
  platform,
  participants,
  activeSegment,
  highlights,
  onShareClip,
}: Props) {
  const { currentTime, playing, rate, volume, seek, toggle, setRate, setVolume } = player
  const frame = useRef<HTMLDivElement>(null)
  const [muted, setMuted] = useState(false)

  const speaker = activeSegment?.speaker ?? participants[0]?.name ?? 'Recording'
  const progress = duration ? (currentTime / duration) * 100 : 0

  function scrubTo(event: React.MouseEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect()
    seek(((event.clientX - bounds.left) / bounds.width) * duration)
  }

  return (
    <div
      ref={frame}
      className="overflow-hidden rounded-xl border border-line bg-surface shadow-[var(--shadow-card)]"
    >
      {player.hasMedia && <audio {...player.mediaProps} className="hidden" />}

      {/* Flex column, so the caption can never overlap the speaker on a short stage. */}
      <div className="flex aspect-video flex-col bg-[#121216]">
        <div className="flex items-start justify-between p-3">
          <span className="flex items-center gap-1.5 rounded-md bg-white/10 px-2 py-1 text-[11px] font-medium text-white/80 backdrop-blur-sm">
            <span
              className={cx(
                'size-1.5 rounded-full',
                playing ? 'animate-pulse bg-critical' : 'bg-white/40',
              )}
            />
            {platform ?? 'Recording'}
          </span>

          <div className="flex items-center">
            {participants.slice(0, 5).map((person) => (
              <span key={person.id} className="-mr-1.5 rounded-full ring-2 ring-[#121216] last:mr-0">
                <Avatar name={person.name} size={24} />
              </span>
            ))}
            {participants.length > 5 && (
              <span className="ml-2.5 text-[11px] font-medium text-white/50">
                +{participants.length - 5}
              </span>
            )}
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2.5">
          <Avatar name={speaker} size={56} />
          <p className="text-sm font-medium text-white/90">{speaker}</p>
        </div>

        {/* Live caption, the way a recording actually presents speech. */}
        {activeSegment && (
          <div className="bg-gradient-to-t from-black/70 to-transparent px-5 pt-8 pb-3.5">
            <p className="mx-auto line-clamp-2 max-w-2xl text-center text-[13px] leading-relaxed text-white/80 sm:text-sm">
              {activeSegment.text}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-2 px-3 pt-2.5 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-[11px] tabular-nums text-ink-soft">
            {timecode(currentTime)}
          </span>

          <div
            className="group relative h-4 flex-1 cursor-pointer"
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
            <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-raised transition-[height] group-hover:h-1.5">
              <div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
            </div>

            {highlights.map((highlight) => (
              <button
                key={highlight.id}
                className={cx(
                  'absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-surface transition hover:scale-[1.8]',
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
              className="pointer-events-none absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent opacity-0 shadow transition-opacity group-hover:opacity-100"
              style={{ left: `${progress}%` }}
            />
          </div>

          <span className="font-mono text-[11px] tabular-nums text-ink-faint">
            {timecode(duration)}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => seek(currentTime - 10)} aria-label="Back 10 seconds">
            <SkipBack size={15} />
          </Button>
          <Button variant="primary" size="sm" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
            {playing ? <Pause size={15} /> : <Play size={15} />}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => seek(currentTime + 10)} aria-label="Forward 10 seconds">
            <SkipForward size={15} />
          </Button>

          <div className="ml-auto flex items-center gap-1">
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

            <button
              className="h-8 rounded-lg px-2 text-xs font-medium text-ink-soft transition hover:bg-raised hover:text-ink"
              onClick={() => setRate(RATES[(RATES.indexOf(rate) + 1) % RATES.length])}
              aria-label={`Playback speed ${rate} times`}
            >
              {rate}&times;
            </button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => frame.current?.requestFullscreen?.()}
              aria-label="Fullscreen"
            >
              <Maximize2 size={15} />
            </Button>

            <Button variant="secondary" size="sm" onClick={onShareClip} className="ml-1">
              <Scissors size={14} />
              <span className="hidden sm:inline">Share clip</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
