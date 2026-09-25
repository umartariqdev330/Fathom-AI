import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useTheme, type Theme } from '../lib/theme'
import { CURRENT_USER, PageHeader } from '../components/AppLayout'
import { Avatar, Button, cx } from '../components/ui'
import { useToast } from '../components/Toast'
import { AiSettingsCard } from '../components/AiSettingsCard'

const SECTIONS = [
  { id: 'profile', label: 'Profile' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'ai', label: 'AI' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'recording', label: 'Recording' },
  { id: 'workspace', label: 'Workspace' },
] as const

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
    <div className="pb-20">
      <PageHeader title="Settings" subtitle="Preferences for this workspace." />

      <div className="mt-5 gap-10 lg:grid lg:grid-cols-[168px_minmax(0,640px)]">
        {/* Anchors rather than tabs: every setting stays on one scrollable page,
            so nothing is hidden behind a click. */}
        <nav aria-label="Settings sections" className="mb-5 lg:mb-0">
          <ul className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-slim lg:sticky lg:top-[4.5rem] lg:block lg:overflow-visible lg:pb-0">
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="block shrink-0 border border-line bg-surface px-2.5 py-1.5 text-[13px] whitespace-nowrap text-ink-soft transition hover:text-ink lg:border-0 lg:border-l-2 lg:bg-transparent lg:py-1 lg:hover:border-line-strong lg:hover:text-accent"
                >
                  {section.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 divide-y divide-line">
          <Section id="profile" title="Profile">
            <div className="flex items-center gap-3">
              <Avatar name={CURRENT_USER.name} size={44} />
              <div className="min-w-0">
                <p className="font-medium text-ink">{CURRENT_USER.name}</p>
                <p className="truncate text-sm text-ink-soft">{CURRENT_USER.email}</p>
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

          <Section id="appearance" title="Appearance">
            <Row label="Theme" hint="Follows your system setting unless you pick one.">
              <div className="flex border border-line bg-canvas p-0.5">
                {(['light', 'dark', 'system'] as Theme[]).map((option) => (
                  <button
                    key={option}
                    onClick={() => setTheme(option)}
                    aria-pressed={theme === option}
                    className={cx(
                      'px-2.5 py-1 text-xs font-medium capitalize transition',
                      theme === option
                        ? 'bg-surface text-ink shadow-sm'
                        : 'text-ink-soft hover:text-ink',
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </Row>
          </Section>

          <section id="ai" className="scroll-mt-20 py-6">
            <AiSettingsCard />
          </section>

          <Section id="notifications" title="Notifications">
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

          <Section id="recording" title="Recording">
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

          <Section id="workspace" title="Workspace">
            <Row label="Calendar" hint="Pull in events so the notetaker knows which calls to join.">
              <Link to="/calendar">
                <Button size="sm">Manage</Button>
              </Link>
            </Row>
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
    </div>
  )
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 py-6">
      <h2 className="mb-3 text-sm font-semibold text-ink">{title}</h2>
      <div className="space-y-3.5">{children}</div>
    </section>
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
