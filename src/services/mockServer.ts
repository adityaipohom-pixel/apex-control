/**
 * In-browser simulation of the Python Flask control server.
 *
 * WHY THIS EXISTS
 * ---------------
 * The real backend only exists once the APEX PC is running the Flask app.
 * Until then this module answers the exact same routes with realistic,
 * slowly-changing telemetry so the dashboard is a *working* product rather
 * than a static screenshot. It speaks real `Response` objects, so the API
 * client code path is byte-for-byte identical to a live deployment.
 *
 * Swap it off by setting VITE_DEMO_MODE=false / VITE_API_URL=<pc-ip>.
 *
 * NOTE: no shell command is ever executed - this is a pure data simulation.
 */

import type {
  FileNode,
  MediaState,
  ProcessInfo,
  StatusResponse,
  SystemStats,
} from '@/types/api'

interface MockState {
  bootedAt: number
  hostname: string
  os: string
  serverVersion: string
  ipAddress: string
  wifi: { ssid: string; signal: number; band: string; linkSpeedMbps: number }
  cpu: { model: string; cores: number; threads: number; baseGhz: number; usage: number; tempC: number; clockGhz: number }
  ram: { totalGb: number; usedGb: number }
  disks: Array<{ name: string; totalGb: number; usedGb: number }>
  gpu: { model: string; vramTotalGb: number; vramUsedGb: number; usage: number; tempC: number }
  network: { downloadMbps: number; uploadMbps: number; adapter: string; bytesReceived: number; bytesSent: number }
  media: MediaState & { queueIndex: number; playlist: Array<Pick<MediaState, 'title' | 'artist' | 'album' | 'durationSec'>>; shuffle: boolean; repeat: boolean }
  processes: ProcessInfo[]
  recent: Array<{ id: string; at: number }>
  /** Simulated action log (mirrors what the real server would do). */
  log: string[]
}

const PLAYLIST: MockState['media']['playlist'] = [
  { title: 'Neon Horizon', artist: 'Synthwave Collective', album: 'Night Drive', durationSec: 214 },
  { title: 'Midnight Protocol', artist: 'Apex Sound System', album: 'Overclock', durationSec: 187 },
  { title: 'Glass Cathedral', artist: 'Violet Static', album: 'Reverie', durationSec: 246 },
  { title: 'Deep Signal', artist: 'Kaito Mori', album: 'Low Orbit', durationSec: 203 },
  { title: 'Afterburner', artist: 'Helix Division', album: 'Thermal', durationSec: 231 },
]

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))
const round = (v: number, p = 1) => Number(v.toFixed(p))
const randomWalk = (value: number, step: number, min: number, max: number) =>
  clamp(value + (Math.random() - 0.5) * step * 2, min, max)

