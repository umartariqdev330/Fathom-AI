import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, Check, Link2 } from 'lucide-react'
import { api } from '../lib/api'
import { byDay } from '../lib/format'
import { PageHeader } from '../components/AppLayout'
import { UpcomingRow } from '../components/MeetingListItem'
import { DayHeading, MeetingRow } from '../components/MeetingRow'
import { Badge, Button, EmptyState, Skeleton } from '../components/ui'
import { Modal } from '../components/Modal'
import { useToast } from '../components/Toast'

const CONNECTION_KEY = 'meetly.calendar'

type Connection = { provider: string; account: string }

export function CalendarPage() {
  const { data, isLoading } = useQuery({ queryKey: ['calendar'], queryFn: api.calendar })
  const [connection, setConnection] = useState<Connection | null>(readConnection)
  const [connecting, setConnecting] = useState(false)

  return (
    <div>
      <PageHeader
        title="Calendar"
        subtitle="What is coming up, and what has already been recorded."
        actions={
          <div className="flex items-center gap-2">
            <Badge tone="caution">Demo</Badge>
            {connection ? (
              <Button size="sm" onClick={() => setConnecting(true)}>
                <Check size={14} className="text-positive" />
                {connection.account}
              </Button>
            ) : (
              <Button variant="primary" size="sm" onClick={() => setConnecting(true)}>
                <Link2 size={14} />
                Connect calendar
              </Button>
            )}
          </div>
        }
      />

      <div className="mt-5 space-y-9">
        <section aria-labelledby="upcoming">
          <h2 id="upcoming" className="mb-3 text-sm font-semibold text-ink">
            Upcoming
          </h2>

          {isLoading && (
            <div className="space-y-2.5">
              {[0, 1, 2].map((key) => (
                <Skeleton key={key} className="h-[68px] w-full" />
              ))}
            </div>
          )}

          {data && data.upcoming.length > 0 && (
            <ul className="space-y-2.5">
              {data.upcoming.map((meeting) => (
                <UpcomingRow key={meeting.id} meeting={meeting} />
              ))}
            </ul>
          )}

          {data?.upcoming.length === 0 && (
            <EmptyState
              icon={<CalendarDays size={22} />}
              title="Nothing scheduled"
              description="Connect a calendar to pull in your meetings."
            />
          )}
        </section>

        <section aria-labelledby="past">
          <h2 id="past" className="mb-3 text-sm font-semibold text-ink">
            Recorded
          </h2>

          {data &&
            byDay(data.past.slice(0, 8)).map(([day, group]) => (
              <div key={day}>
                <DayHeading label={day} count={group.length} />
                <ul>
                  {group.map((meeting) => (
                    <MeetingRow key={meeting.id} meeting={meeting} />
                  ))}
                </ul>
              </div>
            ))}
        </section>
      </div>

      <ConnectDialog
        open={connecting}
        connection={connection}
        onConnected={setConnection}
        onClose={() => setConnecting(false)}
      />
    </div>
  )
}

function ConnectDialog({
  open,
  connection,
  onConnected,
  onClose,
}: {
  open: boolean
  connection: Connection | null
  onConnected: (value: Connection | null) => void
  onClose: () => void
}) {
  const [busy, setBusy] = useState(false)
  const toast = useToast()

  async function connect(provider: 'google' | 'outlook') {
    setBusy(true)
    try {
      const result = await api.connectCalendar(provider)
      const value = { provider: result.provider, account: result.account }
      localStorage.setItem(CONNECTION_KEY, JSON.stringify(value))
      onConnected(value)
      toast(`Calendar connected · ${result.synced_events} events synced`)
      onClose()
    } catch (error) {
      toast((error as Error).message, 'error')
    } finally {
      setBusy(false)
    }
  }

  function disconnect() {
    localStorage.removeItem(CONNECTION_KEY)
    onConnected(null)
    toast('Calendar disconnected')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={connection ? 'Calendar connection' : 'Connect a calendar'}
      description="This handshake is a placeholder. No provider is contacted and no account is authorised."
    >
      {connection ? (
        <div className="space-y-3">
          <p className="flex items-center gap-2 text-sm text-ink">
            <Check size={16} className="text-positive" />
            Placeholder account <span className="font-medium">{connection.account}</span>
          </p>
          <p className="text-xs leading-relaxed text-ink-faint">
            Nothing was authorised. A real integration would exchange a code for tokens and sync
            events on a schedule; the endpoint and the connection state are in place for it. The
            upcoming and recorded meetings on this page are read from the database for real — this
            one handshake is the only stubbed call in the API.
          </p>
          <Button variant="danger" onClick={disconnect}>
            Disconnect
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <Button className="w-full justify-start" disabled={busy} onClick={() => connect('google')}>
            Continue with Google Calendar
          </Button>
          <Button className="w-full justify-start" disabled={busy} onClick={() => connect('outlook')}>
            Continue with Outlook Calendar
          </Button>
          <p className="pt-1 text-xs leading-relaxed text-ink-faint">
            Neither button opens a provider. They record a placeholder connection locally so the
            rest of the calendar can be demonstrated; every other call in this app reads and writes
            the database.
          </p>
        </div>
      )}
    </Modal>
  )
}

function readConnection(): Connection | null {
  try {
    const raw = localStorage.getItem(CONNECTION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
