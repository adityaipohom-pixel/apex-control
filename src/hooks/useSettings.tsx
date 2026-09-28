/**
 * Settings context.
 *
 * Holds every user preference (PC address, port, dashboard name, theme,
 * accent, poll intervals, ...) in localStorage and pushes the parts the
 * runtime cares about (accent CSS variables, API base URL, fullscreen) into
 * the app.
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

export type SurfaceTheme = 'obsidian' | 'navy' | 'graphite' | 'midnight'
export type AccentKey = 'cyan' | 'blue' | 'violet' | 'emerald' | 'amber' | 'rose'

export interface Settings {
  /* --- connection ------------------------------------------------------- */
  pcAddress: string
  port: string
  demoMode: boolean
  autoReconnect: boolean
  statusPollMs: number
  statsPollMs: number
  mediaPollMs: number

  /* --- appearance ------------------------------------------------------- */
  dashboardName: string
  theme: SurfaceTheme
  accent: AccentKey
  sidebarCollapsed: boolean
  reduceMotion: boolean

  /* --- behaviour -------------------------------------------------------- */
  confirmShutdown: boolean
  fullscreen: boolean
  hapticFeedback: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  pcAddress: '',
  port: '8080',
  demoMode: true,
  autoReconnect: true,
  statusPollMs: 5000,
  statsPollMs: 2000,
  mediaPollMs: 1000,

  dashboardName: 'APEX CONTROL',
  theme: 'obsidian',
  accent: 'cyan',
  sidebarCollapsed: false,
  reduceMotion: false,

  confirmShutdown: true,
  fullscreen: false,
  hapticFeedback: true,
}

export interface AccentOption {
  key: AccentKey
  label: string
  /** Primary accent as `r g b` (consumed by rgb(var(--accent-rgb) / a)). */
  rgb: string
  /** Secondary accent used by gradients. */
  rgb2: string
}

export const ACCENTS: AccentOption[] = [
  { key: 'cyan', label: 'Cyan', rgb: '34 211 238', rgb2: '129 140 248' },
  { key: 'blue', label: 'Blue', rgb: '59 130 246', rgb2: '99 102 241' },
  { key: 'violet', label: 'Violet', rgb: '167 139 250', rgb2: '232 121 249' },
  { key: 'emerald', label: 'Emerald', rgb: '52 211 153', rgb2: '45 212 191' },
  { key: 'amber', label: 'Amber', rgb: '251 191 36', rgb2: '251 146 60' },
  { key: 'rose', label: 'Rose', rgb: '251 113 133', rgb2: '244 114 182' },
]

export interface ThemeOption {
  key: SurfaceTheme
  label: string
  description: string
}

export const THEMES: ThemeOption[] = [
  { key: 'obsidian', label: 'Obsidian', description: 'Near-black with cool highlights' },
  { key: 'navy', label: 'Deep Navy', description: 'Deep blue command-centre tone' },
  { key: 'graphite', label: 'Graphite', description: 'Neutral charcoal, low glare' },
  { key: 'midnight', label: 'Midnight', description: 'Maximum contrast for dark rooms' },
]

const STORAGE_KEY = 'apex-control:settings:v1'

function readStoredSettings(): Settings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw) as Partial<Settings>
    return { ...DEFAULT_SETTINGS, ...parsed }
  } catch {
    return DEFAULT_SETTINGS
  }
}

interface SettingsContextValue {
  settings: Settings
  update: <K extends keyof Settings>(key: K, value: Settings[K]) => void
  patch: (values: Partial<Settings>) => void
  reset: () => void
  /** `http://192.168.1.8:8080` (or '' when running same-origin / demo). */
  apiBaseUrl: string
  isFullscreen: boolean
  toggleFullscreen: () => void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(readStoredSettings)
  const [isFullscreen, setIsFullscreen] = useState(false)

  /* --- persistence ------------------------------------------------------ */
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {
      /* storage may be unavailable (private mode) - preferences stay in memory */
    }
  }, [settings])

  /* --- theme / accent --------------------------------------------------- */
  useEffect(() => {
    const root = document.documentElement
    root.dataset.surface = settings.theme
    root.style.setProperty('--accent-rgb', ACCENTS.find((a) => a.key === settings.accent)?.rgb ?? ACCENTS[0].rgb)
    root.style.setProperty('--accent2-rgb', ACCENTS.find((a) => a.key === settings.accent)?.rgb2 ?? ACCENTS[0].rgb2)
    root.style.setProperty('--glass-alpha', settings.theme === 'graphite' ? '0.06' : '0.045')
  }, [settings.theme, settings.accent])

  /* --- reduced motion --------------------------------------------------- */
  useEffect(() => {
    document.documentElement.classList.toggle('no-anim', settings.reduceMotion)
  }, [settings.reduceMotion])

  /* --- API wiring ------------------------------------------------------- */
  const apiBaseUrl = useMemo(() => {
    if (settings.demoMode) return ''
    const host = settings.pcAddress.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '')
    if (!host) return ''
    return host.startsWith('http') ? host : `http://${host}:${settings.port.trim() || '8080'}`
  }, [settings.pcAddress, settings.port, settings.demoMode])

  useEffect(() => {
    api.configure({ baseUrl: apiBaseUrl, demoMode: settings.demoMode })
  }, [apiBaseUrl, settings.demoMode])

  /* --- fullscreen ------------------------------------------------------- */
  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  useEffect(() => {
    // Runs on mount too, so a stored fullscreen preference is honoured after a
    // reload. Exiting via the browser/Esc only updates `isFullscreen`, which is
    // not a dependency here, so this cannot loop.
    if (!document.fullscreenEnabled) return
    if (settings.fullscreen && !document.fullscreenElement) {
      void document.documentElement.requestFullscreen().catch(() => undefined)
    } else if (!settings.fullscreen && document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined)
    }
  }, [settings.fullscreen])

  const toggleFullscreen = useCallback(() => {
    setSettings((prev) => ({ ...prev, fullscreen: !prev.fullscreen }))
  }, [])

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      update: (key, val) => setSettings((prev) => ({ ...prev, [key]: val })),
      patch: (values) => setSettings((prev) => ({ ...prev, ...values })),
      reset: () => setSettings(DEFAULT_SETTINGS),
      apiBaseUrl,
      isFullscreen,
      toggleFullscreen,
    }),
    [settings, apiBaseUrl, isFullscreen, toggleFullscreen],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>')
  return ctx
}
