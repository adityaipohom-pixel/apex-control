import { Menu, Maximize, Minimize, Moon, Wifi, WifiOff } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useClock } from '@/hooks/useClock'
import { useConnection } from '@/hooks/useConnection'
import { useSettings } from '@/hooks/useSettings'
import { useRouter } from '@/hooks/useRouter'
import { formatClock, formatDateLong } from '@/utils/format'
import { ConnectionPill } from '@/components/ui/ConnectionPill'
import { Logo } from '@/components/ui/Logo'

interface TopBarProps {
  onOpenNav: () => void;
}

/** Dashboard header: brand, connection state, Wi-Fi, quick toggles, clock. */
export function TopBar({ onOpenNav }: TopBarProps) {
  const now = useClock()
  const { state, status } = useConnection()
  const { settings, update, isFullscreen, toggleFullscreen } = useSettings()
  const { navigate } = useRouter()

  const wifiConnected = state === 'online' && (status?.wifi.connected ?? false)
  const signal = status?.wifi.signal ?? 0

  return (
    <header className="glass sticky top-0 z-40 flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-white/8 px-3 py-2.5 safe-t lg:px-5">
      <button
        type="button"
        onClick={onOpenNav}
        className="press glass-soft grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-slate-300 hover:text-white lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex min-w-0 items-center gap-3">
        <span className="h-10 w-10 shrink-0 lg:hidden">
          <Logo />
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-base font-bold leading-tight tracking-tight text-slate-50 lg:text-lg">
            {settings.dashboardName}
          </h1>
          <p className="hidden truncate text-[11px] text-slate-500 sm:block">Your PC. In Your Hands.</p>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <ConnectionPill state={state} hostname={status?.hostname ?? 'APEX'} className="hidden sm:inline-flex" />
        <ConnectionPill state={state} hostname={status?.hostname ?? 'APEX'} compact className="sm:hidden" />

        <button
          type="button"
          onClick={() => navigate('settings')}
          className={cn(
            'press glass-soft relative grid h-12 w-12 place-items-center rounded-2xl transition',
            wifiConnected ? 'text-emerald-300' : 'text-slate-500',
          )}
          aria-label={`Wi-Fi ${wifiConnected ? `connected to ${status?.wifi.ssid} at ${signal}%` : 'disconnected'}`}
          title={wifiConnected ? `${status?.wifi.ssid} · ${signal}% · ${status?.wifi.band}` : 'Wi-Fi disconnected'}
        >
          {wifiConnected ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
          {wifiConnected ? (
            <span className="absolute bottom-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />
          ) : null}
        </button>

        <button
          type="button"
          onClick={() => update('theme', settings.theme === 'obsidian' ? 'navy' : settings.theme === 'navy' ? 'midnight' : 'obsidian')}
          className="press glass-soft grid h-12 w-12 place-items-center rounded-2xl text-slate-300 transition hover:text-white"
          aria-label="Switch interface theme"
          title="Switch interface theme"
        >
          <Moon className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={toggleFullscreen}
          className="press glass-soft hidden h-12 w-12 place-items-center rounded-2xl text-slate-300 transition hover:text-white sm:grid"
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
        </button>

        <div className="ml-1 hidden flex-col items-end md:flex">
          <span className="num text-lg font-semibold leading-none tracking-tight text-slate-50">
            {formatClock(now)}
          </span>
          <span className="mt-1 text-[11px] text-slate-500">{formatDateLong(now)}</span>
        </div>
      </div>
    </header>
  )
}
