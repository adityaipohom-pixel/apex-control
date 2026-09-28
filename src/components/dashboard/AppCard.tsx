import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { AppDefinition } from '@/types/api'
import { useHaptics } from '@/hooks/useHaptics'
import { AppIcon } from '@/components/ui/AppIcon'

interface AppCardProps {
  app: AppDefinition;
  launching?: boolean;
  onLaunch: (id: string) => void;
  /** Compact variant used by the Recent Apps strip. */
  compact?: boolean;
  className?: string;
}

/**
 * Quick-app tile. Clicking only sends the app *id* to the backend - the
 * Windows executable is resolved server-side.
 */
export function AppCard({ app, launching = false, onLaunch, compact = false, className }: AppCardProps) {
  const tap = useHaptics()

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => {
          tap()
          onLaunch(app.id)
        }}
        disabled={launching}
        className="press group flex flex-col items-center gap-2"
        title={`${app.name} — ${app.description}`}
      >
        <span
          className="relative grid h-14 w-14 place-items-center rounded-2xl border border-white/10 transition duration-200 group-hover:-translate-y-0.5 group-hover:border-white/25"
          style={{ backgroundColor: `${app.tint}22` }}
        >
          <AppIcon name={app.icon} className="h-6 w-6" />
          {launching ? (
            <span className="absolute inset-0 grid place-items-center rounded-2xl bg-black/50">
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            </span>
          ) : null}
        </span>
        <span className="max-w-[68px] truncate text-[11px] font-medium text-slate-400">{app.name}</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => {
        tap()
        onLaunch(app.id)
      }}
      disabled={launching}
      aria-label={`Launch ${app.name}. ${app.description}`}
      className={cn(
        'press glass-soft group relative flex min-h-[124px] flex-col items-center justify-center gap-2.5 rounded-3xl px-3 py-4 text-center',
        'hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.07] hover:shadow-[0_18px_36px_-22px_rgb(0_0_0/0.95)]',
        'disabled:pointer-events-none',
        className,
      )}
    >
      <span
        className="relative grid h-14 w-14 place-items-center rounded-2xl border border-white/10 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.12)] transition duration-300 group-hover:scale-105"
        style={{ backgroundColor: `${app.tint}26`, boxShadow: `0 10px 24px -14px ${app.tint}` }}
      >
        <AppIcon name={app.icon} className="h-7 w-7" />
        {launching ? (
          <span className="absolute inset-0 grid place-items-center rounded-2xl bg-black/55 backdrop-blur-sm">
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          </span>
        ) : null}
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="text-[13px] font-semibold leading-tight text-slate-100">{app.name}</span>
        <span className="text-[11px] leading-tight text-slate-500">{app.description}</span>
      </span>
    </button>
  )
}
