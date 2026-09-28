import { cn } from '@/utils/cn'
import { useRouter } from '@/hooks/useRouter'

/** Bottom navigation bar for phones / narrow tablets (portrait). */
export function BottomNav() {
  const { active, navigate, routes } = useRouter()

  return (
    <nav
      className="glass safe-b fixed inset-x-0 bottom-0 z-50 flex items-stretch justify-around gap-0.5 border-t border-white/10 px-1.5 pt-1.5 lg:hidden"
      aria-label="Primary navigation"
    >
      {routes.map((route) => {
        const Icon = route.icon
        const isActive = route.key === active.key
        return (
          <button
            key={route.key}
            type="button"
            onClick={() => navigate(route.key)}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'press relative flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5 transition',
              isActive ? 'text-accent' : 'text-slate-500',
            )}
          >
            {isActive ? (
              <span className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-accent shadow-[0_0_12px_2px_rgb(var(--accent-rgb)/0.5)]" />
            ) : null}
            <Icon className="h-5 w-5" strokeWidth={isActive ? 2.2 : 1.8} aria-hidden="true" />
            <span className="text-[10px] font-semibold tracking-tight">{route.short}</span>
          </button>
        )
      })}
    </nav>
  )
}
