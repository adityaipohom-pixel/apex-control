import { useId } from 'react'
import { cn } from '@/utils/cn'

interface SparklineProps {
  values: number[]
  width?: number
  height?: number
  className?: string;
  /** Upper bound of the scale - defaults to the max sample. */
  max?: number;
  label?: string;
}

/** Dependency-free mini chart for the network / cpu history. */
export function Sparkline({ values, width = 220, height = 44, className, max, label }: SparklineProps) {
  const gradientId = useId()
  const points = values.slice(-30)

  if (points.length < 2) {
    return <div className={cn('skeleton h-[44px] w-full rounded-xl', className)} aria-hidden="true" />
  }

  const peak = Math.max(max ?? 0, ...points) || 1
  const step = width / (points.length - 1)
  const coords = points.map((value, index) => {
    const x = index * step
    const y = height - (value / peak) * (height - 4) - 2
    return [x, y] as const
  })
  const line = coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `0,${height} ${line} ${width},${height}`

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn('h-[44px] w-full', className)}
      role="img"
      aria-label={label ?? 'Trend chart'}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(var(--accent-rgb))" stopOpacity="0.35" />
          <stop offset="100%" stopColor="rgb(var(--accent-rgb))" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gradientId})`} />
      <polyline
        points={line}
        fill="none"
        stroke="rgb(var(--accent-rgb))"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
