import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { AlertCircle, Check, Loader2, Mic, Square } from 'lucide-react'
import { api } from '../lib/api'
import { timecode } from '../lib/format'
import { useRecorder } from '../hooks/useRecorder'
import { Button, cx } from './ui'
import { Modal } from './Modal'
import { useToast } from './Toast'

const STEPS = ['Uploading audio', 'Transcribing', 'Generating summary', 'Extracting action items']

type Stage = 'setup' | 'recording' | 'processing'

export function RecordDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [stage, setStage] = useState<Stage>('setup')
  const [title, setTitle] = useState('')
  const [step, setStep] = useState(0)
  const recorder = useRecorder()

  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()

  useEffect(() => {
    if (!open) {
      setStage('setup')
      setStep(0)
      setTitle('')
      recorder.reset()
    }
    // recorder identity is stable; re-running on it would cancel live recordings
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  async function start() {
    const started = await recorder.start()
    if (started) setStage('recording')
  }

  async function stop() {
    const blob = await recorder.stop()
    if (!blob) {
      toast('Nothing was recorded', 'error')
      setStage('setup')
      return
    }

    setStage('processing')
    const ticker = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 900)

    try {
      const meeting = await api.uploadRecording(blob, title.trim() || defaultTitle())
      clearInterval(ticker)
      setStep(STEPS.length)
      await queryClient.invalidateQueries()
      onClose()
      toast('Recording uploaded')
      navigate(`/meetings/${meeting.meeting_id}`)
    } catch (error) {
      clearInterval(ticker)
      setStage('setup')
      toast((error as Error).message, 'error')
    }
  }

  return (
    <Modal
      open={open}
      onClose={stage === 'processing' ? () => {} : onClose}
      title={stage === 'processing' ? 'Processing recording' : 'Record a meeting'}
      description={
        stage === 'setup'
          ? 'Meetly records this device’s microphone. Everyone in the room is captured; remote participants are not.'
          : undefined
      }
      footer={
        stage === 'setup' ? (
          <>
            <Button onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={start} disabled={recorder.starting}>
              <Mic size={14} />
              {recorder.starting ? 'Requesting access' : 'Start recording'}
            </Button>
          </>
        ) : undefined
      }
    >
      {stage === 'setup' && (
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-soft">Meeting title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={defaultTitle()}
              className="h-9 w-full rounded-lg border border-line bg-canvas px-3 text-sm outline-none focus:border-accent"
            />
          </label>

          {recorder.error && (
            <p className="flex items-start gap-2 rounded-lg border border-critical/30 bg-critical/5 px-3 py-2.5 text-sm text-ink-soft">
              <AlertCircle size={15} className="mt-0.5 shrink-0 text-critical" />
              {recorder.error}
            </p>
          )}
        </div>
      )}

      {stage === 'recording' && (
        <div className="flex flex-col items-center gap-4 py-6">
          <span className="flex items-center gap-2 text-sm text-ink-soft">
            <span className="size-2.5 animate-pulse rounded-full bg-critical" />
            Recording from your microphone
          </span>
          <p className="font-mono text-4xl tabular-nums text-ink">{timecode(recorder.seconds)}</p>

          {/* Live input level: proof that audio is genuinely arriving, not a timer. */}
          <div className="h-1.5 w-40 overflow-hidden rounded-full bg-raised" aria-hidden>
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-100"
              style={{ width: `${Math.min(100, recorder.level * 140)}%` }}
            />
          </div>

          <Button variant="primary" onClick={stop}>
            <Square size={14} />
            Stop and process
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
              <span className={cx(index <= step ? 'text-ink' : 'text-ink-faint')}>{label}</span>
            </li>
          ))}
        </ol>
      )}
    </Modal>
  )
}

function defaultTitle() {
  return `Recording ${new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`
}
