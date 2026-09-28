/**
 * Central registry of every endpoint the dashboard is allowed to call.
 *
 * SECURITY: the frontend only ever uses these predefined, intent-scoped
 * routes. There is deliberately no generic "run command" endpoint - arbitrary
 * shell execution is impossible from the browser.
 */

export const API_ENDPOINTS = {
  // --- status / telemetry ---------------------------------------------------
  status: '/api/status',
  systemStats: '/api/system/stats',
  systemProcesses: '/api/system/processes',

  // --- system actions -------------------------------------------------------
  systemLock: '/api/system/lock',
  systemSleep: '/api/system/sleep',
  systemRestart: '/api/system/restart',
  systemShutdown: '/api/system/shutdown',
  systemDisplayOff: '/api/system/display-off',
  systemWakeOnLan: '/api/system/wake-on-lan',
  systemScreenshot: '/api/system/screenshot',
  systemEmptyRecycleBin: '/api/system/empty-recycle-bin',

  // --- apps ----------------------------------------------------------------
  apps: '/api/apps',
  appsLaunch: '/api/apps/launch',
  appsClose: '/api/apps/close',
  appsRecent: '/api/apps/recent',

  // --- media ---------------------------------------------------------------
  media: '/api/media',
  mediaPlayPause: '/api/media/play-pause',
  mediaPrevious: '/api/media/previous',
  mediaNext: '/api/media/next',
  mediaVolume: '/api/media/volume',
  mediaMute: '/api/media/mute',
  mediaSeek: '/api/media/seek',
  mediaSource: '/api/media/source',
  mediaQueue: '/api/media/queue',

  // --- files ---------------------------------------------------------------
  files: '/api/files',
  filesOpen: '/api/files/open',
  filesDownload: '/api/files/download',

  // --- tools ---------------------------------------------------------------
  toolsClipboard: '/api/tools/clipboard',
  toolsNotify: '/api/tools/notify',
} as const

export type EndpointKey = keyof typeof API_ENDPOINTS
