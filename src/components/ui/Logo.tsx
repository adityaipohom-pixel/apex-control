import { cn } from '@/utils/cn'

interface LogoProps {
  className?: string;
}

/**
 * APEX CONTROL mark - an abstract "A" cut from a chevron, drawn with the
 * active accent gradient. Drawn from scratch (no third-party artwork).
 */
export function Logo({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={cn('h-full w-full', className)}
      role="img"
      aria-label="APEX CONTROL logo"
    >
      <defs>
        <linearGradient id="apex-logo-gradient" x1="10%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" stopColor="rgb(var(--accent-rgb))" />
          <stop offset="55%" stopColor="rgb(var(--accent2-rgb))" />
          <stop offset="100%" stopColor="rgb(var(--accent-rgb))" />
        </linearGradient>
      </defs>
      <rect x="1.5" y="1.5" width="45" height="45" rx="13" fill="rgb(255 255 255 / 0.06)" />
      <rect x="1.5" y="1.5" width="45" height="45" rx="13" fill="none" stroke="rgb(255 255 255 / 0.12)" />
      <path
        d="M24 11.5 36.5 36h-6.4l-2.6-5.2h-7l-2.6 5.2H11.5L24 11.5Zm0 9.6-2.2 4.6h4.4L24 21.1Z"
        fill="url(#apex-logo-gradient)"
      />
      <circle cx="24" cy="24" r="20" fill="none" stroke="rgb(var(--accent-rgb) / 0.18)" strokeWidth="1" />
    </svg>
  )
}
