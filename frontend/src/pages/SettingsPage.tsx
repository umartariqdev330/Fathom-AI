import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useTheme, type Theme } from '../lib/theme'
import { CURRENT_USER, PageHeader } from '../components/AppLayout'
import { Avatar, Button, Card, cx } from '../components/ui'
import { useToast } from '../components/Toast'
import { AiSettingsCard } from '../components/AiSettingsCard'

/** Preferences live in this browser. There is no account system in this build. */
function useSetting(key: string, fallback: boolean) {
  const [value, setValue] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(`meetly.${key}`) ?? String(fallback))
    } catch {
      return fallback
    }
  })

  return [
    value as boolean,
    (next: boolean) => {
      localStorage.setItem(`meetly.${key}`, JSON.stringify(next))
      setValue(next)
    },
  ] as const
}

export function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const toast = useToast()

  const [emailSummary, setEmailSummary] = useSetting('notify.email', true)
  const [slackPost, setSlackPost] = useSetting('notify.slack', false)
  const [actionDigest, setActionDigest] = useSetting('notify.digest', true)
  const [autoRecordExternal, setAutoRecordExternal] = useSetting('record.external', true)
  const [autoRecordInternal, setAutoRecordInternal] = useSetting('record.internal', false)
  const [autoHighlights, setAutoHighlights] = useSetting('ai.highlights', true)

  return (
    <div>
      <PageHeader title="Settings" subtitle="Preferences for this workspace." />

      <div className="max-w-3xl space-y-4 px-5 py-6 lg:px-8">
        <Section title="Profile">
          <div className="flex items-center gap-3">
            <Avatar name={CURRENT_USER.name} size={44} />
            <div>
              <p className="font-medium text-ink">{CURRENT_USER.name}</p>
              <p className="text-sm text-ink-soft">{CURRENT_USER.email}</p>
            </div>
            <Button
              size="sm"
              className="ml-auto"
              onClick={() => toast('Accounts are out of scope for this build')}
            >
              Edit
            </Button>
          </div>
        </Section>

        <Section title="Appearance">
          <Row label="Theme" hint="Follows your system setting unless you pick one.">
            <div className="flex rounded-lg border border-line bg-canvas p-0.5">
              {(['light', 'dark', 'system'] as Theme[]).map((option) => (
                <button
                  key={option}
                  onClick={() => setTheme(option)}
                  aria-pressed={theme === option}
                  className={cx(
                    'rounded-md px-2.5 py-1 text-xs font-medium capitalize transition',
                    theme === option ? 'bg-surface text-ink shadow-sm' : 'text-ink-soft hover:text-ink',
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </Row>
        </Section>

        <Section title="Notifications">
          <Toggle
            label="Email me the summary after each call"
            checked={emailSummary}
            onChange={setEmailSummary}
          />
          <Toggle label="Post summaries to Slack" checked={slackPost} onChange={setSlackPost} />
          <Toggle
            label="Weekly digest of open action items"
            checked={actionDigest}
            onChange={setActionDigest}
          />
        </Section>

        <Section title="Meeting preferences">
          <Toggle
            label="Auto-record external meetings"
            hint="Calls with someone outside your domain."
            checked={autoRecordExternal}
            onChange={setAutoRecordExternal}
          />
          <Toggle
            label="Auto-record internal meetings"
            checked={autoRecordInternal}
            onChange={setAutoRecordInternal}
          />
          <Toggle
            label="Suggest highlights automatically"
            hint="Marks likely key moments when a meeting finishes processing."
            checked={autoHighlights}
            onChange={setAutoHighlights}
          />
        </Section>

        <AiSettingsCard />

        <Section title="Calendar">
          <Row label="Connection" hint="Pull in events so the notetaker knows which calls to join.">
            <Link to="/calendar">
              <Button size="sm">Manage</Button>
            </Link>
          </Row>
        </Section>

        <Section title="Danger zone">
          <Row label="Reset demo data" hint="Re-seed the workspace from the server fixtures.">
            <Button
              variant="danger"
              size="sm"
              onClick={() =>
                api
                  .stats()
                  .then(() =>
                    toast('Re-seeding runs server-side: python seed.py in the backend directory'),
                  )
              }
            >
              How to reset
            </Button>
          </Row>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold text-ink">{title}</h2>
      <div className="space-y-3">{children}</div>
    </Card>
  )
}

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm text-ink">{label}</p>
        {hint && <p className="mt-0.5 text-xs leading-relaxed text-ink-faint">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint?: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <Row label={label} hint={hint}>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cx(
          'relative h-5 w-9 rounded-full transition',
          checked ? 'bg-accent' : 'bg-line-strong',
        )}
      >
        <span
          className={cx(
            'absolute top-0.5 size-4 rounded-full bg-white transition',
            checked ? 'left-4.5' : 'left-0.5',
          )}
        />
      </button>
    </Row>
  )
}
