import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ListTodo, Star, Trash2 } from 'lucide-react'
import type { MeetingCard } from '../types'
import { durationLabel, meetingTime } from '../lib/format'
import { useDeleteMeeting } from '../hooks/useDeleteMeeting'
import { AvatarStack, Badge, cx } from './ui'
import { ConfirmDialog } from './ConfirmDialog'

/**
 * One meeting inside a day group.
 *
 * The day is already stated by the group heading, so the row only carries the
 * clock time in a fixed left column. That column lines every row up on the same
 * axis, which is what makes a long list scannable without a card around each one.
 */
export function MeetingRow({ meeting }: { meeting: MeetingCard }) {
  return (
    <li className="group relative">
      <Link
        to={`/meetings/${meeting.id}`}
        className="flex gap-4 border-b border-line py-3.5 pr-10 transition-colors hover:bg-raised/40"
      >
        <div className="w-16 shrink-0 pt-0.5 text-right">
          <p className="font-mono text-[13px] whitespace-nowrap text-ink">
            {meetingTime(meeting.date)}
          </p>
          <p className="mt-0.5 font-mono text-[11px] text-ink-faint">
            {durationLabel(meeting.duration)}
          </p>
        </div>

        <span
          className={cx(
            'mt-1.5 h-2 w-2 shrink-0 rounded-full',
            meeting.meeting_type === 'External' ? 'bg-accent' : 'bg-line-strong',
          )}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[15px] leading-snug font-semibold text-ink">{meeting.title}</h3>
            {meeting.meeting_type === 'External' && <Badge tone="accent">External</Badge>}
          </div>

          <p className="mt-1 line-clamp-2 max-w-[80ch] text-[13px] leading-[1.6] text-ink-soft">
            {meeting.overview ?? meeting.description}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-faint">
            {meeting.platform && <span>{meeting.platform}</span>}
            {meeting.action_item_count > 0 && (
              <span className="flex items-center gap-1">
                <ListTodo size={11} />
                {meeting.action_item_count}
              </span>
            )}
            {meeting.highlight_count > 0 && (
              <span className="flex items-center gap-1">
                <Star size={11} />
                {meeting.highlight_count}
              </span>
            )}
          </div>
        </div>

        <div className="hidden shrink-0 self-center sm:block">
          <AvatarStack names={meeting.participants.map((person) => person.name)} max={4} size={24} />
        </div>
      </Link>

      <RowDelete meeting={meeting} />
    </li>
  )
}

/** Outside the <Link>: a button nested in a link breaks keyboard navigation. */
function RowDelete({ meeting }: { meeting: MeetingCard }) {
  const [confirming, setConfirming] = useState(false)
  const remove = useDeleteMeeting()

  return (
    <>
      <button
        onClick={() => setConfirming(true)}
        aria-label={`Delete ${meeting.title}`}
        title="Delete meeting"
        className="absolute top-3.5 right-1 rounded-sm p-1.5 text-ink-faint transition hover:bg-critical/10 hover:text-critical sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
      >
        <Trash2 size={15} />
      </button>

      <ConfirmDialog
        open={confirming}
        title="Delete this meeting?"
        description={`“${meeting.title}” and its transcript, summary, action items and highlights will be permanently deleted. This cannot be undone.`}
        pending={remove.isPending}
        onConfirm={() => remove.mutate(meeting.id)}
        onClose={() => setConfirming(false)}
      />
    </>
  )
}

/** The day heading a group of rows sits under. */
export function DayHeading({ label, count }: { label: string; count: number }) {
  return (
    <div className="sticky top-14 z-10 flex items-baseline gap-2 border-b border-line-strong bg-canvas/95 py-2 backdrop-blur-sm">
      <h2 className="text-[11px] font-semibold tracking-[0.1em] text-ink uppercase">{label}</h2>
      <span className="font-mono text-[11px] text-ink-faint">{count}</span>
    </div>
  )
}