function createState(): MockState {
  return {
    bootedAt: Date.now() - 1000 * 60 * 60 * 3.4,
    hostname: 'APEX',
    os: 'Windows 11 Pro 24H2',
    serverVersion: '1.4.0',
    ipAddress: '192.168.1.8',
    wifi: { ssid: 'APEX-NET-5G', signal: 92, band: '5 GHz', linkSpeedMbps: 866 },
    cpu: {
      model: 'Intel Core i5 13th Gen',
      cores: 10,
      threads: 12,
      baseGhz: 2.8,
      usage: 34,
      tempC: 48,
      clockGhz: 3.4,
    },
    ram: { totalGb: 16, usedGb: 9.9 },
    disks: [
      { name: 'C:', totalGb: 476, usedGb: 128 },
      { name: 'D:', totalGb: 931, usedGb: 402 },
    ],
    gpu: { model: 'Intel Iris Xe', vramTotalGb: 8, vramUsedGb: 2.1, usage: 18, tempC: 44 },
    network: { downloadMbps: 12.4, uploadMbps: 3.1, adapter: 'Intel Wi-Fi 6 AX201', bytesReceived: 0, bytesSent: 0 },
    media: {
      title: PLAYLIST[0].title,
      artist: PLAYLIST[0].artist,
      album: PLAYLIST[0].album,
      positionSec: 88,
      durationSec: PLAYLIST[0].durationSec,
      isPlaying: true,
      volume: 70,
      muted: false,
      source: 'spotify',
      artworkUrl: undefined,
      queueIndex: 0,
      playlist: PLAYLIST,
      shuffle: false,
      repeat: false,
    },
    processes: [
      { pid: 4820, name: 'chrome.exe', cpu: 12.4, memoryMb: 1240 },
      { pid: 9132, name: 'Code.exe', cpu: 6.1, memoryMb: 860 },
      { pid: 2210, name: 'Discord.exe', cpu: 3.2, memoryMb: 540 },
      { pid: 7714, name: 'Spotify.exe', cpu: 4.8, memoryMb: 410 },
      { pid: 1180, name: 'explorer.exe', cpu: 1.9, memoryMb: 260 },
      { pid: 3312, name: 'System', cpu: 0.8, memoryMb: 140 },
    ],
    recent: [
      { id: 'chrome', at: Date.now() - 1000 * 60 * 4 },
      { id: 'vscode', at: Date.now() - 1000 * 60 * 22 },
      { id: 'discord', at: Date.now() - 1000 * 60 * 48 },
      { id: 'spotify', at: Date.now() - 1000 * 60 * 61 },
      { id: 'files', at: Date.now() - 1000 * 60 * 95 },
    ],
    log: [],
  }
}

let state: MockState = createState()
let timer: ReturnType<typeof setInterval> | null = null
let lastTick = Date.now()

function advance(dtSec: number) {
  const s = state

  // --- CPU ---------------------------------------------------------------
  const loadBurst = Math.random() < 0.06 ? 22 : 0
  s.cpu.usage = clamp(s.cpu.usage + (Math.random() - 0.5) * 9 + loadBurst * (Math.random() < 0.5 ? 1 : -0.4), 4, 98)
  s.cpu.tempC = clamp(38 + s.cpu.usage * 0.42 + (Math.random() - 0.5) * 2, 34, 92)
  s.cpu.clockGhz = round(s.cpu.baseGhz + (s.cpu.usage / 100) * 2.1 + (Math.random() - 0.5) * 0.15, 2)

  // --- RAM ---------------------------------------------------------------
  s.ram.usedGb = clamp(s.ram.usedGb + (Math.random() - 0.5) * 0.5, 4.2, 13.6)

  // --- GPU ---------------------------------------------------------------
  s.gpu.usage = clamp(s.gpu.usage + (Math.random() - 0.5) * 12, 0, 99)
  s.gpu.tempC = clamp(36 + s.gpu.usage * 0.4 + (Math.random() - 0.5) * 2, 32, 88)
  s.gpu.vramUsedGb = clamp(s.gpu.vramUsedGb + (Math.random() - 0.5) * 0.3, 0.4, 6.4)

  // --- Network -----------------------------------------------------------
  s.network.downloadMbps = round(randomWalk(s.network.downloadMbps, 14, 0.2, 320), 1)
  s.network.uploadMbps = round(randomWalk(s.network.uploadMbps, 4, 0.1, 68), 1)
  s.network.bytesReceived += (s.network.downloadMbps * 1_000_000) / 8 * dtSec
  s.network.bytesSent += (s.network.uploadMbps * 1_000_000) / 8 * dtSec

  // --- Wi-Fi -------------------------------------------------------------
  s.wifi.signal = Math.round(clamp(s.wifi.signal + (Math.random() - 0.5) * 3, 62, 99))

  // --- Media -------------------------------------------------------------
  if (s.media.isPlaying) {
    s.media.positionSec = round(s.media.positionSec + dtSec, 2)
    if (s.media.positionSec >= s.media.durationSec) nextTrack()
  }

  // --- Processes ---------------------------------------------------------
  for (const p of s.processes) {
    p.cpu = Math.max(0.1, round(p.cpu + (Math.random() - 0.5) * 3, 1))
    p.memoryMb = Math.max(40, Math.round(p.memoryMb + (Math.random() - 0.5) * 40))
  }
}

