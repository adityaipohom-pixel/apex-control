import { useMemo } from 'react'
import {
  ListMusic,
  Pause,
  Play,
  Repeat,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { formatDuration } from '@/utils/format'
import type { MediaController } from '@/hooks/useMedia'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { Select } from '@/components/ui/Select'
import { IconButton } from '@/components/ui/Button'

const PLAYERS = [
  { value: 'spotify', label: 'Spotify' },
  { value: 'chrome', label: 'Chrome' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'vlc', label: 'VLC' },
  { value: 'groove', label: 'Groove' },
  { value: 'system', label: 'System audio' },
]

/** Deterministic hue from the track title -> abstract generated artwork. */
function artworkGradient(title: string): string {
  let hash = 0
  for (let index = 0; index < title.length; index += 1) hash = (hash * 31 + title.charCodeAt(index)) % 360
  const hue = hash
  const hue2 = (hue + 48) % 360
  return `linear-gradient(140deg, hsl(${hue} 70% 42%), hsl(${hue2} 72% 22%) 62%, rgb(8 11 19))`
}

export interface MediaControlProps {
  controller: MediaController;
  className?: string;
  /** Larger layout used by the dedicated Media page. */
  expanded?: boolean;
}

/** Now-playing card + transport controls. Consumes GET /api/media. */
export function MediaControl({ controller, className, expanded = false }: MediaControlProps) {
  const { media, volume, loading, pending, error } = controller

  const artwork = useMemo(() => artworkGradient(media?.title ?? 'APEX'), [media?.title])
  const progress = media && media.durationSec > 0 ? (media.positionSec / media.durationSec) * 100 : 0

  if (loading && !media) {
    return (
      <Card className={className}>
        <CardHeader title="Media Control" icon={<ListMusic className="h-5 w-5" />} subtitle="Connecting to player…" />
        <div className="flex gap-4">
          <Skeleton className="h-24 w-24 shrink-0 rounded-2xl" />
          <div className="flex-1 space-y-2 py-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-2 w-full" />
          </div>
        </div>
        <Skeleton className="mt-5 h-14 w-full rounded-2xl" />
      </Card>
    )
  }

  if (!media) {
    return (
      <Card className={className}>
        <CardHeader title="Media Control" icon={<ListMusic className="h-5 w-5" />} subtitle="No active session" />
        <p className="text-sm leading-relaxed text-slate-500">
          {error ?? 'No media session was reported by the PC. Start a player on APEX and it will appear here.'}
        </p>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader
        title="Media Control"
        icon={<ListMusic className="h-5 w-5" />}
        subtitle={media.isPlaying ? 'Now playing' : 'Paused'}
        action={
          <Select
            value={media.source}
            onChange={(value) => controller.setSource(value)}
            options={PLAYERS}
            className="w-[128px]"
            aria-label="Active player"
          />
        }
      />

      <div className="flex items-center gap-4">
        <div
          className={cn(
            'relative shrink-0 overflow-hidden rounded-2xl border border-white/10',
            expanded ? 'h-32 w-32 sm:h-40 sm:w-40' : 'h-20 w-20',
          )}
          style={{ background: artwork }}
          aria-hidden="true"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgb(255_255_255/0.22),transparent_55%)]" />
          <div className="absolute inset-0 grid place-items-center">
            <ListMusic className="h-6 w-6 text-white/70" />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold text-slate-50">{media.title}</p>
              <p className="truncate text-[13px] text-slate-400">{media.artist}</p>
              {media.album && expanded ? <p className="truncate text-[11px] text-slate-500">{media.album}</p> : null}
            </div>
            <Badge tone={media.isPlaying ? 'success' : 'neutral'}>{media.isPlaying ? 'Playing' : 'Paused'}</Badge>
          </div>

          {/* seek ---------------------------------------------------------- */}
          <div className="mt-3">
            <input
              type="range"
              min={0}
              max={Math.max(1, media.durationSec)}
              value={Math.min(media.positionSec, media.durationSec)}
              onChange={(event) => controller.seek(Number(event.target.value))}
              className="range !h-8"
              style={{ ['--range-progress' as string]: `${progress}%` }}
              aria-label="Playback position"
            />
            <div className="num flex justify-between text-[11px] text-slate-500">
              <span>{formatDuration(media.positionSec)}</span>
              <span>{formatDuration(media.durationSec)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* volume + transport ------------------------------------------------ */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <IconButton
          label={media.muted ? 'Unmute' : 'Mute'}
          size="sm"
          tone={media.muted ? 'accent' : 'default'}
          onClick={controller.toggleMute}
          icon={media.muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        />
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={(event) => controller.setVolume(Number(event.target.value))}
          onPointerUp={(event) => controller.commitVolume(Number((event.target as HTMLInputElement).value))}
          onKeyUp={(event) => controller.commitVolume(Number((event.target as HTMLInputElement).value))}
          className="range !h-9 min-w-[120px] flex-1"
          style={{ ['--range-progress' as string]: `${volume}%` }}
          aria-label="Media volume"
        />
        <span className="num w-10 text-right text-[13px] font-semibold text-slate-300">{volume}%</span>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2.5">
        <IconButton label="Shuffle" size="sm" className="!h-11 !w-11" icon={<Shuffle className="h-4 w-4" />} />
        <IconButton
          label="Previous track"
          size="md"
          className="!h-11 !w-11 sm:!h-12 sm:!w-12"
          disabled={pending}
          onClick={controller.previous}
          icon={<SkipBack className="h-5 w-5" />}
        />
        <button
          type="button"
          onClick={controller.togglePlayPause}
          disabled={pending}
          aria-label={media.isPlaying ? 'Pause' : 'Play'}
          className="press grid h-14 w-14 place-items-center rounded-full border border-accent/40 bg-gradient-to-b from-accent/90 to-accent2/70 text-slate-950 shadow-glow disabled:opacity-50 sm:h-16 sm:w-16"
        >
          {media.isPlaying ? <Pause className="h-6 w-6 sm:h-7 sm:w-7" /> : <Play className="h-6 w-6 translate-x-0.5 sm:h-7 sm:w-7" />}
        </button>
        <IconButton
          label="Next track"
          size="md"
          className="!h-11 !w-11 sm:!h-12 sm:!w-12"
          disabled={pending}
          onClick={controller.next}
          icon={<SkipForward className="h-5 w-5" />}
        />
        <IconButton label="Repeat" size="sm" className="!h-11 !w-11" icon={<Repeat className="h-4 w-4" />} />
      </div>

      {error ? <p className="mt-3 text-center text-[11px] text-rose-300">{error}</p> : null}
    </Card>
  )
}
