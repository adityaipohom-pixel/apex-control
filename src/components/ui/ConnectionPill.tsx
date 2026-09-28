import { Loader2, WifiOff } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { ConnectionState } from '@/types/api'

interface ConnectionPillProps {
  state: ConnectionState;
  hostname?: string;
  compact?: boolean;
  className?: string;
}

const COPY: Record<ConnectionState, { title: string; sub: string }> = {
  connecting: { title: 'CONNECTING', sub: 'Reaching APEX…' },
  online: { title: 'PC ONLINE', sub: 'Connected to APEX' },
  offline: { title: 'PC OFFLINE', sub: 'Trying to reconnect…' },
}

const TONE = {
  connecting: 'border-amber-300/25 bg-amber-300/10 text-amber-200',
  online: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200',
  offline: 'border-rose-400/25 bg-rose-400/10 text-rose-200',
} as const

const DOT = {
  connecting: 'bg-amber-300',
  online: 'bg-emerald-400',
  offline: 'bg-rose-400',
} as const

/** The live connection indicator shown in the header. */
export function ConnectionPill({ state, hostname = 'APEX', compact = false, className }: ConnectionPillProps) {
  const copy = COPY[state]
  const isOnline = state === 'online'

  return (
    <div
      className={cn(
        'glass-soft inline-flex items-center gap-2.5 rounded-full border px-3 py-2 transition-colors duration-500',
        TONE[state],
        compact ? 'min-h-[44px]' : 'min-h-[48px]',
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={`${copy.title}. ${copy.sub}`}
      data-connection-state={state}
    >
      <span className="relative grid h-4 w-4 place-items-center">
        <span className={cn('absolute inset-0 rounded-full opacity-60', DOT[state], isOnline && 'animate-pulse-ring')} />
        <span className={cn('h-2.5 w-2.5 rounded-full', DOT[state], isOnline && 'shadow-[0_0_12px_2px_rgb(52_211_153/0.55)]')} />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-[11px] font-bold tracking-[0.16em]">{copy.title}</span>
        {!compact ? (
          <span className="text-[11px] font-medium text-slate-400">
            {isOnline ? copy.sub.replace('APEX', hostname) : copy.sub}
          </span>
        ) : null}
      </span>
      {state === 'connecting' ? <Loader2 className="h-3.5 w-3.5 animate-spin opacity-70" aria-hidden="true" /> : null}
      {state === 'offline' ? <WifiOff className="h-3.5 w-3.5 opacity-70" aria-hidden="true" /> : null}
    </div>
  )
}
