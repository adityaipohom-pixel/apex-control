import { Activity, Clock, Globe, Link2, Thermometer, Timer, Wifi } from 'lucide-react'
import { cn } from '@/utils/cn'
import { formatSpeed, formatUptime } from '@/utils/format'
import type { StatusResponse, SystemStats } from '@/types/api'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'

export interface LiveInfoProps {
  status: StatusResponse | null;
  stats: SystemStats | null;
  loading?: boolean;
  className?: string;
}

/** Live PC information tiles: Wi-Fi, IP, uptime, temperature, network, latency. */
export function LiveInfo({ status, stats, loading = false, className }: LiveInfoProps) {
  const wifi = status?.wifi
  const uptime = stats?.uptimeSec ?? status?.uptimeSec ?? 0
  const latency = stats?.latencyMs ?? status?.latencyMs ?? null

  const tiles = [
    {
      key: 'wifi',
      icon: <Wifi className="h-4 w-4" />,
      label: 'Wi-Fi',
      value: wifi?.connected ? wifi.ssid : 'Disconnected',
      meta: wifi?.connected ? `${wifi.linkSpeedMbps ?? wifi.signal} Mbps` : 'No link',
      tone: wifi?.connected ? 'text-emerald-300' : 'text-rose-300',
    },
    {
      key: 'ip',
      icon: <Globe className="h-4 w-4" />,
      label: 'IP Address',
      value: status?.ipAddress ?? '—',
      meta: status?.os ?? 'unknown OS',
      tone: 'text-sky-300',
    },
    {
      key: 'uptime',
      icon: <Timer className="h-4 w-4" />,
      label: 'Uptime',
      value: uptime > 0 ? formatUptime(uptime) : '—',
      meta: 'since boot',
      tone: 'text-violet-300',
    },
    {
      key: 'temp',
      icon: <Thermometer className="h-4 w-4" />,
      label: 'CPU Temp',
      value: stats?.cpu.temperatureC !== undefined ? `${Math.round(stats.cpu.temperatureC)}°C` : '—',
      meta: stats?.cpu.temperatureC !== undefined ? (stats.cpu.temperatureC > 75 ? 'hot' : 'normal') : 'no sensor',
      tone: stats && stats.cpu.temperatureC !== undefined && stats.cpu.temperatureC > 75 ? 'text-amber-300' : 'text-emerald-300',
    },
    {
      key: 'net',
      icon: <Activity className="h-4 w-4" />,
      label: 'Network',
      value: stats ? formatSpeed(stats.network.downloadMbps) : '—',
      meta: stats ? `↑ ${formatSpeed(stats.network.uploadMbps)}` : 'no data',
      tone: 'text-accent',
    },
    {
      key: 'latency',
      icon: <Clock className="h-4 w-4" />,
      label: 'Latency',
      value: latency !== null ? `${Math.round(latency)} ms` : '—',
      meta: 'round trip',
      tone: latency !== null && latency < 20 ? 'text-emerald-300' : 'text-amber-300',
    },
  ]

  return (
    <Card className={className}>
      <CardHeader
        title="Live Info"
        icon={<Link2 className="h-5 w-5" />}
        subtitle="Telemetry from APEX"
        action={<Badge tone={status ? 'success' : 'danger'}>{status ? 'Streaming' : 'No data'}</Badge>}
      />

      {loading && !status ? (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <Skeleton key={index} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {tiles.map((tile) => (
            <div key={tile.key} className="glass-soft flex flex-col gap-1.5 rounded-2xl px-3 py-3">
              <div className="flex items-center gap-2">
                <span className={cn('shrink-0', tile.tone)}>{tile.icon}</span>
                <span className="label-xs truncate">{tile.label}</span>
              </div>
              <p className="num truncate text-[15px] font-semibold leading-tight text-slate-50">{tile.value}</p>
              <p className="truncate text-[11px] text-slate-500">{tile.meta}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
