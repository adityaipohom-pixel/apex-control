import { useEffect, useState } from 'react'
import { connectionService } from '@/services/connection'
import type { ConnectionSnapshot } from '@/services/connection'
import { useSettings } from './useSettings'

/**
 * Subscribes to the shared connection service and keeps its polling cadence
 * in sync with the user's settings.
 */
export function useConnection() {
  const { settings } = useSettings()
  const [snapshot, setSnapshot] = useState<ConnectionSnapshot>(() => connectionService.getSnapshot())

  useEffect(() => {
    connectionService.configure({
      intervalMs: settings.statusPollMs,
      autoReconnect: settings.autoReconnect,
    })
  }, [settings.statusPollMs, settings.autoReconnect])

  useEffect(() => {
    const unsubscribe = connectionService.subscribe(setSnapshot)
    connectionService.start()
    return () => {
      unsubscribe()
      connectionService.stop()
    }
  }, [])

  return {
    ...snapshot,
    refresh: () => connectionService.refresh(),
  }
}
