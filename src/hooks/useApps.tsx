/**
 * App catalogue + launcher.
 *
 * The catalogue is what the user sees. Launching only ever sends the stable
 * `id` to `POST /api/apps/launch`; the mapping from id -> Windows executable
 * lives in the backend (never in this frontend).
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api } from '@/services/api'
import type { AppCategory, AppDefinition, AppId } from '@/types/api'
import { useToast } from './useToast'

const CUSTOM_KEY = 'apex-control:apps:v1'
const PINNED_KEY = 'apex-control:pinned-apps:v1'
const RECENT_KEY = 'apex-control:recent-apps:v1'

export const DEFAULT_APPS: AppDefinition[] = [
  { id: 'chrome', name: 'Chrome', description: 'Open Browser', icon: 'Chrome', category: 'browser', tint: '#4285F4', builtIn: true },
  { id: 'vscode', name: 'VS Code', description: 'Code Editor', icon: 'Braces', category: 'dev', tint: '#3B82F6', builtIn: true },
  { id: 'discord', name: 'Discord', description: 'Open Discord', icon: 'MessageCircle', category: 'social', tint: '#6366F1', builtIn: true },
  { id: 'spotify', name: 'Spotify', description: 'Open Music', icon: 'AudioLines', category: 'music', tint: '#1DB954', builtIn: true },
  { id: 'games', name: 'Games', description: 'Steam / Epic', icon: 'Gamepad2', category: 'games', tint: '#A855F7', builtIn: true },
  { id: 'files', name: 'Files', description: 'Open Explorer', icon: 'FolderOpen', category: 'files', tint: '#F59E0B', builtIn: true },
  { id: 'youtube', name: 'YouTube', description: 'Open YouTube', icon: 'Youtube', category: 'video', tint: '#FF0033', builtIn: true },
  { id: 'notion', name: 'Notion', description: 'Notes', icon: 'NotebookText', category: 'productivity', tint: '#94A3B8', builtIn: true },
  { id: 'whatsapp', name: 'WhatsApp', description: 'Open WhatsApp', icon: 'MessageSquare', category: 'social', tint: '#25D366', builtIn: true },
]

/** Extra entries offered by the Apps library. */
export const EXTRA_APPS: AppDefinition[] = [
  { id: 'edge', name: 'Edge', description: 'Alternate browser', icon: 'Globe', category: 'browser', tint: '#0EA5E9' },
  { id: 'terminal', name: 'Terminal', description: 'Windows Terminal', icon: 'SquareTerminal', category: 'dev', tint: '#64748B' },
  { id: 'taskmgr', name: 'Task Manager', description: 'Processes', icon: 'Activity', category: 'custom', tint: '#22D3EE' },
  { id: 'obs', name: 'OBS Studio', description: 'Stream / Record', icon: 'Clapperboard', category: 'video', tint: '#F97316' },
  { id: 'steam', name: 'Steam', description: 'Game library', icon: 'Gamepad2', category: 'games', tint: '#38BDF8' },
  { id: 'vlc', name: 'VLC', description: 'Media player', icon: 'MonitorPlay', category: 'video', tint: '#FB923C' },
  { id: 'photoshop', name: 'Photoshop', description: 'Image editor', icon: 'Image', category: 'productivity', tint: '#22D3EE' },
  { id: 'premiere', name: 'Premiere Pro', description: 'Video editor', icon: 'Film', category: 'productivity', tint: '#A78BFA' },
  { id: 'notepad', name: 'Notepad', description: 'Quick notes', icon: 'FileText', category: 'productivity', tint: '#94A3B8' },
  { id: 'calculator', name: 'Calculator', description: 'Quick maths', icon: 'Calculator', category: 'custom', tint: '#FBBF24' },
  { id: 'mail', name: 'Mail', description: 'Inbox', icon: 'Mail', category: 'productivity', tint: '#60A5FA' },
  { id: 'teams', name: 'Teams', description: 'Meetings', icon: 'Users', category: 'social', tint: '#818CF8' },
  { id: 'telegram', name: 'Telegram', description: 'Chat', icon: 'Send', category: 'social', tint: '#38BDF8' },
  { id: 'zoom', name: 'Zoom', description: 'Video calls', icon: 'Video', category: 'social', tint: '#2DD4BF' },
  { id: 'figma', name: 'Figma', description: 'Design', icon: 'PenTool', category: 'productivity', tint: '#F472B6' },
]

/** Icons offered when the user creates a custom shortcut. */
export const ICON_CHOICES = [
  'Chrome', 'Globe', 'Braces', 'SquareTerminal', 'MessageCircle', 'MessageSquare', 'AudioLines',
  'Music', 'Gamepad2', 'FolderOpen', 'Youtube', 'NotebookText', 'FileText', 'Image', 'Film',
  'MonitorPlay', 'Clapperboard', 'Users', 'Send', 'Video', 'Mail', 'Calculator', 'Activity',
  'PenTool', 'Rocket', 'Zap', 'Star', 'Cpu', 'Server', 'Database', 'Layers', 'Radio', 'Sparkles',
]

export const TINT_CHOICES = [
  '#4285F4', '#6366F1', '#A855F7', '#EC4899', '#F43F5E', '#F97316',
  '#F59E0B', '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#3B82F6',
]

export const CATEGORY_LABEL: Record<AppCategory | 'all', string> = {
  all: 'All apps',
  browser: 'Browser',
  dev: 'Development',
  social: 'Social',
  music: 'Music',
  games: 'Games',
  files: 'Files',
  video: 'Video',
  productivity: 'Productivity',
  custom: 'Custom',
}