function nextTrack() {
  const m = state.media
  const next = m.shuffle
    ? Math.floor(Math.random() * m.playlist.length)
    : (m.queueIndex + 1) % m.playlist.length
  m.queueIndex = next
  const track = m.playlist[next]
  m.title = track.title
  m.artist = track.artist
  m.album = track.album
  m.durationSec = track.durationSec
  m.positionSec = 0
}

function previousTrack() {
  const m = state.media
  if (m.positionSec > 4) {
    m.positionSec = 0
    return
  }
  const prev = (m.queueIndex - 1 + m.playlist.length) % m.playlist.length
  m.queueIndex = prev
  const track = m.playlist[prev]
  m.title = track.title
  m.artist = track.artist
  m.album = track.album
  m.durationSec = track.durationSec
  m.positionSec = 0
}

function ensureTimer() {
  if (timer !== null || typeof window === 'undefined') return
  timer = setInterval(() => {
    const now = Date.now()
    const dt = Math.min(5, (now - lastTick) / 1000)
    lastTick = now
    advance(dt)
  }, 1000)
}

function resetState() {
  state = createState()
  lastTick = Date.now()
}

/* ------------------------------------------------------------------------- */
/* serialisers                                                               */
/* ------------------------------------------------------------------------- */

function statusResponse(): StatusResponse {
  const uptimeSec = Math.floor((Date.now() - state.bootedAt) / 1000)
  return {
    online: true,
    hostname: state.hostname,
    ipAddress: state.ipAddress,
    os: state.os,
    serverVersion: state.serverVersion,
    uptimeSec,
    latencyMs: round(2 + Math.random() * 9, 0),
    wifi: {
      connected: true,
      ssid: state.wifi.ssid,
      signal: state.wifi.signal,
      band: state.wifi.band,
      ipAddress: state.ipAddress,
      linkSpeedMbps: state.wifi.linkSpeedMbps,
    },
    timestamp: Date.now(),
  }
}

function statsResponse(): SystemStats {
  return {
    cpu: {
      model: state.cpu.model,
      usage: round(state.cpu.usage, 1),
      cores: state.cpu.cores,
      threads: state.cpu.threads,
      temperatureC: round(state.cpu.tempC, 0),
      clockGhz: state.cpu.clockGhz,
    },
    ram: {
      totalGb: state.ram.totalGb,
      usedGb: round(state.ram.usedGb, 1),
      usage: round((state.ram.usedGb / state.ram.totalGb) * 100, 1),
    },
    disks: state.disks.map((d) => ({
      name: d.name,
      totalGb: d.totalGb,
      usedGb: d.usedGb,
      usage: round((d.usedGb / d.totalGb) * 100, 1),
    })),
    gpu: {
      model: state.gpu.model,
      vramTotalGb: state.gpu.vramTotalGb,
      vramUsedGb: round(state.gpu.vramUsedGb, 1),
      usage: round(state.gpu.usage, 1),
      temperatureC: round(state.gpu.tempC, 0),
    },
    network: {
      downloadMbps: state.network.downloadMbps,
      uploadMbps: state.network.uploadMbps,
      adapter: state.network.adapter,
      bytesReceived: Math.round(state.network.bytesReceived),
      bytesSent: Math.round(state.network.bytesSent),
    },
    uptimeSec: Math.floor((Date.now() - state.bootedAt) / 1000),
    latencyMs: round(2 + Math.random() * 9, 0),
  }
}

function mediaResponse(): MediaState {
  const m = state.media
  return {
    title: m.title,
    artist: m.artist,
    album: m.album,
    positionSec: Math.floor(m.positionSec),
    durationSec: m.durationSec,
    isPlaying: m.isPlaying,
    volume: m.volume,
    muted: m.muted,
    source: m.source,
  }
}

