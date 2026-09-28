/**
 * Centralised API client for the APEX PC control server.
 *
 * RULES
 * -----
 *  - Components never build URLs. They call a named method here.
 *  - Only the predefined endpoints in `endpoints.ts` are reachable.
 *  - No endpoint accepts a raw shell command (by design).
 *  - When no backend is configured, the swappable mock server
 *    (mockServer.ts) answers the very same routes so the dashboard works
 *    standalone during development.
 */

import type {
  ActionResult,
  AppId,
  FileNode,
  MediaSource,
  MediaState,
  ProcessInfo,
  StatusResponse,
  SystemStats,
} from '@/types/api'
import { API_ENDPOINTS } from './endpoints'
import { mockFetch } from './mockServer'

export interface ApiConfig {
  /** e.g. `http://192.168.1.8:8080` - empty string means "same origin". */
  baseUrl: string
  /** Per-request timeout in milliseconds. */
  timeoutMs: number
  /** Serve the simulated PC instead of performing network requests. */
  demoMode: boolean
}

export class ApiError extends Error {
  readonly status: number
  readonly endpoint: string

  constructor(message: string, endpoint: string, status = 0) {
    super(message)
    this.name = 'ApiError'
    this.endpoint = endpoint
    this.status = status
  }
}

export interface Envelope<T> {
  ok: boolean
  data?: T
  error?: string
}

const DEFAULT_TIMEOUT = 8000

