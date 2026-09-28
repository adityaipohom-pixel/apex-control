/**
 * Reusable connection service.
 *
 * Owns the "is the PC reachable?" question: it polls `GET /api/status`,
 * measures round-trip latency, tracks consecutive failures and exposes an
 * observable snapshot that any component can subscribe to. Components never
 * talk to `fetch` themselves.
 */

import { api, type ApexApiClient } from './api'
import type { ConnectionState, StatusResponse } from '@/types/api'

export interface ConnectionSnapshot {
  state: ConnectionState
  status: StatusResponse | null
  error: string | null
  latencyMs: number | null
  lastCheckedAt: number | null
  /** Failed attempts since the last success (used for the back-off hint). */
  attempts: number
  /** True while a status request is in flight. */
  checking: boolean
}

export interface ConnectionOptions {
  intervalMs: number
  autoReconnect: boolean
}

type Listener = (snapshot: ConnectionSnapshot) => void

const INITIAL: ConnectionSnapshot = {
  state: 'connecting',
  status: null,
  error: null,
  latencyMs: null,
  lastCheckedAt: null,
  attempts: 0,
  checking: false,
}

export class ConnectionService {
  private snapshot: ConnectionSnapshot = INITIAL
  private listeners = new Set<Listener>()
  private timer: ReturnType<typeof setTimeout> | null = null
  private inFlight = false
  private stopped = false

  constructor(
    private readonly client: ApexApiClient,
    private options: ConnectionOptions = { intervalMs: 5000, autoReconnect: true },
  ) {}

  /* ---------------------------------------------------------------- state */

  getSnapshot(): ConnectionSnapshot {
    return this.snapshot
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    listener(this.snapshot)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private patch(next: Partial<ConnectionSnapshot>) {
    this.snapshot = { ...this.snapshot, ...next }
    for (const listener of this.listeners) listener(this.snapshot)
  }

  /* ------------------------------------------------------------- polling */

  configure(options: Partial<ConnectionOptions>) {
    const previous = this.options
    this.options = { ...previous, ...options }
    if (this.options.intervalMs !== previous.intervalMs || this.options.autoReconnect !== previous.autoReconnect) {
      this.restart()
    }
  }

  start() {
    this.stopped = false
    this.restart()
  }

  stop() {
    this.stopped = true
    if (this.timer !== null) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }

  private restart() {
    if (this.timer !== null) {
      clearTimeout(this.timer)
      this.timer = null
    }
    if (!this.stopped) void this.refresh()
  }

  /** Runs one status check immediately and schedules the next one. */
  async refresh(): Promise<ConnectionSnapshot> {
    if (this.inFlight) return this.snapshot
    this.inFlight = true
    this.patch({ checking: true })

    const startedAt = performance.now()
    try {
      const status = await this.client.getStatus()
      const latencyMs = Math.round(performance.now() - startedAt)
      this.patch({
        state: status.online ? 'online' : 'offline',
        status,
        error: null,
        latencyMs: status.latencyMs ?? latencyMs,
        lastCheckedAt: Date.now(),
        attempts: 0,
        checking: false,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      this.patch({
        state: 'offline',
        status: null,
        error: message,
        latencyMs: null,
        lastCheckedAt: Date.now(),
        attempts: this.snapshot.attempts + 1,
        checking: false,
      })
    } finally {
      this.inFlight = false
      this.schedule()
    }

    return this.snapshot
  }

  private schedule() {
    if (this.stopped || !this.options.autoReconnect) return
    if (this.timer !== null) clearTimeout(this.timer)
    // Gentle back-off while the PC is unreachable, normal cadence when online.
    const backoff =
      this.snapshot.state === 'offline'
        ? Math.min(15000, this.options.intervalMs * (this.snapshot.attempts || 1))
        : this.options.intervalMs
    this.timer = setTimeout(() => void this.refresh(), backoff)
  }
}

/**
 * Process-wide singleton: the header, sidebar, banner and pages all share one
 * poller instead of each creating their own.
 */
export const connectionService = new ConnectionService(api, {
  intervalMs: 5000,
  autoReconnect: true,
})