const FILE_TREE: Record<string, FileNode[]> = {
  '/': [
    { name: 'Users', path: '/Users', kind: 'folder', modifiedAt: '2026-09-28 18:02' },
    { name: 'Windows', path: '/Windows', kind: 'folder', modifiedAt: '2026-08-11 09:14' },
    { name: 'Program Files', path: '/Program Files', kind: 'folder', modifiedAt: '2026-09-02 21:40' },
    { name: 'Games', path: '/Games', kind: 'folder', modifiedAt: '2026-07-19 12:05' },
  ],
  '/Users': [
    { name: 'APEX', path: '/Users/APEX', kind: 'folder', modifiedAt: '2026-09-28 18:02' },
    { name: 'Public', path: '/Users/Public', kind: 'folder', modifiedAt: '2026-01-04 08:00' },
  ],
  '/Users/APEX': [
    { name: 'Desktop', path: '/Users/APEX/Desktop', kind: 'folder', modifiedAt: '2026-09-28 17:41' },
    { name: 'Downloads', path: '/Users/APEX/Downloads', kind: 'folder', modifiedAt: '2026-09-27 22:18' },
    { name: 'Documents', path: '/Users/APEX/Documents', kind: 'folder', modifiedAt: '2026-09-25 11:32' },
    { name: 'Pictures', path: '/Users/APEX/Pictures', kind: 'folder', modifiedAt: '2026-09-20 19:07' },
    { name: 'Videos', path: '/Users/APEX/Videos', kind: 'folder', modifiedAt: '2026-09-14 20:55' },
  ],
  '/Users/APEX/Desktop': [
    { name: 'apex-dashboard.url', path: '/Users/APEX/Desktop/apex-dashboard.url', kind: 'file', sizeBytes: 128, modifiedAt: '2026-09-28 10:02' },
    { name: 'render-queue.txt', path: '/Users/APEX/Desktop/render-queue.txt', kind: 'file', sizeBytes: 2048, modifiedAt: '2026-09-27 23:11' },
    { name: 'OBS Shortcuts', path: '/Users/APEX/Desktop/OBS Shortcuts', kind: 'folder', modifiedAt: '2026-09-26 15:44' },
  ],
  '/Users/APEX/Downloads': [
    { name: 'installer-1.4.0.exe', path: '/Users/APEX/Downloads/installer-1.4.0.exe', kind: 'file', sizeBytes: 84_654_592, modifiedAt: '2026-09-27 22:18' },
    { name: 'wallpaper-pack.zip', path: '/Users/APEX/Downloads/wallpaper-pack.zip', kind: 'file', sizeBytes: 214_958_080, modifiedAt: '2026-09-26 18:02' },
  ],
  '/Users/APEX/Documents': [
    { name: 'notes.md', path: '/Users/APEX/Documents/notes.md', kind: 'file', sizeBytes: 5120, modifiedAt: '2026-09-25 11:32' },
    { name: 'budget.xlsx', path: '/Users/APEX/Documents/budget.xlsx', kind: 'file', sizeBytes: 44_032, modifiedAt: '2026-09-22 09:10' },
  ],
  '/Users/APEX/Pictures': [
    { name: 'screenshot-001.png', path: '/Users/APEX/Pictures/screenshot-001.png', kind: 'file', sizeBytes: 2_411_724, modifiedAt: '2026-09-20 19:07' },
    { name: 'screenshot-002.png', path: '/Users/APEX/Pictures/screenshot-002.png', kind: 'file', sizeBytes: 3_002_211, modifiedAt: '2026-09-20 19:09' },
  ],
  '/Users/APEX/Videos': [
    { name: 'capture-01.mp4', path: '/Users/APEX/Videos/capture-01.mp4', kind: 'file', sizeBytes: 512_000_000, modifiedAt: '2026-09-14 20:55' },
  ],
  '/Games': [
    { name: 'SteamLibrary', path: '/Games/SteamLibrary', kind: 'folder', modifiedAt: '2026-07-19 12:05' },
    { name: 'Epic', path: '/Games/Epic', kind: 'folder', modifiedAt: '2026-06-02 16:41' },
  ],
}

