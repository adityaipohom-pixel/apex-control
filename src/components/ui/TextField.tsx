import { useId, type ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  icon?: ReactNode;
  inputMode?: 'text' | 'numeric' | 'url' | 'decimal';
  maxLength?: number;
  className?: string;
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  icon,
  inputMode = 'text',
  maxLength,
  className,
}: TextFieldProps) {
  const id = useId()
  return (
    <div className={cn('w-full', className)}>
      <label htmlFor={id} className="label-xs mb-1.5 block">
        {label}
      </label>
      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">{icon}</span>
        ) : null}
        <input
          id={id}
          type="text"
          inputMode={inputMode}
          value={value}
          placeholder={placeholder}
          maxLength={maxLength}
          onChange={(event) => onChange(event.target.value)}
          className={cn(
            'glass-soft h-12 w-full rounded-2xl text-sm font-medium text-slate-100 placeholder:text-slate-600',
            'transition hover:border-white/20 focus:border-accent/50',
            icon ? 'pl-11 pr-3.5' : 'px-3.5',
          )}
        />
      </div>
      {hint ? <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">{hint}</p> : null}
    </div>
  )
}
