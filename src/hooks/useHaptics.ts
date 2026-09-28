import { useCallback } from 'react'
import { useSettings } from './useSettings'

/**
 * Short haptic tick on control presses - makes a wall-mounted tablet feel
 * like a physical panel. Silently ignored where vibration is unsupported.
 */
export function useHaptics() {
  const { settings } = useSettings()

  return useCallback(
    (pattern: number | number[] = 8) => {
      if (!settings.hapticFeedback) return
      if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return
      try {
        navigator.vibrate(pattern)
      } catch {
        /* some browsers throw when the page is not visible */
      }
    },
    [settings.hapticFeedback],
  )
}
