import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '@/services/api'
import type { ProcessInfo, SystemStats } from '@/types/api'
import { useSettings } from './useSettings'

export interface StatsSample {
  t: number
  cpu: number
  ram: number
  download: number
  upload: number
}

export interface SystemStatsState {
  stats: SystemStats | null
  history: StatsSample[]
  processes: ProcessInfo[]
  loading: boolean
  /** True when the last poll failed but we still hold previous data. */
  stale: boolean
  error: string | null
  lastUpdatedAt: number | null
  refresh: () => Promise<void>
}

const MAX_HISTORY = 40

/**
 * Polls `GET /api/system/stats` (and the process list) and keeps a rolling
 * history for the sparkline charts. Never throws - the UI degrades to
 * skeletons + an error hint instead.
 */
export function useSystemStats(): SystemStatsState {
  const { settings } = useSettings()
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [history, setHistory] = useState<StatsSample[]>([])
  const [processes, setProcesses] = useState<ProcessInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [stale, setStale] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const poll = useCallback(async () => {
    try {
      const next = await api.getSystemStats()
      if (!mounted.current) return
      setStats(next)
      setStale(false)
      setError(null)
      setLastUpdatedAt(Date.now())
      setHistory((prev) => {
        const sample: StatsSample = {
          t: Date.now(),
          cpu: next.cpu.usage,
          ram: next.ram.usage,
          download: next.network.downloadMbps,
          upload: next.network.uploadMbps,
        }
        return [...prev, sample].slice(-MAX_HISTORY)
      })
    } catch (err) {
      if (!mounted.current) return
      setStale(true)
      setError(err instanceof Error ? err.message : 'Unable to read system stats')
    } finally {
      if (mounted.current) setLoading(false)
    }
  }, [])

  const pollProcesses = useCallback(async () => {
    try {
      const list = await api.getProcesses()
      if (mounted.current) setProcesses(list)
    } catch {
      /* process list is optional - ignore failures */
    }
  }, [])

  useEffect(() => {
    void poll()
    void pollProcesses()
    const id = setInterval(() => void poll(), settings.statsPollMs)
    const processId = setInterval(() => void pollProcesses(), Math.max(4000, settings.statsPollMs * 3))
    return () => {
      clearInterval(id)
      clearInterval(processId)
    }
  }, [poll, pollProcesses, settings.statsPollMs])

  return {
    stats,
    history,
    processes,
    loading,
    stale,
    error,
    lastUpdatedAt,
    refresh: async () => {
      await Promise.all([poll(), pollProcesses()])
    },
  }
}
