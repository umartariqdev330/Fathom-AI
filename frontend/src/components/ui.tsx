import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { avatarTint, initials } from '../lib/format'

export function cx(...values: (string | false | null | undefined)[]) {
  return values.filter(Boolean).join(' ')
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
}

const BUTTON_VARIANTS = {
  primary: 'bg-accent text-white shadow-[var(--shadow-card)] hover:brightness-110 active:brightness-95',
  secondary: 'bg-surface text-ink border border-line hover:border-line-strong hover:bg-raised',
  ghost: 'text-ink-soft hover:bg-raised hover:text-ink',
  danger: 'text-ink-faint hover:bg-critical/10 hover:text-critical',
}

export function Button({ variant = 'secondary', size = 'md', className, ...props }: ButtonProps) {
  return (
    <button
      className={cx(
        'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg font-medium transition-[background-color,border-color,color,filter,opacity] duration-150',
        'disabled:pointer-events-none disabled:opacity-45',
        size === 'sm' ? 'h-8 px-2.5 text-[13px]' : 'h-9 px-3.5 text-sm',
        BUTTON_VARIANTS[variant],
        className,
      )}
      {...props}
    />
  )
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cx('rounded-xl border border-line bg-surface shadow-[var(--shadow-card)]', className)}
    >
      {children}
    </div>
  )
}

/** The small uppercase label above a group of content. */
export function SectionLabel({
  icon,
  children,
  className,
}: {
  icon?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <h3
      className={cx(
        'flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.07em] text-ink-faint uppercase',
        className,
      )}
    >
      {icon}
      {children}
    </h3>
  )
}

const BADGE_TONES = {
  neutral: 'bg-raised text-ink-soft',
  accent: 'bg-accent-soft text-accent-ink',
  positive: 'bg-positive/10 text-positive',
  caution: 'bg-caution/10 text-caution',
  critical: 'bg-critical/10 text-critical',
}

export function Badge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: keyof typeof BADGE_TONES
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap',
        BADGE_TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

export function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  return (
    <span
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold',
        avatarTint(name),
      )}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      title={name}
    >
      {initials(name)}
    </span>
  )
}

export function AvatarStack({
  names,
  max = 4,
  size = 26,
}: {
  names: string[]
  max?: number
  size?: number
}) {
  const shown = names.slice(0, max)
  const extra = names.length - shown.length

  return (
    <div className="flex items-center" aria-label={`${names.length} participants`}>
      {shown.map((name) => (
        <span key={name} className="-mr-1.5 rounded-full ring-2 ring-surface last:mr-0">
          <Avatar name={name} size={size} />
        </span>
      ))}
      {extra > 0 && (
        <span
          className="ml-2 text-xs font-medium text-ink-faint"
          title={names.slice(max).join(', ')}
        >
          +{extra}
        </span>
      )}
    </div>
  )
}

/**
 * Where a meeting's content came from.
 *
 * Authored demo content must never be mistaken for live AI output, so every
 * meeting says which it is.
 */
export function SourceBadge({ source }: { source: string }) {
  if (source === 'recorded') {
    return <Badge tone="positive">Real recording</Badge>
  }
  if (source === 'simulated') {
    return <Badge tone="caution">Simulated capture</Badge>
  }
  return <Badge>Demo data</Badge>
}

/** Separator between inline metadata items. */
export function Dot() {
  return <span className="size-0.5 rounded-full bg-ink-faint" aria-hidden />
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('animate-pulse rounded-md bg-raised', className)} />
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      {icon && <div className="text-ink-faint">{icon}</div>}
      <p className="font-medium text-ink">{title}</p>
      {description && <p className="max-w-sm text-sm text-ink-soft">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <EmptyState
      title="Something went wrong"
      description={message}
      action={onRetry && <Button onClick={onRetry}>Try again</Button>}
    />
  )
}
