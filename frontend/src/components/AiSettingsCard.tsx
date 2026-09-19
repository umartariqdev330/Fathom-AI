import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Check, Eye, EyeOff, Plug } from 'lucide-react'
import { api } from '../lib/api'
import { Badge, Button, Card, Skeleton, cx } from './ui'
import { useToast } from './Toast'

const FIELD =
  'h-9 w-full rounded-lg border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-accent'

export function AiSettingsCard() {
  const queryClient = useQueryClient()
  const toast = useToast()

  const settings = useQuery({ queryKey: ['ai-settings'], queryFn: api.aiSettings })
  const models = useQuery({ queryKey: ['ai-models'], queryFn: api.aiModels })

  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [summaryModel, setSummaryModel] = useState('')
  const [transcribeModel, setTranscribeModel] = useState('')

  // Seed the selects once the server says what is currently in use.
  useEffect(() => {
    if (!settings.data) return
    setSummaryModel(settings.data.summary_model)
    setTranscribeModel(settings.data.transcribe_model)
  }, [settings.data])

  const save = useMutation({
    mutationFn: () =>
      api.saveAiSettings({
        // Only send the key when one was typed, so saving a model change does
        // not wipe a key the user cannot see.
        ...(apiKey.trim() ? { api_key: apiKey.trim() } : {}),
        summary_model: summaryModel,
        transcribe_model: transcribeModel,
      }),
    onSuccess: () => {
      setApiKey('')
      queryClient.invalidateQueries({ queryKey: ['ai-settings'] })
      queryClient.invalidateQueries({ queryKey: ['ai-models'] })
      toast('AI settings saved')
    },
    onError: (error: Error) => toast(error.message, 'error'),
  })

  const test = useMutation({
    mutationFn: api.testAiConnection,
    onSuccess: (result) => toast(result.detail, result.ok ? 'success' : 'error'),
    onError: (error: Error) => toast(error.message, 'error'),
  })

  const clearKey = useMutation({
    mutationFn: () => api.saveAiSettings({ api_key: '' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-settings'] })
      toast('Saved key removed')
    },
    onError: (error: Error) => toast(error.message, 'error'),
  })

  if (settings.isPending) {
    return (
      <Card className="space-y-3 p-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </Card>
    )
  }

  const data = settings.data
  const chatModels = models.data ?? []

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-ink">AI</h2>
        {data && <KeyStatus source={data.key_source} masked={data.masked_key} />}
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-soft">OpenAI API key</span>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder={data?.key_source === 'saved' ? 'Enter a new key to replace the current one' : 'sk-...'}
                autoComplete="off"
                spellCheck={false}
                className={cx(FIELD, 'pr-9 font-mono')}
              />
              <button
                type="button"
                onClick={() => setShowKey((value) => !value)}
                aria-label={showKey ? 'Hide key' : 'Show key'}
                className="absolute top-1/2 right-2 -translate-y-1/2 text-ink-faint hover:text-ink"
              >
                {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {data?.key_source === 'saved' && (
              <Button variant="danger" onClick={() => clearKey.mutate()} disabled={clearKey.isPending}>
                Remove
              </Button>
            )}
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-ink-faint">
            Without a key, transcription and AI summaries cannot be generated. The key is stored locally
            in the database and never sent back to this page.
          </p>
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-soft">Summary model</span>
            <select
              value={summaryModel}
              onChange={(event) => setSummaryModel(event.target.value)}
              className={FIELD}
            >
              {/* The saved model may not be in the fetched list; keep it selectable. */}
              {[...new Set([summaryModel, ...chatModels])].filter(Boolean).map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-soft">Transcription model</span>
            <select
              value={transcribeModel}
              onChange={(event) => setTranscribeModel(event.target.value)}
              className={FIELD}
            >
              {[...new Set([transcribeModel, ...(data?.transcribe_models ?? [])])]
                .filter(Boolean)
                .map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
            </select>
          </label>
        </div>

        <p className="flex items-start gap-2 rounded-lg border border-caution/30 bg-caution/5 px-3 py-2.5 text-xs leading-relaxed text-ink-soft">
          <AlertTriangle size={14} className="mt-0.5 shrink-0 text-caution" />
          This build has no sign-in, so anyone who can open the app can use a saved key and spend
          against it.
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary" onClick={() => save.mutate()} disabled={save.isPending}>
            <Check size={14} />
            Save
          </Button>
          <Button onClick={() => test.mutate()} disabled={test.isPending || data?.key_source !== 'saved'}>
            <Plug size={14} />
            {test.isPending ? 'Testing' : 'Test connection'}
          </Button>
        </div>
      </div>
    </Card>
  )
}

function KeyStatus({ source, masked }: { source: string; masked: string | null }) {
  if (source === 'saved') {
    return (
      <Badge tone="positive">
        Saved in app · <span className="font-mono">{masked}</span>
      </Badge>
    )
  }
  return <Badge tone="caution">Not configured</Badge>
}
