import { Link2, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useConnection } from '@/hooks/useConnection'
import { useSettings } from '@/hooks/useSettings'
import { useRouter } from '@/hooks/useRouter'
import { Logo } from '@/components/ui/Logo'

interface SidebarProps {
  /** Mobile drawer mode: always expanded, rendered inside an overlay. */
  variant?: 'rail' | 'drawer';
}

/** Primary navigation: a rail on tablets/desktop, a drawer on phones. */
export function Sidebar({ variant = 'rail' }: SidebarProps) {
  const { active, navigate, routes } = useRouter()
  const { settings, update } = useSettings()
  const { state, status } = useConnection()
  const collapsed = variant === 'rail' && settings.sidebarCollapsed

  return (
    <aside
      className={cn(
        'glass safe-b flex h-full flex-col border-x-0 border-b-0 border-l-0 border-r border-white/8',
        collapsed ? 'w-[84px]' : 'w-[248px]',
        'transition-[width] duration-300 ease-swipe',
      )}
      aria-label="Primary navigation"
    >
      {/* brand ------------------------------------------------------------ */}
      <div className={cn('flex items-center gap-3 px-4 pt-5', collapsed && 'justify-center px-2')}>
        <span className="h-11 w-11 shrink-0">
          <Logo />
        </span>
        {!collapsed ? (
          <div className="min-w-0">
            <p className="truncate text-[15px] font-bold leading-tight tracking-tight text-slate-50">
              {settings.dashboardName}
            </p>
            <p className="truncate text-[11px] text-slate-500">Your PC. In Your Hands.</p>
          </div>
        ) : null}
      </div>

      {/* nav -------------------------------------------------------------- */}
      <nav className={cn('mt-6 flex-1 space-y-1.5 overflow-y-auto px-3 hide-scrollbar', collapsed && 'px-2')}>
        {routes.map((route) => {
          const Icon = route.icon
          const isActive = route.key === active.key
          return (
            <button
              key={route.key}
              type="button"
              onClick={() => navigate(route.key)}
              aria-current={isActive ? 'page' : undefined}
              title={collapsed ? route.label : undefined}
              className={cn(
                'press group relative flex w-full items-center gap-3 rounded-2xl text-left transition duration-200',
                collapsed ? 'h-14 justify-center' : 'min-h-[52px] px-3.5',
                isActive
                  ? 'border border-accent/35 bg-gradient-to-r from-accent/25 to-accent2/10 text-white shadow-glow-sm'
                  : 'border border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-100',
              )}
            >
              {isActive ? (
                <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-accent" />
              ) : null}
              <Icon className={cn('h-5 w-5 shrink-0', isActive && 'text-accent')} strokeWidth={1.9} aria-hidden="true" />
              {!collapsed ? (
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-semibold">{route.label}</span>
                  <span className="truncate text-[10px] text-slate-500">{route.description}</span>
                </span>
              ) : null}
            </button>
          )
        })}
      </nav>

      {/* collapse toggle -------------------------------------------------- */}
      {variant === 'rail' ? (
        <div className="px-3 pb-1">
          <button
            type="button"
            onClick={() => update('sidebarCollapsed', !settings.sidebarCollapsed)}
            className="press flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 transition hover:bg-white/5 hover:text-slate-200"
            aria-label={settings.sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}
          >
            {settings.sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            {!collapsed ? 'Collapse' : null}
          </button>
        </div>
      ) : null}

      {/* footer / connection --------------------------------------------- */}
      <div className={cn('px-3 pb-5 pt-2', collapsed && 'px-2')}>
        <div
          className={cn(
            'glass-soft flex items-center gap-3 rounded-2xl px-3 py-2.5',
            collapsed && 'justify-center px-0',
          )}
        >
          <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-accent/80 to-accent2/70 text-sm font-bold text-slate-950">
            A
            <span
              className={cn(
                'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[rgb(var(--bg-800))]',
                state === 'online' ? 'bg-emerald-400' : state === 'connecting' ? 'bg-amber-300' : 'bg-rose-400',
              )}
            />
          </span>
          {!collapsed ? (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-200">
                {state === 'online' ? 'Connected' : state === 'connecting' ? 'Connecting…' : 'Disconnected'}
              </p>
              <p className="num truncate text-[11px] text-slate-500">
                {status?.ipAddress ?? (settings.pcAddress || '192.168.1.8')}
              </p>
            </div>
          ) : null}
          {!collapsed ? (
            <Link2 className="h-4 w-4 shrink-0 text-slate-600" aria-hidden="true" />
          ) : null}
        </div>
      </div>
    </aside>
  )
}
