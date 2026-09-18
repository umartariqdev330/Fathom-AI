import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Check, Loader2, Square } from 'lucide-react'
import { api } from '../lib/api'
import { timecode } from '../lib/format'
import { Button, cx } from './ui'
import { Modal } from './Modal'
import { useToast } from './Toast'

const PLATFORMS = ['Google Meet', 'Zoom', 'Microsoft Teams']

const STEPS = ['Transcribing audio', 'Generating summary', 'Extracting action items', 'Creating highlights']

type Stage = 'choose' | 'recording' | 'processing'

export function RecordDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [stage, setStage] = useState<Stage>('choose')
  const [platform, setPlatform] = useState(PLATFORMS[0])
  const [elapsed, setElapsed] = useState(0)
  const [step, setStep] = useState(0)
  const recordingId = useRef<string | null>(null)

  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()

  useEffect(() => {
    if (stage !== 'recording') return
    const timer = setInterval(() => setElapsed((seconds) => seconds + 1), 1000)
    return () => clearInterval(timer)
  }, [stage])

  useEffect(() => {
    if (!open) {
      setStage('choose')
      setElapsed(0)
      setStep(0)
    }
  }, [open])

  async function start() {
    try {
      const { recording_id } = await api.startRecording(platform)
      recordingId.current = recording_id
      setStage('recording')
    } catch (error) {
      toast((error as Error).message, 'error')
    }
  }

  async function stop() {
    if (!recordingId.current) return
    setStage('processing')

    // The pipeline stages are real work on the server; the pacing here just
    // makes the sequence legible instead of flashing past.
    const ticker = setInterval(() => setStep((current) => Math.min(current + 1, STEPS.length - 1)), 700)

    try {
      const meeting = await api.stopRecording(recordingId.current)
      await new Promise((resolve) => setTimeout(resolve, 600))
      clearInterval(ticker)
      setStep(STEPS.length)
      await queryClient.invalidateQueries()
      onClose()
      toast('Meeting processed')
      navigate(`/meetings/${meeting.meeting_id}`)
    } catch (error) {
      clearInterval(ticker)
      setStage('choose')
      toast((error as Error).message, 'error')
    }
  }

  return (
    <Modal
      open={open}
      onClose={stage === 'processing' ? () => {} : onClose}
      title={stage === 'processing' ? 'Processing meeting' : 'Record a meeting'}
      description={
        stage === 'choose'
          ? 'Capture is simulated in this build. Stopping produces a real meeting with a transcript, summary and action items.'
          : undefined
      }
      footer={
        stage === 'choose' ? (
          <>
            <Button onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={start}>
              Start simulated recording
            </Button>
          </>
        ) : undefined
      }
    >
      {stage === 'choose' && (
        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-medium text-ink">Choose meeting platform</legend>
          {PLATFORMS.map((name) => (
            <label
              key={name}
              className={cx(
                'flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition',
                platform === name
                  ? 'border-accent bg-accent-soft text-accent-ink'
                  : 'border-line hover:bg-raised',
              )}
            >
              <input
                type="radio"
                name="platform"
                value={name}
                checked={platform === name}
                onChange={() => setPlatform(name)}
                className="accent-[var(--color-accent)]"
              />
              {name}
            </label>
          ))}
        </fieldset>
      )}

      {stage === 'recording' && (
        <div className="flex flex-col items-center gap-4 py-6">
          <span className="flex items-center gap-2 text-sm text-ink-soft">
            <span className="size-2.5 animate-pulse rounded-full bg-critical" />
            Recording in progress on {platform}
          </span>
          <p className="font-mono text-4xl tabular-nums text-ink">{timecode(elapsed)}</p>
          <Button variant="primary" onClick={stop}>
            <Square size={14} />
            Stop recording
          </Button>
        </div>
      )}

      {stage === 'processing' && (
        <ol className="space-y-3 py-2">
          {STEPS.map((label, index) => (
            <li key={label} className="flex items-center gap-3 text-sm">
              {index < step ? (
                <Check size={16} className="text-positive" />
              ) : index === step ? (
                <Loader2 size={16} className="animate-spin text-accent" />
              ) : (
                <span className="size-4 rounded-full border border-line" />
              )}
              <span className={index <= step ? 'text-ink' : 'text-ink-faint'}>{label}</span>
            </li>
          ))}
        </ol>
      )}
    </Modal>
  )
}
