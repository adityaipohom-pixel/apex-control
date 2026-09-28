import { cn } from '@/utils/cn'

interface ProgressBarProps {
  value: number
  max?: number
  className?: string;
  barClassName?: string;
  label?: string;
}

/** Thin animated bar used for disk / network / media progress. */
export function ProgressBar({ value, max = 100, className, barClassName, label }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div
      className={cn('h-2 w-full overflow-hidden rounded-full bg-white/8', className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={cn('h-full rounded-full bg-gradient-to-r from-accent/70 to-accent transition-[width] duration-700 ease-swipe', barClassName)}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
