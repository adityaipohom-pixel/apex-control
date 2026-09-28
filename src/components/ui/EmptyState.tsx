import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 px-6 py-10 text-center', className)}>
      <span className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/5 text-slate-400">
        {icon}
      </span>
      <div>
        <p className="text-sm font-semibold text-slate-200">{title}</p>
        {description ? <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-slate-500">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}