interface RecentEntry {
  app: AppDefinition;
  at: number;
}

interface AppsContextValue {
  /** Full catalogue: defaults + user shortcuts. */
  catalog: AppDefinition[];
  /** Apps pinned to the home dashboard, in order. */
  quickApps: AppDefinition[];
  recent: RecentEntry[];
  launching: AppId | null;
  isPinned: (id: AppId) => boolean;
  launch: (id: AppId) => Promise<void>;
  addApp: (app: Omit<AppDefinition, 'builtIn'>) => void;
  removeApp: (id: AppId) => void;
  pinApp: (id: AppId) => void;
  unpinApp: (id: AppId) => void;
  moveApp: (id: AppId, direction: -1 | 1) => void;
  resetApps: () => void;
  findApp: (id: AppId) => AppDefinition | undefined;
}

const AppsContext = createContext<AppsContextValue | null>(null)

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore quota / private-mode errors */
  }
}

function fallbackApp(id: AppId): AppDefinition {
  return { id, name: id, description: 'Custom shortcut', icon: 'Rocket', category: 'custom', tint: '#22D3EE' }
}

export function AppsProvider({ children }: { children: ReactNode }) {
  const toast = useToast()
  const [customApps, setCustomApps] = useState<AppDefinition[]>(() => readJson<AppDefinition[]>(CUSTOM_KEY, []))
  const [pinned, setPinned] = useState<AppId[]>(() => {
    const stored = readJson<AppId[]>(PINNED_KEY, [])
    const merged = [...DEFAULT_APPS.map((app) => app.id), ...stored.filter((id) => !DEFAULT_APPS.some((app) => app.id === id))]
    return Array.from(new Set(merged))
  })
  const [recent, setRecent] = useState<RecentEntry[]>(() => readJson<RecentEntry[]>(RECENT_KEY, []))
  const [launching, setLaunching] = useState<AppId | null>(null)

  useEffect(() => writeJson(CUSTOM_KEY, customApps), [customApps])
  useEffect(() => writeJson(PINNED_KEY, pinned), [pinned])
  useEffect(() => writeJson(RECENT_KEY, recent), [recent])

  const catalog = useMemo(() => [...DEFAULT_APPS, ...customApps, ...EXTRA_APPS], [customApps])

  const findApp = useCallback((id: AppId) => catalog.find((app) => app.id === id), [catalog])

  const quickApps = useMemo(
    () =>
      pinned
        .map((id) => catalog.find((app) => app.id === id))
        .filter((app): app is AppDefinition => Boolean(app))
        .slice(0, 12),
    [pinned, catalog],
  )

  /* Mirror the recents reported by the PC server when it is reachable. */
  useEffect(() => {
    let cancelled = false
    void api
      .getRecentApps()
      .then((list) => {
        if (cancelled || !Array.isArray(list)) return
        const merged: RecentEntry[] = list
          .map((entry) => {
            const app = catalog.find((candidate) => candidate.id === entry.id)
            return app ? { app, at: entry.at } : null
          })
          .filter((entry): entry is RecentEntry => entry !== null)
        if (merged.length > 0) setRecent(merged)
      })
      .catch(() => {
        /* offline - the locally stored recents are used instead */
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const value = useMemo<AppsContextValue>(
    () => ({
      catalog,
      quickApps,
      recent,
      launching,
      isPinned: (id) => pinned.includes(id),
      findApp,
      launch: async (id: AppId) => {
        const app = findApp(id)
        setLaunching(id)
        try {
          const result = await api.launchApp(id)
          setRecent((prev) => [
            { app: app ?? fallbackApp(id), at: Date.now() },
            ...prev.filter((entry) => entry.app.id !== id),
          ].slice(0, 8))
          toast.success('Launching ' + (app?.name ?? id), result.message ?? 'Command sent to APEX')
        } catch (error) {
          toast.error(
            `Could not launch ${app?.name ?? id}`,
            error instanceof Error ? error.message : 'The PC server did not accept the request',
          )
        } finally {
          setLaunching(null)
        }
      },
      addApp: (app) => {
        setCustomApps((prev) => [...prev, { ...app, builtIn: false }])
        setPinned((prev) => [...prev, app.id])
        toast.success('Shortcut added', `${app.name} is pinned to your dashboard`)
      },
      removeApp: (id) => {
        setCustomApps((prev) => prev.filter((app) => app.id !== id))
        setPinned((prev) => prev.filter((entry) => entry !== id))
        toast.info('Shortcut removed')
      },
      pinApp: (id) => {
        setPinned((prev) => (prev.includes(id) ? prev : [...prev, id]))
        toast.success('Pinned to Home')
      },
      unpinApp: (id) => {
        setPinned((prev) => prev.filter((entry) => entry !== id))
        toast.info('Unpinned from Home')
      },
      moveApp: (id, direction) => {
        setPinned((prev) => {
          const index = prev.indexOf(id)
          const target = index + direction
          if (index === -1 || target < 0 || target >= prev.length) return prev
          const next = [...prev]
          next[index] = prev[target]
          next[target] = prev[index]
          return next
        })
      },
      resetApps: () => {
        setCustomApps([])
        setPinned(DEFAULT_APPS.map((app) => app.id))
        setRecent([])
        toast.info('Dashboard reset', 'Quick Apps restored to defaults')
      },
    }),
    [catalog, quickApps, recent, launching, pinned, findApp, toast],
  )

  return <AppsContext.Provider value={value}>{children}</AppsContext.Provider>
}

export function useApps(): AppsContextValue {
  const ctx = useContext(AppsContext)
  if (!ctx) throw new Error('useApps must be used inside <AppsProvider>')
  return ctx
}