/* ------------------------------------------------------------------------- */
/* request handling                                                          */
/* ------------------------------------------------------------------------- */

function ok<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify({ ok: true, data }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function fail(message: string, status = 400): Response {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function jsonBody(body: unknown): Record<string, unknown> {
  if (!body) return {}
  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as Record<string, unknown>
    } catch {
      return {}
    }
  }
  return body as Record<string, unknown>
}

function pushRecent(id: string) {
  state.recent = [{ id, at: Date.now() }, ...state.recent.filter((r) => r.id !== id)].slice(0, 8)
}

function record(message: string) {
  state.log = [message, ...state.log].slice(0, 40)
}

/**
 * Handles one simulated request. Returns `null` for unknown routes so the
 * caller can surface a 404 (the real server does the same).
 */
export function handleMockRequest(method: string, url: string, body?: unknown): Response | null {
  ensureTimer()
  const parsed = new URL(url, 'http://mock.local')
  const path = parsed.pathname.replace(/\/+$/, '') || '/'
  const query = parsed.searchParams
  const payload = jsonBody(body)

  // --- telemetry ----------------------------------------------------------
  if (path === '/api/status' && method === 'GET') return ok(statusResponse())

  if (path === '/api/system/stats' && method === 'GET') return ok(statsResponse())

  if (path === '/api/system/processes' && method === 'GET') {
    return ok(
      [...state.processes].sort((a, b) => b.cpu - a.cpu).slice(0, 8),
    )
  }

  // --- system actions -----------------------------------------------------
  const actionMap: Record<string, string> = {
    '/api/system/lock': 'Workstation locked',
    '/api/system/sleep': 'Entering sleep',
    '/api/system/restart': 'Restarting in 10 seconds',
    '/api/system/shutdown': 'Shutting down in 10 seconds',
    '/api/system/display-off': 'Display turned off',
    '/api/system/wake-on-lan': 'Magic packet sent',
    '/api/system/screenshot': 'Screenshot saved to Pictures',
    '/api/system/empty-recycle-bin': 'Recycle Bin emptied',
  }

  if (method === 'POST' && actionMap[path]) {
    const message = actionMap[path]
    record(message)
    return ok({ ok: true, message })
  }

  // --- apps ---------------------------------------------------------------
  if (path === '/api/apps' && method === 'GET') {
    return ok([
      { id: 'chrome', name: 'Chrome', running: true },
      { id: 'vscode', name: 'VS Code', running: true },
      { id: 'discord', name: 'Discord', running: true },
      { id: 'spotify', name: 'Spotify', running: true },
      { id: 'files', name: 'File Explorer', running: true },
    ])
  }

  if (path === '/api/apps/launch' && method === 'POST') {
    const app = String(payload.app ?? '')
    if (!app) return fail('Missing "app" in request body', 422)
    pushRecent(app)
    record(`Launch request: ${app}`)
    return ok({ ok: true, app, message: `Launching ${app}` })
  }

  if (path === '/api/apps/close' && method === 'POST') {
    const app = String(payload.app ?? '')
    if (!app) return fail('Missing "app" in request body', 422)
    record(`Close request: ${app}`)
    return ok({ ok: true, app, message: `Closing ${app}` })
  }

  if (path === '/api/apps/recent' && method === 'GET') {
    return ok(state.recent.map((r) => ({ id: r.id, at: r.at })))
  }

  // --- media --------------------------------------------------------------
  if (path === '/api/media' && method === 'GET') return ok(mediaResponse())

  if (path === '/api/media/queue' && method === 'GET') {
    return ok({
      index: state.media.queueIndex,
      items: state.media.playlist.map((track) => ({
        title: track.title,
        artist: track.artist,
        durationSec: track.durationSec,
      })),
    })
  }

  if (path === '/api/media/play-pause' && method === 'POST') {
    state.media.isPlaying = !state.media.isPlaying
    return ok({ isPlaying: state.media.isPlaying })
  }

  if (path === '/api/media/previous' && method === 'POST') {
    previousTrack()
    return ok({ positionSec: state.media.positionSec })
  }

  if (path === '/api/media/next' && method === 'POST') {
    nextTrack()
    return ok({ positionSec: state.media.positionSec })
  }

  if (path === '/api/media/volume' && method === 'POST') {
    const value = Number(payload.value ?? payload.volume)
    if (Number.isNaN(value)) return fail('Missing "value" in request body', 422)
    state.media.volume = clamp(Math.round(value), 0, 100)
    state.media.muted = state.media.volume === 0
    return ok({ volume: state.media.volume, muted: state.media.muted })
  }

  if (path === '/api/media/mute' && method === 'POST') {
    state.media.muted = payload.muted === undefined ? !state.media.muted : Boolean(payload.muted)
    return ok({ muted: state.media.muted })
  }

  if (path === '/api/media/seek' && method === 'POST') {
    const value = Number(payload.positionSec ?? payload.value)
    if (Number.isNaN(value)) return fail('Missing "positionSec" in request body', 422)
    state.media.positionSec = clamp(value, 0, state.media.durationSec)
    return ok({ positionSec: state.media.positionSec })
  }

  if (path === '/api/media/source' && method === 'POST') {
    const source = String(payload.source ?? '')
    if (!source) return fail('Missing "source" in request body', 422)
    state.media.source = source
    return ok({ source })
  }

  // --- files --------------------------------------------------------------
  if (path === '/api/files' && method === 'GET') {
    const dir = query.get('path') ?? '/'
    const nodes = FILE_TREE[dir]
    if (!nodes) return fail(`Path not found: ${dir}`, 404)
    return ok({ path: dir, nodes })
  }

  if (path === '/api/files/open' && method === 'POST') {
    const target = String(payload.path ?? '')
    if (!target) return fail('Missing "path" in request body', 422)
    record(`Open path: ${target}`)
    return ok({ ok: true, path: target, message: `Opening ${target}` })
  }

  if (path === '/api/files/download' && method === 'POST') {
    const target = String(payload.path ?? '')
    if (!target) return fail('Missing "path" in request body', 422)
    record(`Download queued: ${target}`)
    return ok({ ok: true, path: target, message: `Preparing ${target.split('/').pop()}` })
  }

  // --- tools --------------------------------------------------------------
  if (path === '/api/tools/clipboard' && method === 'POST') {
    const text = String(payload.text ?? '')
    record('Clipboard updated')
    return ok({ ok: true, length: text.length, message: 'Clipboard updated' })
  }

  if (path === '/api/tools/notify' && method === 'POST') {
    const title = String(payload.title ?? 'APEX CONTROL')
    const message = String(payload.message ?? '')
    record(`Notification: ${title}`)
    return ok({ ok: true, title, message, delivered: true })
  }

  return null
}

/* ------------------------------------------------------------------------- */
/* fetch-like entry point                                                    */
/* ------------------------------------------------------------------------- */

const LATENCY = [90, 260] as const

export interface MockFetchOptions {
  method?: string
  body?: unknown
  signal?: AbortSignal
}

/** Mimics `fetch` closely enough for the API client to stay transport-agnostic. */
export function mockFetch(url: string, options: MockFetchOptions = {}): Promise<Response> {
  const method = (options.method ?? 'GET').toUpperCase()
  const body =
    typeof options.body === 'string' || options.body == null
      ? (options.body as string | undefined)
      : JSON.stringify(options.body)

  const delay = LATENCY[0] + Math.random() * (LATENCY[1] - LATENCY[0])

  return new Promise<Response>((resolve, reject) => {
    const id = setTimeout(() => {
      const response = handleMockRequest(method, url, body)
      resolve(response ?? fail(`Unknown endpoint: ${method} ${url}`, 404))
    }, delay)

    options.signal?.addEventListener('abort', () => {
      clearTimeout(id)
      reject(new DOMException('Aborted', 'AbortError'))
    })
  })
}

/** Test/debug helper: wipe the simulation and start over. */
export function resetMockServer() {
  resetState()
}
