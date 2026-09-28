import { ListMusic, Music4 } from 'lucide-react'
import { formatDuration } from '@/utils/format'
import { useMedia } from '@/hooks/useMedia'
import { PageHeader } from '@/components/layout/PageHeader'
import { MediaControl } from '@/components/dashboard/MediaControl'
import { VolumeControl } from '@/components/dashboard/VolumeControl'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'

/** Dedicated media page: large transport + volume + player queue. */
export function MediaPage() {
  const media = useMedia()

  return (
    <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-5">
      <PageHeader
        title="Media"
        description="Control whatever is playing on APEX - Spotify, a browser tab, VLC or system audio."
        icon={<Music4 className="h-5 w-5" />}
        actions={<Badge tone={media.media?.isPlaying ? 'success' : 'neutral'}>{media.media?.isPlaying ? 'Playing' : 'Paused'}</Badge>}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
        <div className="lg:col-span-8">
          <MediaControl controller={media} expanded />
        </div>
        <div className="lg:col-span-4 flex flex-col gap-4">
          <VolumeControl controller={media} />
          <Card>
            <CardHeader
              title="Queue"
              icon={<ListMusic className="h-5 w-5" />}
              subtitle={media.queue.length > 0 ? `${media.queue.length} tracks in the player` : 'Reported by the PC'}
            />
            {media.queue.length === 0 ? (
              <EmptyState
                icon={<ListMusic className="h-6 w-6" />}
                title="Queue unavailable"
                description="The active player did not report a playlist."
              />
            ) : (
              <ol className="space-y-1.5">
                {media.queue.map((item, index) => {
                  const isCurrent = media.media?.title === item.title
                  return (
                    <li
                      key={`${item.title}-${index}`}
                      className={
                        isCurrent
                          ? 'flex items-center gap-3 rounded-2xl border border-accent/30 bg-accent/10 px-3 py-2.5'
                          : 'flex items-center gap-3 rounded-2xl px-3 py-2.5 transition hover:bg-white/5'
                      }
                    >
                      <span className="num w-5 shrink-0 text-[11px] text-slate-500">{index + 1}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-semibold text-slate-100">{item.title}</span>
                        <span className="block truncate text-[11px] text-slate-500">{item.artist}</span>
                      </span>
                      <span className="num shrink-0 text-[11px] text-slate-500">{formatDuration(item.durationSec)}</span>
                    </li>
                  )
                })}
              </ol>
            )}
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader title="How media control works" icon={<Music4 className="h-5 w-5" />} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: 'Transport', detail: 'POST /api/media/play-pause, /previous, /next' },
            { label: 'Volume', detail: 'POST /api/media/volume with { "value": 0-100 }' },
            { label: 'Mute', detail: 'POST /api/media/mute toggles the current state' },
            { label: 'Position', detail: 'POST /api/media/seek with { "positionSec": n }' },
            { label: 'Player', detail: 'POST /api/media/source selects the active player' },
            { label: 'Read state', detail: 'GET /api/media returns the now-playing session' },
          ].map((row) => (
            <div key={row.label} className="glass-soft rounded-2xl px-3 py-2.5">
              <p className="label-xs">{row.label}</p>
              <p className="mt-1 font-mono text-[11px] leading-relaxed text-slate-300">{row.detail}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
