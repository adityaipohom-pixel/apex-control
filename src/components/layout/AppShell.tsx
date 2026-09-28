import { useEffect, useState, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useConnection } from '@/hooks/useConnection'
import { useRouter } from '@/hooks/useRouter'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { BottomNav } from './BottomNav'

interface AppShellProps {
  children: ReactNode;
}

/** App chrome: navigation rail, header, page container, offline banner. */
export function AppShell({ children }: AppShellProps) {
  const { active } = useRouter()
  const { state, error, attempts, refresh } = useConnection()
  const [drawerOpen, setDrawerOpen] = useState(false)

  /* close the mobile drawer whenever the route changes */
  useEffect(() => setDrawerOpen(false), [active.key])

  useEffect(() => {
    if (!drawerOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawerOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [drawerOpen])

  const offline = state === 'offline'

  return (
    <div className="relative z-10 flex h-full min-h-0">
      {/* navigation rail (tablet landscape / desktop) */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* mobile drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm animate-fade-in"
          />
          <div className="relative z-10 h-full animate-slide-in-right">
            <Sidebar variant="drawer" />
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close navigation"
            className="absolute right-4 top-4 z-20 grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-black/40 text-slate-300 backdrop-blur"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onOpenNav={() => setDrawerOpen(true)} />

        {offline ? (
          <div
            className="flex flex-wrap items-center gap-3 border-b border-rose-400/20 bg-rose-500/10 px-4 py-2.5 text-rose-100"
            role="alert"
          >
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <p className="min-w-0 flex-1 text-xs leading-relaxed">
              <span className="font-semibold">PC OFFLINE — trying to reconnect…</span>{' '}
              <span className="text-rose-200/70">
                {error ?? 'No response from the APEX control server.'}
                {attempts > 1 ? ` (${attempts} attempts)` : ''}
              </span>
            </p>
            <button
              type="button"
              onClick={() => void refresh()}
              className="press inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-rose-300/30 bg-rose-500/15 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-rose-50 transition hover:bg-rose-500/25"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>
          </div>
        ) : null}

        <main
          className={cn(
            'scroll-touch min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 pb-28 pt-4 lg:px-5 lg:pb-6 lg:pt-5',
          )}
        >
          <div key={active.key} className="animate-fade-up">
            {children}
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  )
}
