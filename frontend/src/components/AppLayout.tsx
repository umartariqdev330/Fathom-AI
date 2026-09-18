import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  CalendarDays,
  Home,
  Menu,
  Search,
  Settings,
  Sparkles,
  Star,
  Video,
  X,
} from 'lucide-react'
import { Avatar, Button, cx } from './ui'
import { RecordDialog } from './RecordDialog'

const NAV = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/meetings', label: 'Meetings', icon: Video },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/highlights', label: 'Highlights', icon: Star },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export const CURRENT_USER = { name: 'Muhammad Umar', email: 'muhammad@meetly.ai' }

export function AppLayout() {
  const [navOpen, setNavOpen] = useState(false)
  const [recording, setRecording] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => setNavOpen(false), [location.pathname])

  // Cmd/Ctrl+K is the fastest path to the thing this product is actually for.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        navigate('/search')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [navigate])

  return (
    <div className="min-h-screen lg:flex">
      <MobileBar onOpen={() => setNavOpen(true)} />

      {navOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setNavOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={cx(
          'fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-line bg-surface transition-transform lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:translate-x-0',
          navOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="grid size-7 place-items-center rounded-lg bg-accent text-white">
              <Sparkles size={15} />
            </span>
            Meetly
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setNavOpen(false)}
            aria-label="Close navigation"
          >
            <X size={16} />
          </Button>
        </div>

        <div className="px-3 pb-3">
          <Button variant="primary" className="w-full" onClick={() => setRecording(true)}>
            <Video size={15} />
            Record meeting
          </Button>
        </div>

        <nav className="flex-1 space-y-0.5 px-2" aria-label="Main">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cx(
                  'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition',
                  isActive ? 'bg-raised text-ink' : 'text-ink-soft hover:bg-raised hover:text-ink',
                )
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-line p-3">
          <Link
            to="/settings"
            className="flex items-center gap-2.5 rounded-lg p-1.5 transition hover:bg-raised"
          >
            <Avatar name={CURRENT_USER.name} size={30} />
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-ink">
                {CURRENT_USER.name}
              </span>
              <span className="block truncate text-xs text-ink-faint">Free plan</span>
            </span>
          </Link>
        </div>
      </aside>

      <main className="min-w-0 flex-1 pt-14 lg:pt-0">
        <Outlet />
      </main>

      <RecordDialog open={recording} onClose={() => setRecording(false)} />
    </div>
  )
}

function MobileBar({ onOpen }: { onOpen: () => void }) {
  return (
    <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-surface px-3 lg:hidden">
      <Button variant="ghost" size="sm" onClick={onOpen} aria-label="Open navigation">
        <Menu size={18} />
      </Button>
      <Link to="/" className="flex items-center gap-2 font-semibold">
        <span className="grid size-6 place-items-center rounded-md bg-accent text-white">
          <Sparkles size={13} />
        </span>
        Meetly
      </Link>
      <Link to="/search" aria-label="Search" className="p-2 text-ink-soft">
        <Search size={18} />
      </Link>
    </header>
  )
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="sticky top-14 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-canvas/85 px-5 py-4 backdrop-blur-md lg:top-0 lg:px-8">
      <div className="min-w-0">
        <h1 className="text-[22px] font-semibold text-ink">{title}</h1>
        {subtitle && <p className="mt-0.5 truncate text-[13px] text-ink-soft">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {actions}
        <button
          className="hidden size-9 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-raised hover:text-ink sm:inline-flex"
          aria-label="Notifications"
        >
          <Bell size={17} />
        </button>
      </div>
    </div>
  )
}
