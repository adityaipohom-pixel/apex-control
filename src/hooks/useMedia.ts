import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '@/services/api'
import type { MediaSource, MediaState } from '@/types/api'
import { useSettings } from './useSettings'
import { useToast } from './useToast'

export interface QueueItem {
  title: string;
  artist: string;
  durationSec: number;
}

export interface MediaController {
  media: MediaState | null
  queue: QueueItem[]
  /** Value shown by the slider while the user is dragging. */
  volume: number
  loading: boolean
  pending: boolean
  error: string | null
  togglePlayPause: () => void
  next: () => void
  previous: () => void
  setVolume: (value: number) => void
  commitVolume: (value: number) => void
  toggleMute: () => void
  seek: (positionSec: number) => void
  setSource: (source: MediaSource) => void
  refresh: () => void
}

/**
 * Owns media playback state: polls `GET /api/media`, and exposes the
 * predefined transport controls. Every control is optimistic and falls back
 * to the server value, so the UI stays responsive on a touch screen.
 */
export function useMedia(): MediaController {
  const { settings } = useSettings()
  const toast = useToast()
  const [media, setMedia] = useState<MediaState | null>(null)
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [volume, setVolumeState] = useState(0)
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const volumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const refreshQueue = useCallback(async () => {
    try {
      const next = await api.getQueue()
      setQueue(Array.isArray(next.items) ? next.items : [])
    } catch {
      // queue is optional
    }
  }, [])

  const refresh = useCallback(async () => {
    try {
      const next = await api.getMediaState()
      setMedia(next)
      setVolumeState(next.muted ? 0 : next.volume)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Media session unavailable')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
    void refreshQueue()
    const id = setInterval(() => void refresh(), settings.mediaPollMs)
    const queueId = setInterval(() => void refreshQueue(), Math.max(5000, settings.mediaPollMs * 5))
    return () => {
      clearInterval(id)
      clearInterval(queueId)
    }
  }, [refresh, refreshQueue, settings.mediaPollMs])

  useEffect(
    () => () => {
      if (volumeTimer.current) clearTimeout(volumeTimer.current)
    },
    [],
  )

  const run = useCallback(
    async (action: () => Promise<unknown>, successMessage: string) => {
      setPending(true)
      try {
        await action()
        await refresh()
        toast.success(successMessage)
      } catch (err) {
        toast.error('Command failed', err instanceof Error ? err.message : 'PC did not respond')
      } finally {
        setPending(false)
      }
    },
    [refresh, toast],
  )

  const commitVolume = useCallback(
    (value: number) => {
      setVolumeState(value)
      if (volumeTimer.current) clearTimeout(volumeTimer.current)
      volumeTimer.current = setTimeout(() => {
        void run(() => api.setVolume(value), `Volume set to ${Math.round(value)}%`)
      }, 180)
    },
    [run],
  )

  return {
    media,
    queue,
    volume: volume || media?.volume || 0,
    loading,
    pending,
    error,
    togglePlayPause: () => void run(() => api.playPause(), 'Playback toggled'),
    next: () => void run(() => api.nextTrack(), 'Next track'),
    previous: () => void run(() => api.previousTrack(), 'Previous track'),
    setVolume: (value: number) => setVolumeState(value),
    commitVolume,
    toggleMute: () => {
      const nextMuted = !(media?.muted ?? false)
      setVolumeState(nextMuted ? 0 : media?.volume ?? 0)
      void run(() => api.setMuted(nextMuted), nextMuted ? 'Muted' : 'Unmuted')
    },
    seek: (positionSec: number) => void run(() => api.seek(positionSec), 'Position updated'),
    setSource: (source: MediaSource) => void run(() => api.setMediaSource(source), `Player: ${source}`),
    refresh: () => {
      void refresh()
      void refreshQueue()
    },
  }
}
