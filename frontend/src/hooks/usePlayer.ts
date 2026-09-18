import { useCallback, useEffect, useRef, useState } from 'react'

const TICK_MS = 100

/**
 * Playback transport for a recording.
 *
 * Capture is simulated in this build, so there is no media file whose length
 * matches the meeting. The transport is a virtual clock instead: it runs for the
 * meeting's real duration, which is what transcript sync, highlight jumps and
 * clip ranges are all measured against.
 */
export function usePlayer(duration: number) {
  const [currentTime, setCurrentTime] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [rate, setRate] = useState(1)
  const [volume, setVolume] = useState(0.8)
  const last = useRef(0)

  useEffect(() => {
    if (!playing) return

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
  }, [playing, rate, duration])

  const seek = useCallback(
    (time: number) => setCurrentTime(Math.min(Math.max(time, 0), duration)),
    [duration],
  )

  const play = useCallback(() => setPlaying(true), [])
  const toggle = useCallback(() => setPlaying((value) => !value), [])

  const playFrom = useCallback(
    (time: number) => {
      seek(time)
      setPlaying(true)
    },
    [seek],
  )

  return { currentTime, playing, rate, volume, seek, play, toggle, playFrom, setRate, setVolume }
}

export type Player = ReturnType<typeof usePlayer>
