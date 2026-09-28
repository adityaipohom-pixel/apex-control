/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the Flask control server on the APEX PC (no trailing slash). */
  readonly VITE_API_URL?: string
  /** 'true' | 'false' - force simulated PC data on or off. */
  readonly VITE_DEMO_MODE?: string
  /** Status poll interval in ms. */
  readonly VITE_STATUS_POLL_MS?: string
  /** System stats poll interval in ms. */
  readonly VITE_STATS_POLL_MS?: string
  readonly VITE_MEDIA_POLL_MS?: string
  /** Per-request timeout in milliseconds (default 8000). */
  readonly VITE_API_TIMEOUT_MS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
