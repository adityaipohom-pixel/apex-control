import { useCallback, useState } from 'react'
import { api } from '@/services/api'
import { useToast } from './useToast'

export type SystemActionKey = 'lock' | 'sleep' | 'restart' | 'shutdown' | 'displayOff' | 'wakeOnLan' | 'screenshot' | 'recycleBin'

/**
 * Wraps the predefined power/system actions with pending state and toasts.
 * Each action maps 1:1 to a backend endpoint - there is no generic command
 * passthrough.
 */
export function useSystemActions() {
  const toast = useToast()
  const [pending, setPending] = useState<SystemActionKey | null>(null)

  const run = useCallback(
    async (key: SystemActionKey, action: () => Promise<{ message?: string }>, successMessage: string) => {
      setPending(key)
      try {
        const result = await action()
        toast.success(result.message ?? successMessage, 'Command sent to APEX')
      } catch (error) {
        toast.error(
          `${successMessage} failed`,
          error instanceof Error ? error.message : 'The PC server did not respond',
        )
      } finally {
        setPending(null)
      }
    },
    [toast],
  )

  return {
    pending,
    lock: () => run('lock', () => api.lockPC(), 'Workstation locked'),
    sleep: () => run('sleep', () => api.sleepPC(), 'PC entering sleep'),
    restart: () => run('restart', () => api.restartPC(), 'PC restarting'),
    shutdown: () => run('shutdown', () => api.shutdownPC(), 'PC shutting down'),
    displayOff: () => run('displayOff', () => api.displayOff(), 'Display turned off'),
    wakeOnLan: () => run('wakeOnLan', () => api.wakeOnLan(), 'Wake-on-LAN packet sent'),
    screenshot: () => run('screenshot', () => api.takeScreenshot(), 'Screenshot captured'),
    recycleBin: () => run('recycleBin', () => api.emptyRecycleBin(), 'Recycle Bin emptied'),
  }
}
