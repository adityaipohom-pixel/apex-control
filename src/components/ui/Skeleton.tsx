import { cn } from '@/utils/cn'

/** Shimmering placeholder used while the first poll is in flight. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} aria-hidden="true" />
}
