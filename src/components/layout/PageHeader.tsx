import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

/** Consistent page title block. */
export function PageHeader({ title, description, icon, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('mb-4 flex flex-wrap items-end justify-between gap-3', className)}>
      <div className="flex min-w-0 items-center gap-3">
        {icon ? (
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-accent/25 bg-accent/10 text-accent">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold tracking-tight text-slate-50 sm:text-2xl">{title}</h1>
          {description ? <p className="mt-0.5 text-[13px] text-slate-400">{description}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}
