import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, ArrowLeft, Loader2, Share2, Trash2 } from 'lucide-react'
import type { Highlight, TranscriptSegment } from '../types'
import { api } from '../lib/api'
import { durationLabel, meetingDate, meetingTime } from '../lib/format'
import { usePlayer } from '../hooks/usePlayer'
import { AvatarStack, Badge, Button, Dot, ErrorState, Skeleton, SourceBadge, cx } from '../components/ui'
import { useToast } from '../components/Toast'
import { RecordingPlayer } from '../components/meeting/Player'
import { Transcript } from '../components/meeting/Transcript'
import { SummaryPanel } from '../components/meeting/SummaryPanel'
import { ActionItems } from '../components/meeting/ActionItems'
import { HighlightList } from '../components/meeting/HighlightList'
import { HighlightDialog } from '../components/meeting/HighlightDialog'
import { ShareClipDialog, type ClipRange } from '../components/meeting/ShareClipDialog'

type Tab = 'summary' | 'actions' | 'highlights' | 'transcript'

export function MeetingDetail() {
  const { id } = useParams()
  const meetingId = Number(id)
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()

  const [tab, setTab] = useState<Tab>('summary')
  const [template, setTemplate] = useState('general')
  const [highlightTarget, setHighlightTarget] = useState<TranscriptSegment | null>(null)
  const [clipRange, setClipRange] = useState<ClipRange | null>(null)

  const { data: meeting, isLoading, error, refetch } = useQuery({
    queryKey: ['meeting', meetingId],
    queryFn: () => api.meeting(meetingId),
    enabled: Number.isFinite(meetingId),
    // A meeting being transcribed becomes readable in a few seconds; poll until it is.
    refetchInterval: (query) =>
      query.state.data?.processing_status === 'processing' ? 2000 : false,
  })

  const player = usePlayer(
    meeting?.duration ?? 0,
    meeting?.has_media ? api.mediaUrl(meetingId) : null,
  )
  const { seek, playFrom, currentTime } = player

  // Search results and shared links can deep-link to a moment.
  const deepLink = params.get('t')
  useEffect(() => {
    if (deepLink && meeting) seek(Number(deepLink))
  }, [deepLink, meeting, seek])

  const activeSegment = useMemo(() => {
    if (!meeting) return null
    const found = meeting.segments.findLast?.((segment) => segment.start_time <= currentTime)
    return found ?? meeting.segments[0] ?? null
  }, [meeting, currentTime])

  const remove = useMutation({
    mutationFn: () => api.deleteMeeting(meetingId),
    onSuccess: () => {
      queryClient.invalidateQueries()
      toast('Meeting deleted')
      navigate('/meetings')
    },
    onError: (err: Error) => toast(err.message, 'error'),
  })

  if (isLoading) return <DetailSkeleton />
  if (error || !meeting)
    return <ErrorState message={(error as Error)?.message ?? 'Meeting not found'} onRetry={refetch} />

  const shareHighlight = (highlight: Highlight) =>
    setClipRange({ start: highlight.start_time, end: highlight.end_time + 20, title: highlight.title })

  // Transcript sits second on narrow screens, where it has no rail of its own.
  const tabs: { id: Tab; label: string; count?: number; smallOnly?: boolean }[] = [
    { id: 'summary', label: 'Summary' },
    { id: 'transcript', label: 'Transcript', count: meeting.segments.length, smallOnly: true },
    { id: 'actions', label: 'Action items', count: meeting.action_items.length },
    { id: 'highlights', label: 'Highlights', count: meeting.highlights.length },
  ]

  return (
    <div className="pb-10">
      <header className="border-b border-line px-5 py-4 lg:px-8">
        <Link
          to="/meetings"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-ink-soft transition hover:text-ink"
        >
          <ArrowLeft size={15} />
          All meetings
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[22px] font-semibold text-ink">{meeting.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-ink-soft">
              <span>{meetingDate(meeting.date)}</span>
              <Dot />
              <span>{meetingTime(meeting.date)}</span>
              <Dot />
              <span>{durationLabel(meeting.duration)}</span>
              <Badge tone={meeting.meeting_type === 'External' ? 'accent' : 'neutral'}>
                {meeting.meeting_type}
              </Badge>
              {meeting.platform && <Badge>{meeting.platform}</Badge>}
              <SourceBadge source={meeting.source} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <AvatarStack names={meeting.participants.map((person) => person.name)} />
            <Button
              variant="primary"
              size="sm"
              onClick={() =>
                setClipRange({
                  start: Math.max(0, currentTime - 15),
                  end: Math.min(currentTime + 45, meeting.duration),
                  title: meeting.title,
                })
              }
            >
              <Share2 size={14} />
              Share
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => remove.mutate()}
              aria-label="Delete meeting"
              title="Delete meeting"
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </div>
      </header>

      {meeting.processing_status !== 'ready' && (
        <div className="mx-5 mt-4 lg:mx-8">
          <ProcessingNotice meeting={meeting} />
        </div>
      )}

      <div className="grid gap-5 px-5 py-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-8">
        <div className="min-w-0 space-y-4">
          <RecordingPlayer
            player={player}
            duration={meeting.duration}
            platform={meeting.platform}
            participants={meeting.participants}
            activeSegment={activeSegment}
            highlights={meeting.highlights}
            onShareClip={() =>
              setClipRange({
                start: Math.max(0, currentTime - 15),
                end: Math.min(currentTime + 45, meeting.duration),
                title: meeting.title,
              })
            }
          />

          <div className="overflow-hidden rounded-xl border border-line bg-surface">
            <div
              role="tablist"
              className="flex gap-0.5 overflow-x-auto border-b border-line px-2 pt-1.5 scrollbar-slim"
            >
              {tabs.map((item) => (
                <button
                  key={item.id}
                  role="tab"
                  aria-selected={tab === item.id}
                  onClick={() => setTab(item.id)}
                  className={cx(
                    'shrink-0 border-b-2 px-3 pb-2.5 text-sm font-medium transition-colors',
                    item.smallOnly && 'lg:hidden',
                    tab === item.id
                      ? 'border-accent text-ink'
                      : 'border-transparent text-ink-soft hover:text-ink',
                  )}
                >
                  {item.label}
                  {item.count !== undefined && (
                    <span
                      className={cx(
                        'ml-1.5 rounded px-1 py-0.5 text-[11px] tabular-nums',
                        tab === item.id ? 'bg-accent-soft text-accent-ink' : 'text-ink-faint',
                      )}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {tab === 'summary' && (
              <SummaryPanel
                meetingId={meeting.id}
                template={template}
                onTemplateChange={setTemplate}
                onPlay={playFrom}
              />
            )}
            {tab === 'actions' && <ActionItems meeting={meeting} />}
            {tab === 'highlights' && (
              <HighlightList meeting={meeting} onPlay={playFrom} onShareClip={shareHighlight} />
            )}
            {tab === 'transcript' && (
              <div className="h-[520px] lg:hidden">
                <Transcript
                  segments={meeting.segments}
                  meetingTitle={meeting.title}
                  activeId={activeSegment?.id ?? null}
                  onSeek={playFrom}
                  onHighlight={setHighlightTarget}
                />
              </div>
            )}
          </div>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-5 h-[calc(100vh-3rem)] overflow-hidden rounded-xl border border-line bg-surface">
            <Transcript
              segments={meeting.segments}
              meetingTitle={meeting.title}
              activeId={activeSegment?.id ?? null}
              onSeek={playFrom}
              onHighlight={setHighlightTarget}
            />
          </div>
        </aside>
      </div>

      <HighlightDialog
        meetingId={meeting.id}
        segment={highlightTarget}
        onClose={() => setHighlightTarget(null)}
      />
      <ShareClipDialog
        meetingId={meeting.id}
        duration={meeting.duration}
        range={clipRange}
        onClose={() => setClipRange(null)}
      />
    </div>
  )
}

function ProcessingNotice({ meeting }: { meeting: { processing_status: string; processing_error: string | null } }) {
  const failed = meeting.processing_status === 'failed'

  return (
    <div
      className={cx(
        'flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm',
        failed ? 'border-critical/30 bg-critical/5' : 'border-line bg-surface',
      )}
      role="status"
    >
      {failed ? (
        <AlertCircle size={16} className="mt-0.5 shrink-0 text-critical" />
      ) : (
        <Loader2 size={16} className="mt-0.5 shrink-0 animate-spin text-accent" />
      )}
      <div>
        <p className="font-medium text-ink">
          {failed ? 'Processing failed' : 'Transcribing and summarising this recording'}
        </p>
        <p className="mt-0.5 text-ink-soft">
          {failed
            ? meeting.processing_error ?? 'Something went wrong while processing this recording.'
            : 'This usually takes a few seconds. The page updates itself when it is done.'}
        </p>
      </div>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-5 p-5 lg:p-8">
      <Skeleton className="h-7 w-72" />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <Skeleton className="aspect-video w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
        <Skeleton className="hidden h-[70vh] w-full lg:block" />
      </div>
    </div>
  )
}
