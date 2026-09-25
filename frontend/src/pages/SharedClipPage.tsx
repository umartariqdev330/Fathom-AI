import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Pause, Play, Sparkles } from 'lucide-react'
import { API_BASE, api } from '../lib/api'
import { durationLabel, meetingDate, timecode } from '../lib/format'
import { usePlayer } from '../hooks/usePlayer'
import { Avatar, AvatarStack, Button, Card, ErrorState, Skeleton, cx } from '../components/ui'

/**
 * Public page. No layout chrome, no auth: the person opening this link was
 * probably not on the call and may not have an account.
 */
export function SharedClipPage() {
  const { token = '' } = useParams()

  const { data, isLoading, error } = useQuery({
    queryKey: ['clip', token],
    queryFn: () => api.clip(token),
    retry: false,
  })

  const clipLength = data ? data.clip.end_time - data.clip.start_time : 0
  const player = usePlayer(clipLength, data?.media_url ? `${API_BASE}${data.media_url}` : null)
  const { currentTime, playing, toggle, seek } = player

  useEffect(() => {
    if (data) seek(0)
  }, [data, seek])

  const absoluteTime = (data?.clip.start_time ?? 0) + currentTime
  const activeLine = data?.segments.findLast?.((segment) => segment.start_time <= absoluteTime)
  const activeId = activeLine?.id
  const activeSpeaker = activeLine?.speaker ?? data?.participants[0]?.name ?? 'Meetly'

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3.5">
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="grid size-7 place-items-center rounded-sm bg-accent text-white">
              <Sparkles size={15} />
            </span>
            Meetly
          </Link>
          <span className="text-xs text-ink-faint">Shared clip</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8">
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="aspect-video w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        )}

        {error && (
          <Card>
            <ErrorState message="This clip link is not valid, or the clip was removed." />
          </Card>
        )}

        {data && (
          <>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">{data.clip.title}</h1>
            <p className="mt-1.5 text-sm text-ink-soft">
              From {data.meeting_title} · {meetingDate(data.meeting_date)} ·{' '}
              {durationLabel(clipLength)} clip
            </p>

            <div className="mt-4 mb-4 flex items-center gap-3">
              <AvatarStack names={data.participants.map((person) => person.name)} />
              <span className="text-xs text-ink-faint">
                {data.participants.length} people on this call
              </span>
            </div>

            <div className="overflow-hidden rounded-sm border border-line bg-surface shadow-[var(--shadow-card)]">
              {player.hasMedia && <audio {...player.mediaProps} className="hidden" />}
              {/* Same stage language as the in-app player, without its transport. */}
              <div className="flex aspect-video flex-col bg-[#121216]">
                <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2.5">
                  <Avatar name={activeSpeaker} size={56} />
                  <p className="text-sm font-medium text-white/90">{activeSpeaker}</p>
                </div>

                <div className="bg-gradient-to-t from-black/70 to-transparent px-5 pt-8 pb-3.5">
                  <p className="mx-auto line-clamp-2 max-w-2xl text-center text-[13px] leading-relaxed text-white/80 sm:text-sm">
                    {activeLine?.text ?? 'Press play to watch this moment.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 px-3 py-2.5">
                <Button variant="primary" size="sm" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
                  {playing ? <Pause size={15} /> : <Play size={15} />}
                </Button>

                <div
                  className="h-1.5 flex-1 cursor-pointer rounded-full bg-raised"
                  onClick={(event) => {
                    const bounds = event.currentTarget.getBoundingClientRect()
                    seek(((event.clientX - bounds.left) / bounds.width) * clipLength)
                  }}
                >
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${(currentTime / clipLength) * 100}%` }}
                  />
                </div>

                <span className="font-mono text-xs tabular-nums text-ink-soft">
                  {timecode(currentTime)} / {timecode(clipLength)}
                </span>
              </div>
            </div>

            <section className="mt-5">
              <h2 className="mb-2 text-sm font-semibold text-ink">Transcript</h2>
              <Card className="divide-y divide-line">
                {data.segments.map((segment) => (
                  <div
                    key={segment.id}
                    className={cx('flex gap-3 p-3.5', segment.id === activeId && 'bg-accent-soft')}
                  >
                    <Avatar name={segment.speaker} size={26} />
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-ink">
                        {segment.speaker}
                        <span className="ml-2 font-mono text-[11px] font-normal text-ink-faint">
                          {timecode(segment.start_time)}
                        </span>
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-ink-soft">{segment.text}</p>
                    </div>
                  </div>
                ))}

                {data.segments.length === 0 && (
                  <p className="p-6 text-center text-sm text-ink-soft">
                    No transcript lines fall inside this clip.
                  </p>
                )}
              </Card>
            </section>

            <p className="mt-6 text-center text-xs text-ink-faint">
              Shared with Meetly. <Link to="/" className="text-accent hover:underline">See how it works</Link>
            </p>
          </>
        )}
      </main>
    </div>
  )
}
