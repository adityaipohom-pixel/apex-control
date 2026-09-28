import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface SectionHeaderProps {
  title: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

/** Section title row used above the dashboard blocks (Quick Apps, ...). */
export function SectionHeader({ title, icon, action, className }: SectionHeaderProps) {
  return (
    <div className={cn('mb-3 flex items-center justify-between gap-3', className)}>
      <h2 className="flex items-center gap-2.5 text-[15px] font-semibold tracking-tight text-slate-100">
        {icon ? <span className="text-accent">{icon}</span> : null}
        {title}
      </h2>
      {action}
    </div>
  )
}