function envNumber(name: string, fallback: number): number {
  const raw = (import.meta.env as unknown as Record<string, string | undefined>)[name]
  const parsed = raw === undefined ? NaN : Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

/** Resolve configuration from Vite env vars (see .env.example). */
export function resolveApiConfig(): ApiConfig {
  const configured = (import.meta.env.VITE_API_URL ?? '').trim().replace(/\/+$/, '')
  const demoFlag = (import.meta.env.VITE_DEMO_MODE ?? '').toLowerCase()
  const demoMode = demoFlag === 'true' || (demoFlag !== 'false' && configured === '')
  return {
    baseUrl: configured,
    timeoutMs: envNumber('VITE_API_TIMEOUT_MS', DEFAULT_TIMEOUT),
    demoMode,
  }
}

type FetchLike = (url: string, init?: RequestInit) => Promise<Response>

export class ApexApiClient {
  private config: ApiConfig
  private readonly fetchImpl: FetchLike

  constructor(config: Partial<ApiConfig> = {}) {
    this.config = { ...resolveApiConfig(), ...config }
    this.fetchImpl = (url, init) => {
      if (this.config.demoMode) {
        return mockFetch(url, {
          method: init?.method,
          body: init?.body,
          signal: init?.signal ?? undefined,
        })
      }
      return fetch(url, init)
    }
  }

  /** Called by the Settings provider whenever the PC address/port changes. */
  configure(patch: Partial<ApiConfig>): void {
    this.config = { ...this.config, ...patch }
  }

  getConfig(): ApiConfig {
    return { ...this.config }
  }

  /** Full URL for an endpoint (used for diagnostics in the UI). */
  url(endpoint: string): string {
    return `${this.config.baseUrl}${endpoint}`
  }

  private async request<T>(endpoint: string, init: RequestInit = {}): Promise<T> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs)
    const target = this.url(endpoint)

    try {
      const response = await this.fetchImpl(target, {
        ...init,
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          ...(init.body ? { 'Content-Type': 'application/json' } : {}),
          ...(init.headers ?? {}),
        },
      })

      const raw = await response.text()
      let parsed: Envelope<T> | null = null
      if (raw) {
        try {
          parsed = JSON.parse(raw) as Envelope<T>
        } catch {
          parsed = null
        }
      }

      if (!response.ok) {
        throw new ApiError(parsed?.error ?? `Request failed (${response.status})`, endpoint, response.status)
      }
      if (!parsed) throw new ApiError('Malformed response from PC server', endpoint, response.status)
      if (parsed.ok === false) {
        throw new ApiError(parsed.error ?? 'PC server rejected the request', endpoint, response.status)
      }

      return (parsed.data ?? (parsed as unknown as T)) as T
    } catch (error) {
      if (error instanceof ApiError) throw error
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ApiError('PC server timed out', endpoint, 408)
      }
      const message = error instanceof Error ? error.message : 'Network error'
      throw new ApiError(`Cannot reach PC server (${message})`, endpoint, 0)
    } finally {
      clearTimeout(timeout)
    }
  }

  private post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  }

  /* ---------------------------------------------------------------------- */
  /* status + telemetry                                                      */
  /* ---------------------------------------------------------------------- */

  getStatus(): Promise<StatusResponse> {
    return this.request<StatusResponse>(API_ENDPOINTS.status)
  }

  getSystemStats(): Promise<SystemStats> {
    return this.request<SystemStats>(API_ENDPOINTS.systemStats)
  }

  getProcesses(): Promise<ProcessInfo[]> {
    return this.request<ProcessInfo[]>(API_ENDPOINTS.systemProcesses)
  }

  /* ---------------------------------------------------------------------- */
  /* apps                                                                    */
  /* ---------------------------------------------------------------------- */

  /**
   * Ask the PC to launch an app. `app` is the stable id the *backend* maps to
   * an executable - no Windows paths are ever stored in the frontend.
   */
  launchApp(app: AppId): Promise<ActionResult> {
    return this.post<ActionResult>(API_ENDPOINTS.appsLaunch, { app })
  }

  closeApp(app: AppId): Promise<ActionResult> {
    return this.post<ActionResult>(API_ENDPOINTS.appsClose, { app })
  }

  getRecentApps(): Promise<Array<{ id: AppId; at: number }>> {
    return this.request<Array<{ id: AppId; at: number }>>(API_ENDPOINTS.appsRecent)
  }

  /* ---------------------------------------------------------------------- */
  /* system actions                                                          */
  /* ---------------------------------------------------------------------- */

  lockPC(): Promise<ActionResult> {
    return this.post<ActionResult>(API_ENDPOINTS.systemLock)
  }

  sleepPC(): Promise<ActionResult> {
    return this.post<ActionResult>(API_ENDPOINTS.systemSleep)
  }

  restartPC(): Promise<ActionResult> {
    return this.post<ActionResult>(API_ENDPOINTS.systemRestart)
  }

  shutdownPC(): Promise<ActionResult> {
    return this.post<ActionResult>(API_ENDPOINTS.systemShutdown)
  }

  displayOff(): Promise<ActionResult> {
    return this.post<ActionResult>(API_ENDPOINTS.systemDisplayOff)
  }

  wakeOnLan(): Promise<ActionResult> {
    return this.post<ActionResult>(API_ENDPOINTS.systemWakeOnLan)
  }

  takeScreenshot(): Promise<ActionResult> {
    return this.post<ActionResult>(API_ENDPOINTS.systemScreenshot)
  }

  emptyRecycleBin(): Promise<ActionResult> {
    return this.post<ActionResult>(API_ENDPOINTS.systemEmptyRecycleBin)
  }

  /* ---------------------------------------------------------------------- */
  /* media                                                                   */
  /* ---------------------------------------------------------------------- */

  getMediaState(): Promise<MediaState> {
    return this.request<MediaState>(API_ENDPOINTS.media)
  }

  playPause(): Promise<{ isPlaying: boolean }> {
    return this.post<{ isPlaying: boolean }>(API_ENDPOINTS.mediaPlayPause)
  }

  nextTrack(): Promise<ActionResult> {
    return this.post<ActionResult>(API_ENDPOINTS.mediaNext)
  }

  previousTrack(): Promise<ActionResult> {
    return this.post<ActionResult>(API_ENDPOINTS.mediaPrevious)
  }

  setVolume(value: number): Promise<{ volume: number; muted: boolean }> {
    return this.post<{ volume: number; muted: boolean }>(API_ENDPOINTS.mediaVolume, {
      value: Math.round(Math.min(100, Math.max(0, value))),
    })
  }

  setMuted(muted?: boolean): Promise<{ muted: boolean }> {
    return this.post<{ muted: boolean }>(API_ENDPOINTS.mediaMute, muted === undefined ? {} : { muted })
  }

  seek(positionSec: number): Promise<ActionResult> {
    return this.post<ActionResult>(API_ENDPOINTS.mediaSeek, { positionSec })
  }

  setMediaSource(source: MediaSource): Promise<ActionResult> {
    return this.post<ActionResult>(API_ENDPOINTS.mediaSource, { source })
  }

  getQueue(): Promise<{ index: number; items: Array<{ title: string; artist: string; durationSec: number }> }> {
    return this.request<{ index: number; items: Array<{ title: string; artist: string; durationSec: number }> }>(
      API_ENDPOINTS.mediaQueue,
    )
  }

  /* ---------------------------------------------------------------------- */
  /* files                                                                   */
  /* ---------------------------------------------------------------------- */

  listFiles(path: string): Promise<{ path: string; nodes: FileNode[] }> {
    const query = new URLSearchParams({ path })
    return this.request<{ path: string; nodes: FileNode[] }>(`${API_ENDPOINTS.files}?${query}`)
  }

  openPath(path: string): Promise<ActionResult> {
    return this.post<ActionResult>(API_ENDPOINTS.filesOpen, { path })
  }

  downloadFile(path: string): Promise<ActionResult> {
    return this.post<ActionResult>(API_ENDPOINTS.filesDownload, { path })
  }

  /* ---------------------------------------------------------------------- */
  /* tools                                                                   */
  /* ---------------------------------------------------------------------- */

  pushClipboard(text: string): Promise<ActionResult> {
    return this.post<ActionResult>(API_ENDPOINTS.toolsClipboard, { text })
  }

  sendNotification(title: string, message: string): Promise<ActionResult> {
    return this.post<ActionResult>(API_ENDPOINTS.toolsNotify, { title, message })
  }
}

/** Shared singleton used by every hook/component. */
export const api = new ApexApiClient()
