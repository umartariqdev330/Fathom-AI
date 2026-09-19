import { useCallback, useRef, useState } from 'react'

/**
 * Microphone capture via MediaRecorder.
 *
 * Every failure path — unsupported browser, denied permission, no input device
 * — surfaces as a message rather than a recording that silently contains
 * nothing.
 */
export function useRecorder() {
  const [seconds, setSeconds] = useState(0)
  const [level, setLevel] = useState(0)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const recorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioContext = useRef<AudioContext | null>(null)

  const cleanup = useCallback(() => {
    if (timer.current) clearInterval(timer.current)
    timer.current = null
    recorder.current?.stream.getTracks().forEach((track) => track.stop())
    void audioContext.current?.close().catch(() => {})
    audioContext.current = null
    setLevel(0)
  }, [])

  const start = useCallback(async () => {
    setError(null)

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('This browser cannot record audio. Chrome, Edge or Firefox will work.')
      return false
    }

    setStarting(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      chunks.current = []
      const media = new MediaRecorder(stream)
      media.ondataavailable = (event) => event.data.size > 0 && chunks.current.push(event.data)
      media.start(1000)
      recorder.current = media

      setSeconds(0)
      timer.current = setInterval(() => setSeconds((value) => value + 1), 1000)
      meterInputLevel(stream)
      return true
    } catch (cause) {
      setError(describe(cause))
      return false
    } finally {
      setStarting(false)
    }
  }, [])

  /** Drives the level meter, which is how the user can tell audio is arriving. */
  function meterInputLevel(stream: MediaStream) {
    try {
      const context = new AudioContext()
      const analyser = context.createAnalyser()
      analyser.fftSize = 256
      context.createMediaStreamSource(stream).connect(analyser)
      audioContext.current = context

      const samples = new Uint8Array(analyser.frequencyBinCount)
      const tick = () => {
        if (!audioContext.current) return
        analyser.getByteFrequencyData(samples)
        const average = samples.reduce((total, value) => total + value, 0) / samples.length
        setLevel(average / 255)
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
  }, [cleanup])

  return { start, stop, reset, seconds, level, starting, error }
}

function describe(cause: unknown): string {
  const name = (cause as DOMException)?.name

  if (name === 'NotAllowedError')
    return 'Microphone access was blocked. Allow it in your browser settings and try again.'
  if (name === 'NotFoundError') return 'No microphone was found on this device.'
  if (name === 'NotReadableError')
    return 'The microphone is in use by another application.'
  return 'Could not start recording. Check that a microphone is connected.'
}
