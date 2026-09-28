import { Activity, ArrowDown, ArrowUp, Cpu, HardDrive, MemoryStick, Microchip, Thermometer } from 'lucide-react'
import { cn } from '@/utils/cn'
import { formatGb, formatSpeed } from '@/utils/format'
import type { SystemStats } from '@/types/api'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/Progress'
import { Skeleton } from '@/components/ui/Skeleton'
import { UsageRing } from '@/components/ui/UsageRing'
import { Sparkline } from '@/components/ui/Sparkline'

export interface SystemMonitorProps {
  stats: SystemStats | null;
  loading: boolean;
  stale?: boolean;
  history?: Array<{ cpu: number; ram: number; download: number; upload: number }>;
  variant?: 'home' | 'full';
}

/** CPU / RAM / Disk / GPU / Network panel. Consumes GET /api/system/stats. */
export function SystemMonitor({ stats, loading, stale = false, history = [], variant = 'home' }: SystemMonitorProps) {
  const disk = stats?.disks[0]

  if (loading && !stats) {
    return (
      <Card>
        <CardHeader title="System Monitor" icon={<Activity className="h-5 w-5" />} subtitle="Reading sensors…" />
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-24 w-full rounded-3xl" />
          ))}
        </div>
        <div className="mt-4 space-y-2">
          {[0, 1, 2, 3, 4].map((index) => (
            <Skeleton key={index} className="h-9 w-full rounded-2xl" />
          ))}
        </div>
      </Card>
    )
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader title="System Monitor" icon={<Activity className="h-5 w-5" />} subtitle="No telemetry" />
        <p className="text-sm text-slate-500">System statistics are unavailable while the PC is offline.</p>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader
        title="System Monitor"
        icon={<Activity className="h-5 w-5" />}
        subtitle={`${stats.cpu.model} · ${stats.cpu.cores}C / ${stats.cpu.threads}T`}
        action={stale ? <Badge tone="warning">Stale</Badge> : <Badge tone="success">Live</Badge>}
      />

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <UsageRing value={stats.cpu.usage} label="CPU" from="#22d3ee" to="#6366f1" />
        <UsageRing value={stats.ram.usage} label="RAM" from="#a855f7" to="#ec4899" />
        <UsageRing value={disk?.usage ?? 0} label="Disk" from="#34d399" to="#22d3ee" />
      </div>
      {variant === 'full' && history.length > 1 ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="label-xs mb-1">CPU load history</p>
            <Sparkline values={history.map((h) => h.cpu)} label="CPU load history" max={100} />
          </div>
          <div>
            <p className="label-xs mb-1">Network throughput</p>
            <Sparkline values={history.map((h) => h.download)} label="Download history" />
          </div>
        </div>
      ) : null}

      <dl className="mt-5 space-y-2">
        <StatRow
          icon={<Cpu className="h-4 w-4 text-cyan-300" />}
          label="CPU"
          value={stats.cpu.model}
          meta={`${stats.cpu.clockGhz?.toFixed(2) ?? '—'} GHz${stats.cpu.temperatureC !== undefined ? ` · ${Math.round(stats.cpu.temperatureC)}°C` : ''}`}
        />
        <StatRow
          icon={<MemoryStick className="h-4 w-4 text-violet-300" />}
          label="RAM"
          value={`${formatGb(stats.ram.usedGb)} / ${formatGb(stats.ram.totalGb)}`}
          meta={`${Math.round(stats.ram.usage)}% used`}
        />
        <StatRow
          icon={<Microchip className="h-4 w-4 text-sky-300" />}
          label="GPU"
          value={stats.gpu.model}
          meta={`${formatGb(stats.gpu.vramUsedGb)} / ${formatGb(stats.gpu.vramTotalGb)} VRAM${stats.gpu.temperatureC !== undefined ? ` · ${Math.round(stats.gpu.temperatureC)}°C` : ''}`}
        />
        {disk ? (
          <StatRow
            icon={<HardDrive className="h-4 w-4 text-emerald-300" />}
            label={`Disk ${disk.name}`}
            value={`${formatGb(disk.usedGb)} / ${formatGb(disk.totalGb)}`}
            meta={`${Math.round(disk.usage)}% used`}
          />
        ) : null}
        <div className="glass-soft flex items-center gap-3 rounded-2xl px-3 py-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/5 text-accent">
            <ArrowDown className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="label-xs">Network</p>
            <p className="truncate text-[13px] font-semibold text-slate-100">{stats.network.adapter}</p>
          </div>
          <div className="flex shrink-0 items-center gap-3 text-right">
            <span className="num flex items-center gap-1 text-[13px] font-semibold text-emerald-300">
              <ArrowDown className="h-3.5 w-3.5" />
              {formatSpeed(stats.network.downloadMbps)}
            </span>
            <span className="num flex items-center gap-1 text-[13px] font-semibold text-accent">
              <ArrowUp className="h-3.5 w-3.5" />
              {formatSpeed(stats.network.uploadMbps)}
            </span>
          </div>
        </div>
      </dl>

      {variant === 'full' && stats.disks.length > 1 ? (
        <div className="mt-4 space-y-3">
          {stats.disks.map((entry) => (
            <div key={entry.name}>
              <div className="mb-1.5 flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-300">Disk {entry.name}</span>
                <span className="num text-slate-500">
                  {formatGb(entry.usedGb)} / {formatGb(entry.totalGb)}
                </span>
              </div>
              <ProgressBar value={entry.usage} label={`Disk ${entry.name} usage`} />
            </div>
          ))}
        </div>
      ) : null}

      {stats.cpu.temperatureC !== undefined ? (
        <p className={cn('mt-4 flex items-center gap-1.5 text-[11px] text-slate-500')}>
          <Thermometer className="h-3.5 w-3.5" />
          CPU temperature {Math.round(stats.cpu.temperatureC)}°C · updated from GET /api/system/stats
        </p>
      ) : null}
    </Card>
  )
}

function StatRow({
  icon,
  label,
  value,
  meta,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  meta?: string;
}) {
  return (
    <div className="glass-soft flex items-center gap-3 rounded-2xl px-3 py-2.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/5">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="label-xs">{label}</p>
        <p className="truncate text-[13px] font-semibold text-slate-100">{value}</p>
      </div>
      {meta ? <span className="num shrink-0 text-[11px] text-slate-500">{meta}</span> : null}
    </div>
  )
}
