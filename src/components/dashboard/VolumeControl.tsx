import { Minus, Plus, Volume1, Volume2, VolumeX } from 'lucide-react'
import { cn } from '@/utils/cn'
import { clamp } from '@/utils/format'
import type { MediaController } from '@/hooks/useMedia'
import { Card, CardHeader } from '@/components/ui/Card'
import { IconButton } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

const PRESETS = [0, 25, 50, 75, 100]

export interface VolumeControlProps {
  controller: MediaController;
  className?: string;
}

/** Master volume: big slider + mute / down / up touch controls. */
export function VolumeControl({ controller, className }: VolumeControlProps) {
  const { volume, media, pending } = controller
  const muted = media?.muted ?? false
  const display = muted ? 0 : volume
  const VolumeIcon = muted || display === 0 ? VolumeX : display < 50 ? Volume1 : Volume2

  const step = (delta: number) => controller.commitVolume(clamp((muted ? 0 : volume) + delta, 0, 100))

  return (
    <Card className={className}>
      <CardHeader
        title="Volume Control"
        icon={<Volume2 className="h-5 w-5" />}
        subtitle={muted ? 'Muted' : `${display}% master output`}
        action={<Badge tone={muted ? 'warning' : 'accent'}>{muted ? 'MUTED' : `${display}%`}</Badge>}
      />

      <div className="flex items-center gap-4">
        <div className="flex w-16 shrink-0 flex-col items-center gap-1">
          <span className="num text-2xl font-semibold leading-none text-slate-50">{display}</span>
          <span className="label-xs !tracking-[0.2em]">%</span>
        </div>

        <div className="min-w-0 flex-1">
          <input
            type="range"
            min={0}
            max={100}
            value={display}
            onChange={(event) => controller.setVolume(Number(event.target.value))}
            onPointerUp={(event) => controller.commitVolume(Number((event.target as HTMLInputElement).value))}
            onKeyUp={(event) => controller.commitVolume(Number((event.target as HTMLInputElement).value))}
            className="range"
            style={{ ['--range-progress' as string]: `${display}%` }}
            aria-label="Master volume"
            disabled={pending}
          />
          <div className="mt-1 flex justify-between px-1">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => controller.commitVolume(preset)}
                disabled={pending}
                className={cn(
                  'press flex min-h-[44px] items-center justify-center rounded-lg px-2 text-[10px] font-semibold text-slate-500 transition hover:bg-white/5 hover:text-slate-200 disabled:opacity-40',
                  display === preset && 'text-accent',
                )}
                aria-label={`Set volume to ${preset}%`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2.5">
        <IconButton
          label={muted ? 'Unmute' : 'Mute'}
          size="lg"
          tone={muted ? 'accent' : 'default'}
          onClick={controller.toggleMute}
          icon={muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          className="w-full"
        />
        <IconButton
          label="Volume down"
          size="lg"
          onClick={() => step(-5)}
          icon={<Minus className="h-5 w-5" />}
          className="w-full"
        />
        <IconButton
          label="Volume up"
          size="lg"
          onClick={() => step(5)}
          icon={<Plus className="h-5 w-5" />}
          className="w-full"
        />
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
        <VolumeIcon className="h-3.5 w-3.5" />
        Sends POST /api/media/volume with the new level
      </p>
    </Card>
  )
}
