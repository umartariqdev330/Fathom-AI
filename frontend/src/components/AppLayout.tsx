import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Activity, CalendarDays, Circle, Home, Menu, Search, Settings, Star, Video, X } from 'lucide-react'
import { Avatar, Button, cx } from './ui'
import { RecordDialog } from './RecordDialog'

const NAV = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/meetings', label: 'Meetings', icon: Video },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
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
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-line bg-canvas/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-2 px-4 lg:px-7">
          <Link to="/" className="flex shrink-0 items-center gap-2">
            <span className="grid size-7 place-items-center bg-ink text-canvas">
              <Activity size={15} strokeWidth={2.5} />
            </span>
            <span className="text-[15px] font-semibold tracking-tight">Meetly</span>
          </Link>

          <nav className="ml-4 hidden items-center gap-0.5 md:flex" aria-label="Main">
            {NAV.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cx(
                    'px-2.5 py-1.5 text-[13px] font-medium transition-colors',
                    isActive
                      ? 'text-ink underline decoration-accent decoration-2 underline-offset-[10px]'
                      : 'text-ink-soft hover:text-ink',
                  )
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/search"
              className="hidden items-center gap-2 border border-line bg-surface px-2.5 py-1.5 text-xs text-ink-faint transition hover:border-line-strong sm:flex"
            >
              <Search size={13} />
              Search
              <kbd className="border border-line px-1 font-mono text-[10px]">Ctrl K</kbd>
            </Link>

            <Button variant="primary" size="sm" onClick={() => setRecording(true)}>
              <Circle size={9} className="fill-current" />
              Record
            </Button>

            <Link to="/settings" className="hidden shrink-0 sm:block" aria-label="Account">
              <Avatar name={CURRENT_USER.name} size={28} />
            </Link>

            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setNavOpen((value) => !value)}
              aria-label={navOpen ? 'Close navigation' : 'Open navigation'}
            >
              {navOpen ? <X size={17} /> : <Menu size={17} />}
            </Button>
          </div>
        </div>

        {navOpen && (
          <nav className="border-t border-line bg-surface px-4 py-2 md:hidden" aria-label="Main">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cx(
                    'flex items-center gap-2.5 px-1 py-2.5 text-sm font-medium',
                    isActive ? 'text-accent' : 'text-ink-soft',
                  )
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-[1400px] px-4 lg:px-7">
        <Outlet />
      </main>

      <RecordDialog open={recording} onClose={() => setRecording(false)} />
    </div>
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
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line py-6">
      <div className="min-w-0">
        <h1 className="text-[26px] leading-tight font-semibold tracking-[-0.02em] text-ink">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-[13px] text-ink-soft">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
