import { Link } from 'react-router-dom'
import { Button } from '../components/ui'

export function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="font-mono text-sm text-ink-faint">404</p>
      <h1 className="text-xl font-semibold text-ink">This page does not exist</h1>
      <p className="max-w-sm text-sm text-ink-soft">
        The link may be out of date, or the meeting it pointed at was deleted.
      </p>
      <Link to="/" className="mt-2">
        <Button variant="primary">Back to dashboard</Button>
      </Link>
    </div>
  )
}
