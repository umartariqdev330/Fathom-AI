import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ListTodo, Star, Trash2, Video } from 'lucide-react'
import type { MeetingCard } from '../types'
import { durationLabel, meetingTime, relativeDay } from '../lib/format'
import { useDeleteMeeting } from '../hooks/useDeleteMeeting'
import { AvatarStack, Badge } from './ui'
import { ConfirmDialog } from './ConfirmDialog'

function Meta({ meeting }: { meeting: MeetingCard }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-ink-faint">
      <span className="text-ink-soft">{relativeDay(meeting.date)}</span>
      <span>{meetingTime(meeting.date)}</span>
      <span>{durationLabel(meeting.duration)}</span>
      {meeting.platform && <span>{meeting.platform}</span>}
      {meeting.action_item_count > 0 && (
        <span className="flex items-center gap-1">
          <ListTodo size={12} />
          {meeting.action_item_count}
        </span>
      )}
      {meeting.highlight_count > 0 && (
        <span className="flex items-center gap-1">
          <Star size={12} />
          {meeting.highlight_count}
        </span>
      )}
    </div>
  )
}

/**
 * Sits outside the row's <Link> rather than inside it: a button nested in a
 * link is invalid markup and breaks keyboard navigation.
 */
function DeleteButton({ meeting }: { meeting: MeetingCard }) {
  const [confirming, setConfirming] = useState(false)
  const remove = useDeleteMeeting()

  return (
    <>
      <button
        onClick={() => setConfirming(true)}
        aria-label={`Delete ${meeting.title}`}
        title="Delete meeting"
        className="absolute top-3 right-3 rounded-lg bg-surface p-1.5 text-ink-faint opacity-0 transition hover:bg-critical/10 hover:text-critical focus-visible:opacity-100 group-hover:opacity-100"
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

export function MeetingListItem({ meeting }: { meeting: MeetingCard }) {
  return (
    <li className="group relative">
      <Link
        to={`/meetings/${meeting.id}`}
        className="flex items-start gap-3.5 rounded-xl border border-line bg-surface p-4 shadow-[var(--shadow-card)] transition-colors hover:border-line-strong hover:bg-raised/50"
      >
        <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent-ink">
          <Video size={16} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[15px] font-semibold text-ink">{meeting.title}</h3>
            <Badge tone={meeting.meeting_type === 'External' ? 'accent' : 'neutral'}>
              {meeting.meeting_type}
            </Badge>
          </div>

          {/* Capped so a summary does not run the full width of a wide screen. */}
          <p className="mt-1.5 line-clamp-2 max-w-[78ch] text-[13.5px] leading-[1.6] text-ink-soft">
            {meeting.overview ?? meeting.description}
          </p>

          <div className="mt-2.5">
            <Meta meeting={meeting} />
          </div>
        </div>

        <div className="hidden shrink-0 pr-7 sm:block">
          <AvatarStack names={meeting.participants.map((person) => person.name)} />
        </div>
      </Link>

      <DeleteButton meeting={meeting} />
    </li>
  )
}

export function MeetingTile({ meeting }: { meeting: MeetingCard }) {
  return (
    <li className="group relative">
      <Link
        to={`/meetings/${meeting.id}`}
        className="flex h-full flex-col rounded-xl border border-line bg-surface p-4 shadow-[var(--shadow-card)] transition-colors hover:border-line-strong hover:bg-raised/50"
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[15px] font-semibold text-ink">{meeting.title}</h3>
          <Badge tone={meeting.meeting_type === 'External' ? 'accent' : 'neutral'}>
            {meeting.meeting_type}
          </Badge>
        </div>

        <p className="mt-2 line-clamp-3 flex-1 text-[13.5px] leading-[1.6] text-ink-soft">
          {meeting.overview ?? meeting.description}
        </p>

        <div className="mt-3 flex items-center justify-between gap-2">
          <Meta meeting={meeting} />
          <AvatarStack names={meeting.participants.map((person) => person.name)} max={3} size={22} />
        </div>
      </Link>

      <DeleteButton meeting={meeting} />
    </li>
  )
}

export function UpcomingRow({ meeting }: { meeting: MeetingCard }) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3 shadow-[var(--shadow-card)]">
      <div className="w-[68px] shrink-0">
        <p className="truncate text-[11px] font-medium text-ink-faint">
          {relativeDay(meeting.date)}
        </p>
        <p className="font-mono text-[13px] whitespace-nowrap text-ink">
          {meetingTime(meeting.date)}
        </p>
      </div>
      <div className="min-w-0 flex-1 border-l border-line pl-3">
        <p className="line-clamp-2 text-[13px] leading-snug font-medium text-ink">{meeting.title}</p>
        <p className="mt-0.5 truncate text-[11px] text-ink-faint">
          {durationLabel(meeting.duration)}
          {meeting.platform && ` · ${meeting.platform}`}
        </p>
      </div>
      <AvatarStack names={meeting.participants.map((person) => person.name)} max={3} size={20} />
    </li>
  )
}
