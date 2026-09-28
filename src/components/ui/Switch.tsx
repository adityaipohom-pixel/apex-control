import { cn } from '@/utils/cn'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
  disabled?: boolean
}

/** Toggle switch with a 44px+ touch target. */
export function Switch({ checked, onChange, label, description, disabled = false }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'press group flex w-full items-center justify-between gap-4 rounded-2xl px-3 py-2.5 text-left transition',
        'hover:bg-white/5 disabled:pointer-events-none disabled:opacity-50',
      )}
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium text-slate-200">{label}</span>
        {description ? <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">{description}</span> : null}
      </span>
      <span
        className={cn(
          'relative h-7 w-12 shrink-0 rounded-full border transition duration-300',
          checked ? 'border-accent/60 bg-accent/70' : 'border-white/15 bg-white/10',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition duration-300 ease-swipe',
            checked ? 'left-[26px]' : 'left-0.5',
          )}
        />
      </span>
    </button>
  )
}
