import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface CardProps {
  children: ReactNode
  className?: string
  /** Adds a subtle accent sheen on the top edge. */
  glow?: boolean
  as?: 'div' | 'section' | 'article' | 'aside'
}

/** The base glass surface used by every panel in the dashboard. */
export function Card({ children, className, glow = false, as: Tag = 'div' }: CardProps) {
  return (
    <Tag
      className={cn(
        'glass relative overflow-hidden rounded-3xl p-4 transition duration-300 ease-swipe sm:p-5',
        glow && 'before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-accent/70 before:to-transparent',
        className,
      )}
    >
      {children}
    </Tag>
  )
}

interface CardHeaderProps {
  title: ReactNode
  subtitle?: ReactNode
  icon?: ReactNode
  action?: ReactNode
  className?: string
}

/** Consistent panel header: icon + title + optional subtitle/action. */
export function CardHeader({ title, subtitle, icon, action, className }: CardHeaderProps) {
  return (
    <div className={cn('mb-4 flex items-start justify-between gap-3', className)}>
      <div className="flex min-w-0 items-center gap-3">
        {icon ? (
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-accent/25 bg-accent/10 text-accent">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          <h2 className="truncate text-[15px] font-semibold text-slate-100">{title}</h2>
          {subtitle ? <p className="mt-0.5 truncate text-xs text-slate-400">{subtitle}</p> : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}
