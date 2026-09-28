import { useState } from 'react'
import {
  Activity,
  Gauge,
  Link2,
  Maximize,
  Palette,
  RefreshCw,
  RotateCcw,
  Settings2,
  ShieldCheck,
  Wifi,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { formatRelativeTime } from '@/utils/format'
import { api } from '@/services/api'
import { ACCENTS, THEMES, useSettings } from '@/hooks/useSettings'
import { useConnection } from '@/hooks/useConnection'
import { useToast } from '@/hooks/useToast'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { Switch } from '@/components/ui/Switch'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'

const INTERVALS = [
  { value: '2000', label: '2 s' },
  { value: '5000', label: '5 s' },
  { value: '10000', label: '10 s' },
  { value: '30000', label: '30 s' },
]

/** Dashboard preferences (persisted in localStorage) + connection diagnostics. */
export function SettingsPage() {
  const { settings, update, patch, reset, apiBaseUrl, isFullscreen, toggleFullscreen } = useSettings()
  const { state, status, error, latencyMs, lastCheckedAt, attempts, refresh } = useConnection()
  const [resetOpen, setResetOpen] = useState(false)
  const toast = useToast()
  const [testing, setTesting] = useState(false)

  const resolvedUrl = settings.demoMode ? 'simulated PC (demo mode)' : apiBaseUrl || 'same origin (relative /api)'

  /**
   * Probes the *configured* PC address, bypassing demo mode so the result is
   * honest. On success the dashboard switches to live mode.
   */
  const testConnection = async () => {
    const host = settings.pcAddress.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '')
    if (!host) {
      toast.error('Enter the PC address first', 'Use the IP or hostname of APEX on your network')
      return
    }
    const url = host.startsWith('http') ? host : `http://${host}:${settings.port.trim() || '8080'}`
    setTesting(true)
    api.configure({ baseUrl: url, demoMode: false })
    try {
      const result = await api.getStatus()
      update('demoMode', false)
      toast.success('PC reachable', `${result.hostname} · ${result.ipAddress} · ${result.os}`)
    } catch (error) {
      toast.error(
        'Cannot reach the PC',
        error instanceof Error ? error.message : `No response from ${url}`,
      )
    } finally {
      // restore the configured transport (demo mode stays untouched on failure)
      api.configure({ baseUrl: settings.demoMode ? '' : apiBaseUrl, demoMode: settings.demoMode })
      await refresh()
      setTesting(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-5">
      <PageHeader
        title="Settings"
        description="Preferences are stored in this browser's localStorage and applied instantly."
        icon={<Settings2 className="h-5 w-5" />}
        actions={
          <Button size="sm" variant="ghost" icon={<RotateCcw className="h-4 w-4" />} onClick={() => setResetOpen(true)}>
            Reset all
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
        {/* connection ------------------------------------------------------ */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <Card>
            <CardHeader
              title="PC connection"
              icon={<Link2 className="h-5 w-5" />}
              subtitle="Address of the Flask control server on APEX"
              action={<Badge tone={state === 'online' ? 'success' : state === 'connecting' ? 'warning' : 'danger'}>{state}</Badge>}
            />

            <div className="grid gap-3 sm:grid-cols-5">
              <TextField
                label="PC address"
                value={settings.pcAddress}
                onChange={(value) => update('pcAddress', value)}
                placeholder="192.168.1.8"
                inputMode="url"
                hint="IP or hostname of APEX on your Wi-Fi"
                className="sm:col-span-3"
              />
              <TextField
                label="Port"
                value={settings.port}
                onChange={(value) => update('port', value.replace(/[^0-9]/g, ''))}
                placeholder="8080"
                inputMode="numeric"
                maxLength={5}
                className="sm:col-span-2"
              />
            </div>

            <div className="mt-3 glass-inset flex flex-wrap items-center gap-2 rounded-2xl px-3.5 py-3">
              <span className="label-xs">Resolved base URL</span>
              <code className="num text-[12px] text-accent">{resolvedUrl}</code>
            </div>

            <div className="mt-2 divide-y divide-white/8">
              <Switch
                checked={settings.demoMode}
                onChange={(value) => update('demoMode', value)}
                label="Demo mode (simulated PC)"
                description="Serve realistic placeholder telemetry from the browser instead of calling the PC."
              />
              <Switch
                checked={settings.autoReconnect}
                onChange={(value) => update('autoReconnect', value)}
                label="Auto reconnect"
                description="Keep polling /api/status and back off gently while APEX is unreachable."
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="primary"
                loading={testing}
                onClick={() => void testConnection()}
                icon={<Wifi className="h-4 w-4" />}
              >
                Test connection
              </Button>
              <Button variant="glass" onClick={() => void refresh()} icon={<RefreshCw className="h-4 w-4" />}>
                Refresh now
              </Button>
            </div>
          </Card>

          <Card>
            <CardHeader title="Diagnostics" icon={<Activity className="h-5 w-5" />} subtitle="What the dashboard can see right now" />
            <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {[
                { label: 'State', value: state },
                { label: 'Hostname', value: status?.hostname ?? '—' },
                { label: 'IP address', value: status?.ipAddress ?? '—' },
                { label: 'OS', value: status?.os ?? '—' },
                { label: 'Server', value: status?.serverVersion ?? '—' },
                { label: 'Latency', value: latencyMs !== null ? `${Math.round(latencyMs)} ms` : '—' },
                { label: 'Last check', value: lastCheckedAt ? formatRelativeTime(lastCheckedAt) : '—' },
                { label: 'Failed attempts', value: String(attempts) },
                { label: 'Wi-Fi', value: status?.wifi.connected ? status.wifi.ssid : 'offline' },
              ].map((row) => (
                <div key={row.label} className="glass-soft rounded-2xl px-3 py-2.5">
                  <dt className="label-xs">{row.label}</dt>
                  <dd className="num mt-1 truncate text-[13px] font-semibold text-slate-100">{row.value}</dd>
                </div>
              ))}
            </dl>
            {error ? <p className="mt-3 text-[12px] leading-relaxed text-rose-300">{error}</p> : null}
          </Card>

          <Card>
            <CardHeader title="Polling" icon={<Gauge className="h-5 w-5" />} subtitle="How often the dashboard asks for fresh data" />
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { key: 'statusPollMs' as const, label: 'Status', value: settings.statusPollMs },
                { key: 'statsPollMs' as const, label: 'System stats', value: settings.statsPollMs },
                { key: 'mediaPollMs' as const, label: 'Media state', value: settings.mediaPollMs },
              ].map((row) => (
                <label key={row.key} className="glass-soft flex flex-col gap-1.5 rounded-2xl px-3 py-2.5">
                  <span className="label-xs">{row.label}</span>
                  <select
                    value={String(row.value)}
                    onChange={(event) => update(row.key, Number(event.target.value))}
                    className="h-11 rounded-xl border border-white/10 bg-black/30 px-2.5 text-sm font-semibold text-slate-100"
                  >
                    {INTERVALS.map((interval) => (
                      <option key={interval.value} value={interval.value}>
                        every {interval.label}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </Card>
        </div>

        {/* appearance ------------------------------------------------------ */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <Card>
            <CardHeader title="Appearance" icon={<Palette className="h-5 w-5" />} subtitle="Theme and accent lighting" />

            <span className="label-xs mb-2 block">Interface theme</span>
            <div className="grid grid-cols-2 gap-2">
              {THEMES.map((theme) => (
                <button
                  key={theme.key}
                  type="button"
                  onClick={() => update('theme', theme.key)}
                  aria-pressed={settings.theme === theme.key}
                  className={cn(
                    'press flex min-h-[68px] flex-col items-start gap-0.5 rounded-2xl border px-3 py-2.5 text-left transition',
                    settings.theme === theme.key
                      ? 'border-accent/50 bg-accent/10'
                      : 'border-white/10 bg-white/5 hover:border-white/25',
                  )}
                >
                  <span className="text-[13px] font-semibold text-slate-100">{theme.label}</span>
                  <span className="text-[10px] leading-tight text-slate-500">{theme.description}</span>
                </button>
              ))}
            </div>

            <span className="label-xs mb-2 mt-4 block">Accent colour</span>
            <div className="flex flex-wrap gap-2.5">
              {ACCENTS.map((accent) => (
                <button
                  key={accent.key}
                  type="button"
                  onClick={() => update('accent', accent.key)}
                  aria-label={`${accent.label} accent`}
                  aria-pressed={settings.accent === accent.key}
                  className={cn(
                    'press h-12 w-12 rounded-2xl border-2 transition',
                    settings.accent === accent.key ? 'scale-110 border-white/80' : 'border-white/15 hover:border-white/40',
                  )}
                  style={{ background: `linear-gradient(140deg, rgb(${accent.rgb}), rgb(${accent.rgb2}))` }}
                />
              ))}
            </div>

            <div className="mt-4 divide-y divide-white/8">
              <Switch
                checked={settings.sidebarCollapsed}
                onChange={(value) => update('sidebarCollapsed', value)}
                label="Collapsed navigation rail"
                description="Show icons only - more room for the dashboard."
              />
              <Switch
                checked={settings.reduceMotion}
                onChange={(value) => update('reduceMotion', value)}
                label="Reduce motion"
                description="Disable card, page and status animations."
              />
              <Switch
                checked={settings.hapticFeedback}
                onChange={(value) => update('hapticFeedback', value)}
                label="Haptic feedback"
                description="Short vibration on button presses where supported."
              />
            </div>
          </Card>

          <Card>
            <CardHeader title="Dashboard" icon={<Maximize className="h-5 w-5" />} subtitle="Naming and behaviour" />
            <TextField
              label="Dashboard name"
              value={settings.dashboardName}
              onChange={(value) => update('dashboardName', value)}
              placeholder="APEX CONTROL"
              maxLength={24}
            />
            <div className="mt-2 divide-y divide-white/8">
              <Switch
                checked={settings.confirmShutdown}
                onChange={(value) => update('confirmShutdown', value)}
                label="Confirm before shutdown / restart"
                description="Ask for confirmation on destructive power actions."
              />
              <Switch
                checked={settings.fullscreen}
                onChange={(value) => update('fullscreen', value)}
                label="Fullscreen mode"
                description="Hide browser chrome - ideal for a wall-mounted tablet."
              />
            </div>
            <div className="mt-3">
              <Button variant="glass" onClick={toggleFullscreen} icon={<Maximize className="h-4 w-4" />}>
                {isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              </Button>
            </div>
          </Card>

          <Card className="border-emerald-400/20">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-emerald-400/25 bg-emerald-400/10 text-emerald-300">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-[15px] font-semibold text-slate-100">Backend contract</h2>
                <p className="mt-1 text-[13px] leading-relaxed text-slate-400">
                  The Flask server on APEX only needs to expose the endpoints listed in{' '}
                  <code className="text-accent">src/services/endpoints.ts</code> and answer with{' '}
                  <code className="text-accent">{'{ ok: true, data: … }'}</code>. Set{' '}
                  <code className="text-accent">VITE_API_URL</code> (or the fields above) and this dashboard talks to it
                  directly - no code changes required.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Reset every preference?"
        description="Theme, accent, connection settings and pinned apps return to their defaults. Your shortcuts are removed."
        footer={
          <>
            <button
              type="button"
              onClick={() => setResetOpen(false)}
              className="press glass-soft inline-flex min-h-[48px] items-center justify-center rounded-2xl px-5 text-sm font-medium text-slate-200 hover:bg-white/10"
            >
              Keep settings
            </button>
            <button
              type="button"
              onClick={() => {
                reset()
                patch({ demoMode: true })
                setResetOpen(false)
              }}
              className="press inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-rose-400/40 bg-gradient-to-b from-rose-500 to-rose-600 px-5 text-sm font-semibold text-white"
            >
              Reset everything
            </button>
          </>
        }
      />
    </div>
  )
}
