/**
 * Shared type definitions for the APEX CONTROL dashboard.
 *
 * These types describe the contract between this frontend and the Python
 * Flask control server running on the APEX Windows PC. The frontend never
 * assumes anything about how the backend performs an action - it only calls
 * the predefined endpoints listed in `src/services/endpoints.ts`.
 */

export type ConnectionState = 'connecting' | 'online' | 'offline'

export type AppCategory = 'browser' | 'dev' | 'social' | 'music' | 'games' | 'files' | 'video' | 'productivity' | 'custom'

/** Identifier used by the API payload. The exe path lives on the backend. */
export type AppId = string

export interface AppDefinition {
  id: AppId
  name: string
  description: string
  /** Lucide icon name, resolved through `src/components/ui/AppIcon.tsx`. */
  icon: string
  category: AppCategory
  /** CSS color used for the card tint / icon glow. */
  tint: string
  /** Built-in apps cannot be deleted, only reordered. */
  builtIn?: boolean
}

export interface WifiInfo {
  connected: boolean
  ssid: string
  /** 0-100 */
  signal: number
  band: '2.4 GHz' | '5 GHz' | '6 GHz' | string
  ipAddress: string
  /** Link speed in Mbps, when the OS reports it. */
  linkSpeedMbps?: number
}

export interface CpuInfo {
  model: string
  /** 0-100 */
  usage: number
  cores: number
  threads: number
  /** Celsius, when a sensor is available. */
  temperatureC?: number
  clockGhz?: number
}

export interface MemoryInfo {
  totalGb: number
  usedGb: number
  /** 0-100 */
  usage: number
}

export interface DiskInfo {
  name: string
  totalGb: number
  usedGb: number
  /** 0-100 */
  usage: number
}

export interface GpuInfo {
  model: string
  vramTotalGb: number
  vramUsedGb: number
  /** 0-100 */
  usage?: number
  temperatureC?: number
}

export interface NetworkInfo {
  downloadMbps: number
  uploadMbps: number
  adapter: string
  /** Total bytes transferred since boot. */
  bytesReceived?: number
  bytesSent?: number
}

export interface SystemStats {
  cpu: CpuInfo
  ram: MemoryInfo
  disks: DiskInfo[]
  gpu: GpuInfo
  network: NetworkInfo
  /** Seconds since the PC booted. */
  uptimeSec: number
  /** Round-trip latency measured by the backend. */
  latencyMs: number
}

export interface StatusResponse {
  online: boolean
  hostname: string
  ipAddress: string
  os: string
  serverVersion: string
  uptimeSec: number
  latencyMs: number
  wifi: WifiInfo
  timestamp: number
}

export type MediaSource = 'spotify' | 'chrome' | 'youtube' | 'vlc' | 'groove' | 'system' | string

export interface MediaState {
  title: string
  artist: string
  album?: string
  /** Seconds. */
  positionSec: number
  durationSec: number
  isPlaying: boolean
  /** 0-100 */
  volume: number
  muted: boolean
  source: MediaSource
  /** Source URL/thumbnail when the player provides one. */
  artworkUrl?: string
}

export interface ProcessInfo {
  pid: number
  name: string
  /** 0-100 */
  cpu: number
  /** Megabytes. */
  memoryMb: number
}

export interface FileNode {
  name: string
  path: string
  kind: 'folder' | 'file'
  sizeBytes?: number
  modifiedAt?: string
  extension?: string
}

export type ActionResult = {
  ok: boolean
  message?: string
}

/** Shape returned by every mutating endpoint of the control API. */
export interface ApiResponse<T = unknown> {
  ok: boolean
  data?: T
  error?: string
}
