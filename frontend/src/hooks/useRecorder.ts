import { useCallback, useRef, useState } from 'react'

export type CaptureMode = 'meeting' | 'mic'

type Sources = { meeting: boolean; mic: boolean }

/**
 * Meeting capture.
 *
 * `meeting` mode records the audio of a shared tab or window — the actual Zoom,
 * Meet or Teams call, with every participant in it — and mixes the local
 * microphone in so the person running Meetly is captured too. `mic` mode records
 * the microphone alone, which only picks up the room.
 *
 * Every failure path surfaces as a message rather than a recording that
 * silently contains nothing.
 */
export function useRecorder() {
  const [seconds, setSeconds] = useState(0)
  const [level, setLevel] = useState(0)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sources, setSources] = useState<Sources>({ meeting: false, mic: false })

  const recorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioContext = useRef<AudioContext | null>(null)
  const streams = useRef<MediaStream[]>([])
  const onShareEnded = useRef<(() => void) | null>(null)

  const cleanup = useCallback(() => {
    if (timer.current) clearInterval(timer.current)
    timer.current = null
    streams.current.forEach((s) => s.getTracks().forEach((t) => t.stop()))
    streams.current = []
    void audioContext.current?.close().catch(() => {})
    audioContext.current = null
    setLevel(0)
  }, [])

  const start = useCallback(
    async (mode: CaptureMode) => {
      setError(null)

      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
        setError('This browser cannot record audio. Chrome or Edge will work.')
        return false
      }
      if (mode === 'meeting' && !navigator.mediaDevices.getDisplayMedia) {
        setError('This browser cannot capture tab audio. Use Chrome or Edge, or record the microphone only.')
        return false
      }

      setStarting(true)
      try {
        const captured = await collectStreams(mode)
        streams.current = captured.streams

        const context = new AudioContext()
        audioContext.current = context
        const mixer = context.createMediaStreamDestination()
        captured.streams
          .filter((s) => s.getAudioTracks().length > 0)
          .forEach((s) => context.createMediaStreamSource(s).connect(mixer))

        chunks.current = []
        const media = new MediaRecorder(mixer.stream)
        media.ondataavailable = (event) => event.data.size > 0 && chunks.current.push(event.data)
        media.start(1000)
        recorder.current = media

        // Chrome shows its own "Stop sharing" button; treat that as stop.
        captured.streams
          .flatMap((s) => s.getVideoTracks())
          .forEach((track) => {
            track.onended = () => onShareEnded.current?.()
          })

        setSources(captured.sources)
        setSeconds(0)
        timer.current = setInterval(() => setSeconds((value) => value + 1), 1000)
        meterLevel(context, mixer.stream)
        return true
      } catch (cause) {
        cleanup()
        setError(describe(cause, mode))
        return false
      } finally {
        setStarting(false)
      }
    },
    [cleanup],
  )

  /** Drives the level meter, which is how you can tell audio is arriving. */
  function meterLevel(context: AudioContext, stream: MediaStream) {
    try {
      const analyser = context.createAnalyser()
      analyser.fftSize = 256
      context.createMediaStreamSource(stream).connect(analyser)

      const samples = new Uint8Array(analyser.frequencyBinCount)
      const tick = () => {
        if (!audioContext.current) return
        analyser.getByteFrequencyData(samples)
        setLevel(samples.reduce((total, value) => total + value, 0) / samples.length / 255)
        requestAnimationFrame(tick)
      }
      tick()
    } catch {
      // The meter is a nicety; recording works without it.
    }
  }

  const stop = useCallback(async () => {
    const media = recorder.current
    if (!media) return null

    const blob = await new Promise<Blob | null>((resolve) => {
      media.onstop = () => {
        const parts = chunks.current
        resolve(parts.length ? new Blob(parts, { type: media.mimeType || 'audio/webm' }) : null)
      }
      media.stop()
    })

    cleanup()
    recorder.current = null
    return blob
  }, [cleanup])

  const reset = useCallback(() => {
    cleanup()
    recorder.current = null
    chunks.current = []
    setSeconds(0)
    setError(null)
    setSources({ meeting: false, mic: false })
  }, [cleanup])

  return {
    start,
    stop,
    reset,
    seconds,
    level,
    starting,
    error,
    sources,
    onShareEnded,
  }
}

async function collectStreams(mode: CaptureMode): Promise<{ streams: MediaStream[]; sources: Sources }> {
  if (mode === 'mic') {
    const mic = await navigator.mediaDevices.getUserMedia({ audio: true })
    return { streams: [mic], sources: { meeting: false, mic: true } }
  }

  // Chrome only offers the audio checkbox when video is requested too. The video
  // track is never recorded; it exists so the tab's audio can be shared at all.
  const display = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: { echoCancellation: false, noiseSuppression: false },
  })

  if (display.getAudioTracks().length === 0) {
    display.getTracks().forEach((t) => t.stop())
    throw new NoTabAudio()
  }

  // The microphone is best effort: without it the call is still captured, just
  // without the local speaker, so a refusal here should not abort the recording.
  let mic: MediaStream | null = null
  try {
    mic = await navigator.mediaDevices.getUserMedia({ audio: true })
  } catch {
    mic = null
  }

  return {
    streams: mic ? [display, mic] : [display],
    sources: { meeting: true, mic: Boolean(mic) },
  }
}

class NoTabAudio extends Error {}

function describe(cause: unknown, mode: CaptureMode): string {
  if (cause instanceof NoTabAudio) {
    return 'You shared the tab but not its audio. Share again and tick "Also share tab audio" in the picker.'
  }

  const name = (cause as DOMException)?.name
  if (name === 'NotAllowedError') {
    return mode === 'meeting'
      ? 'Screen sharing was cancelled or blocked, so there is nothing to record.'
      : 'Microphone access was blocked. Allow it in your browser settings and try again.'
  }
  if (name === 'NotFoundError') return 'No microphone was found on this device.'
  if (name === 'NotReadableError') return 'The microphone is in use by another application.'
  return 'Could not start recording. Check your microphone and try again.'
}
