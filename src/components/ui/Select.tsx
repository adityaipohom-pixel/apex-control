import { ChevronDown } from 'lucide-react'
import { cn } from '@/utils/cn'

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  label?: string
  className?: string;
  id?: string;
  'aria-label'?: string;
}

/** Native select styled as a glass dropdown (best touch behaviour on tablets). */
export function Select({ value, onChange, options, label, className, id, 'aria-label': ariaLabel }: SelectProps) {
  return (
    <div className={cn('relative', className)}>
      {label ? <span className="label-xs mb-1.5 block">{label}</span> : null}
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label={ariaLabel}
          className={cn(
            'glass-soft h-12 w-full appearance-none rounded-2xl pl-3.5 pr-10 text-sm font-medium text-slate-100',
            'transition hover:border-white/20 focus:border-accent/50',
          )}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-slate-900 text-slate-100">
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
      </div>
    </div>
  )
}
