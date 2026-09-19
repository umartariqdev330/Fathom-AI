import { useCallback, useEffect, useRef, useState } from 'react'

const TICK_MS = 100

/**
 * Playback transport for a meeting.
 *
 * Two engines behind one interface. When the meeting has a real recording the
 * hook drives an `<audio>` element; when it does not — every seeded demo
 * meeting — it falls back to a virtual clock running for the meeting's stated
 * duration. Callers cannot tell the difference, which is what lets transcript
 * sync, highlights and clips work identically for both.
 */
export function usePlayer(duration: number, mediaUrl?: string | null) {
  const audio = useRef<HTMLAudioElement | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [rate, setRate] = useState(1)
  const [volume, setVolume] = useState(0.8)
  const last = useRef(0)

  const hasMedia = Boolean(mediaUrl)

  // Virtual clock. Only runs when there is no media to drive the time.
  useEffect(() => {
    if (hasMedia || !playing) return

    last.current = performance.now()
    const timer = setInterval(() => {
      const now = performance.now()
      const advanced = ((now - last.current) / 1000) * rate
      last.current = now

      setCurrentTime((time) => {
        const next = time + advanced
        if (next >= duration) {
          setPlaying(false)
          return duration
        }
        return next
      })
    }, TICK_MS)

    return () => clearInterval(timer)
  }, [hasMedia, playing, rate, duration])

  useEffect(() => {
    if (audio.current) audio.current.playbackRate = rate
  }, [rate])

  useEffect(() => {
    if (audio.current) audio.current.volume = volume
  }, [volume])

  const seek = useCallback(
    (time: number) => {
      const clamped = Math.min(Math.max(time, 0), duration || time)
      if (audio.current) audio.current.currentTime = clamped
      setCurrentTime(clamped)
    },
    [duration],
  )

  const play = useCallback(() => {
    if (audio.current) void audio.current.play().catch(() => setPlaying(false))
    setPlaying(true)
  }, [])

  const toggle = useCallback(() => {
    if (!audio.current) {
      setPlaying((value) => !value)
      return
    }
    if (audio.current.paused) void audio.current.play().catch(() => setPlaying(false))
    else audio.current.pause()
  }, [])

  const playFrom = useCallback(
    (time: number) => {
      seek(time)
      play()
    },
    [seek, play],
  )

  /** Spread onto the `<audio>` element when the meeting has a recording. */
  const mediaProps = {
    ref: audio,
    src: mediaUrl ?? undefined,
    preload: 'metadata' as const,
    onTimeUpdate: () => setCurrentTime(audio.current?.currentTime ?? 0),
    onPlay: () => setPlaying(true),
    onPause: () => setPlaying(false),
    onEnded: () => setPlaying(false),
  }

  return {
    currentTime,
    playing,
    rate,
    volume,
    hasMedia,
    seek,
    play,
    toggle,
    playFrom,
    setRate,
    setVolume,
    mediaProps,
  }
}

export type Player = ReturnType<typeof usePlayer>
