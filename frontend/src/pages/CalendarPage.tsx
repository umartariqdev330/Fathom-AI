import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, Check, Link2 } from 'lucide-react'
import { api } from '../lib/api'
import { PageHeader } from '../components/AppLayout'
import { MeetingListItem, UpcomingRow } from '../components/MeetingListItem'
import { Button, Card, EmptyState, Skeleton } from '../components/ui'
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
          connection ? (
            <Button size="sm" onClick={() => setConnecting(true)}>
              <Check size={14} className="text-positive" />
              {connection.account}
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={() => setConnecting(true)}>
              <Link2 size={14} />
              Connect calendar
            </Button>
          )
        }
      />

      <div className="grid gap-6 px-5 py-6 lg:grid-cols-2 lg:px-8">
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
            <Card>
              <EmptyState
                icon={<CalendarDays size={22} />}
                title="Nothing scheduled"
                description="Connect a calendar to pull in your meetings."
              />
            </Card>
          )}
        </section>

        <section aria-labelledby="past">
          <h2 id="past" className="mb-3 text-sm font-semibold text-ink">
            Recorded
          </h2>

          {data && (
            <ul className="space-y-2.5">
              {data.past.slice(0, 6).map((meeting) => (
                <MeetingListItem key={meeting.id} meeting={meeting} />
              ))}
            </ul>
          )}
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
      description={
        connection
          ? undefined
          : 'Meetly reads your events so the notetaker knows which calls to join.'
      }
    >
      {connection ? (
        <div className="space-y-3">
          <p className="flex items-center gap-2 text-sm text-ink">
            <Check size={16} className="text-positive" />
            Connected as <span className="font-medium">{connection.account}</span>
          </p>
          <p className="text-xs text-ink-faint">
            The OAuth handshake is simulated in this build. A real integration would exchange a code
            for tokens and sync events on a schedule; the endpoint and the connection state are
            already in place for it.
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
          <p className="pt-1 text-xs text-ink-faint">
            Simulated for this build. No account is contacted and nothing is authorised.
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
