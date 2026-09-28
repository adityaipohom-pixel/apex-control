import { useId } from 'react'
import { cn } from '@/utils/cn'

interface UsageRingProps {
  value: number
  label: string
  /** Text rendered under the ring, e.g. "CPU". */
  caption?: string
  /** Maximum diameter in px - the ring shrinks to fit narrow columns. */
  size?: number
  /** Two gradient stops - defaults to the accent palette. */
  from?: string
  to?: string;
  className?: string;
}

/** Circular usage gauge with a gradient stroke, matching the reference rings. */
export function UsageRing({
  value,
  label,
  caption,
  size = 96,
  from = 'rgb(var(--accent-rgb))',
  to = 'rgb(var(--accent2-rgb))',
  className,
}: UsageRingProps) {
  const gradientId = useId()
  const stroke = 9
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const pct = Math.max(0, Math.min(100, value))
  const offset = circumference - (pct / 100) * circumference

  return (
    <div className={cn('flex w-full flex-col items-center gap-2', className)} style={{ maxWidth: size }}>
      <div className="relative w-full" style={{ aspectRatio: '1 / 1' }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="h-auto w-full -rotate-90" role="presentation">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={from} />
              <stop offset="100%" stopColor={to} />
            </linearGradient>
          </defs>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgb(255 255 255 / 0.08)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-700 ease-swipe"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="num text-base font-semibold text-slate-50 sm:text-xl">{Math.round(pct)}%</span>
          <span className="label-xs mt-0.5 !tracking-[0.2em] !text-[9px] text-slate-400">{label}</span>
        </div>
      </div>
      {caption ? <span className="label-xs text-slate-500">{caption}</span> : null}
    </div>
  )
}
