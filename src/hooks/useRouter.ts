/**
 * Minimal hash router.
 *
 * Hash routing is deliberate: the dashboard is served by a plain Flask static
 * folder on the PC, so deep links must work without any server-side rewrite
 * rules, and it behaves identically in `vite dev` and in production.
 */

import { useCallback, useEffect, useState } from 'react'
import {
  AppWindow,
  FolderOpen,
  House,
  Music4,
  Settings2,
  SlidersHorizontal,
  MonitorCog,
  type LucideIcon,
} from 'lucide-react'

export type RouteKey = 'home' | 'apps' | 'media' | 'system' | 'files' | 'tools' | 'settings'

export interface RouteDef {
  key: RouteKey
  path: string
  label: string
  short: string
  description: string
  icon: LucideIcon
}

export const ROUTES: RouteDef[] = [
  { key: 'home', path: '/', label: 'Home', short: 'Home', description: 'Dashboard overview', icon: House },
  { key: 'apps', path: '/apps', label: 'Apps', short: 'Apps', description: 'Launch & manage shortcuts', icon: AppWindow },
  { key: 'media', path: '/media', label: 'Media', short: 'Media', description: 'Playback & players', icon: Music4 },
  { key: 'system', path: '/system', label: 'System', short: 'System', description: 'Performance & power', icon: MonitorCog },
  { key: 'files', path: '/files', label: 'Files', short: 'Files', description: 'Browse the PC', icon: FolderOpen },
  { key: 'tools', path: '/tools', label: 'Tools', short: 'Tools', description: 'Handy actions', icon: SlidersHorizontal },
  { key: 'settings', path: '/settings', label: 'Settings', short: 'Config', description: 'Dashboard preferences', icon: Settings2 },
]

function parseHash(): RouteKey {
  const raw = window.location.hash.replace(/^#/, '') || '/'
  const normalized = raw.startsWith('/') ? raw : `/${raw}`
  const found = ROUTES.find((route) => route.path === normalized)
  return found?.key ?? 'home'
}

export function useRouter() {
  const [route, setRoute] = useState<RouteKey>(() => (typeof window === 'undefined' ? 'home' : parseHash()))

  useEffect(() => {
    const onChange = () => setRoute(parseHash())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  const navigate = useCallback((key: RouteKey) => {
    const target = ROUTES.find((route) => route.key === key)?.path ?? '/'
    if (window.location.hash.replace(/^#/, '') === target) {
      setRoute(key)
      return
    }
    window.location.hash = target
  }, [])

  const active = ROUTES.find((entry) => entry.key === route) ?? ROUTES[0]

  return { route, active, navigate, routes: ROUTES }
}
