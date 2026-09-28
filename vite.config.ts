import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Backend (Python Flask server running on the APEX PC) that the Vite dev
// server proxies relative /api requests to. Override with APEX_API_TARGET.
const apiTarget = process.env.APEX_API_TARGET ?? 'http://127.0.0.1:8080'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // Listen on every interface so an Android tablet on the same Wi-Fi can
    // open http://<dev-machine-ip>:5173
    host: true,
    port: 5173,
    strictPort: false,
    // The dashboard is served through tunnel/preview hostnames, so allow any.
    allowedHosts: true,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: true,
    port: 4173,
    allowedHosts: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 900,
  },
})
