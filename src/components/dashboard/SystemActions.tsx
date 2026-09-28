import { useState } from 'react'
import { Lock, Moon, Power, RotateCw, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { SystemActionKey } from '@/hooks/useSystemActions'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { ConfirmDialog } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'

interface ActionDef {
  key: SystemActionKey
  label: string
  hint: string;
  icon: typeof Lock;
  className: string;
  confirm?: boolean;
}

const ACTIONS: ActionDef[] = [
  {
    key: 'lock',
    label: 'Lock PC',
    hint: 'Lock the session',
    icon: Lock,
    className: 'from-sky-500/85 to-blue-600/70 border-sky-300/30',
  },
  {
    key: 'sleep',
    label: 'Sleep',
    hint: 'Suspend to RAM',
    icon: Moon,
    className: 'from-violet-500/85 to-indigo-600/70 border-violet-300/30',
  },
  {
    key: 'restart',
    label: 'Restart',
    hint: 'Reboot APEX',
    icon: RotateCw,
    className: 'from-amber-500/90 to-orange-600/75 border-amber-300/30',
    confirm: true,
  },
  {
    key: 'shutdown',
    label: 'Shutdown',
    hint: 'Power off APEX',
    icon: Power,
    className: 'from-rose-500/90 to-red-600/75 border-rose-300/30',
    confirm: true,
  },
]

const CONFIRM_COPY: Record<string, { title: string; message: string; cta: string }> = {
  restart: {
    title: 'Restart APEX?',
    message: 'The PC will close every open app and reboot. Unsaved work will be lost.',
    cta: 'Restart now',
  },
  shutdown: {
    title: 'Shut down APEX?',
    message: 'The PC will power off completely. You will lose the connection until it is turned back on.',
    cta: 'Shut down',
  },
  displayOff: {
    title: 'Turn off the display?',
    message: 'The monitors will go to sleep. APEX keeps running.',
    cta: 'Turn off',
  },
}

export interface SystemActionsProps {
  pending: SystemActionKey | null;
  onAction: (key: SystemActionKey) => void;
  confirmDestructive?: boolean;
  loading?: boolean;
  className?: string;
}

/** Large power-state buttons with confirmation dialogs. */
export function SystemActions({
  pending,
  onAction,
  confirmDestructive = true,
  loading = false,
  className,
}: SystemActionsProps) {
  const [confirming, setConfirming] = useState<ActionDef | null>(null)
  const copy = confirming ? CONFIRM_COPY[confirming.key] : undefined

  const handleClick = (action: ActionDef) => {
    if (action.confirm && confirmDestructive) {
      setConfirming(action)
      return
    }
    onAction(action.key)
  }

  return (
    <section className={className} aria-label="System actions">
      <SectionHeader title="System Actions" icon={<SlidersHorizontal className="h-4 w-4" />} />

      {loading ? (
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
          {ACTIONS.map((action) => (
            <Skeleton key={action.key} className="h-28 w-full rounded-3xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
          {ACTIONS.map((action) => {
            const Icon = action.icon
            const isPending = pending === action.key
            return (
              <button
                key={action.key}
                type="button"
                onClick={() => handleClick(action)}
                disabled={pending !== null}
                aria-label={`${action.label}. ${action.hint}`}
                className={cn(
                  'press group relative flex min-h-[112px] flex-col items-center justify-center gap-2.5 rounded-3xl border bg-gradient-to-b px-3 py-4 text-white',
                  'shadow-[0_18px_38px_-24px_rgb(0_0_0/0.95)] transition duration-200',
                  'hover:-translate-y-1 hover:brightness-110 disabled:pointer-events-none disabled:opacity-50',
                  action.className,
                )}
              >
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-black/25 backdrop-blur-sm transition duration-300 group-hover:scale-110">
                  {isPending ? (
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                  ) : (
                    <Icon className="h-6 w-6" strokeWidth={1.9} />
                  )}
                </span>
                <span className="flex flex-col items-center gap-0.5">
                  <span className="text-[13px] font-semibold leading-tight">{action.label}</span>
                  <span className="text-[10px] font-medium leading-tight text-white/70">{action.hint}</span>
                </span>
              </button>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        open={confirming !== null}
        title={copy?.title ?? 'Are you sure?'}
        message={copy?.message ?? 'This action affects the PC immediately.'}
        confirmLabel={copy?.cta ?? 'Confirm'}
        tone={confirming?.key === 'shutdown' ? 'danger' : 'warn'}
        loading={pending !== null}
        onCancel={() => setConfirming(null)}
        onConfirm={() => {
          if (confirming) onAction(confirming.key)
          setConfirming(null)
        }}
      />
    </section>
  )
}
