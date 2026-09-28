import { Camera, Lamp, Recycle, Satellite } from 'lucide-react'
import { useSystemStats } from '@/hooks/useSystemStats'
import { useSystemActions } from '@/hooks/useSystemActions'
import { PageHeader } from '@/components/layout/PageHeader'
import { SystemMonitor } from '@/components/dashboard/SystemMonitor'
import { SystemActions } from '@/components/dashboard/SystemActions'
import { LiveInfo } from '@/components/dashboard/LiveInfo'
import { useConnection } from '@/hooks/useConnection'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { ProgressBar } from '@/components/ui/Progress'
import { Skeleton } from '@/components/ui/Skeleton'

const EXTRA_TOOLS = [
  { key: 'displayOff' as const, label: 'Display off', hint: 'Blank the monitors', icon: Lamp },
  { key: 'screenshot' as const, label: 'Screenshot', hint: 'Save to Pictures', icon: Camera },
  { key: 'recycleBin' as const, label: 'Empty Recycle Bin', hint: 'Free up space', icon: Recycle },
  { key: 'wakeOnLan' as const, label: 'Wake on LAN', hint: 'Send magic packet', icon: Satellite },
]

/** System page: full telemetry, power actions and maintenance tools. */
export function SystemPage() {
  const { stats, history, processes, loading, stale } = useSystemStats()
  const actions = useSystemActions()
  const { status } = useConnection()

  return (
    <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-5">
      <PageHeader
        title="System"
        description="Live performance, power state and maintenance actions for APEX."
        icon={<Badge tone={stale ? 'warning' : 'success'}>{stale ? 'Stale data' : 'Streaming'}</Badge>}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
        <div className="lg:col-span-7">
          <SystemMonitor stats={stats} history={history} loading={loading} stale={stale} variant="full" />
        </div>
        <div className="lg:col-span-5 flex flex-col gap-4">
          <LiveInfo status={status} stats={stats} loading={loading} />
        </div>
      </div>

      <SystemActions pending={actions.pending} onAction={(key) => actions[key]()} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
        <div className="lg:col-span-7">
          <Card>
            <CardHeader
              title="Top processes"
              subtitle="Highest CPU consumers reported by the PC"
              action={<Badge tone="neutral">{processes.length} shown</Badge>}
            />
            {loading && processes.length === 0 ? (
              <div className="space-y-2">
                {[0, 1, 2, 3, 4].map((index) => (
                  <Skeleton key={index} className="h-10 w-full rounded-2xl" />
                ))}
              </div>
            ) : processes.length === 0 ? (
              <EmptyState
                icon={<Camera className="h-6 w-6" />}
                title="Process list unavailable"
                description="Connect to the PC to see the running processes."
              />
            ) : (
              <div className="space-y-2">
                {processes.map((process) => (
                  <div key={process.pid} className="glass-soft flex items-center gap-3 rounded-2xl px-3 py-2.5">
                    <span className="num w-12 shrink-0 text-[11px] text-slate-500">PID {process.pid}</span>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-slate-100">{process.name}</span>
                    <span className="num w-16 shrink-0 text-right text-[12px] text-accent">{process.cpu.toFixed(1)}%</span>
                    <span className="num hidden w-20 shrink-0 text-right text-[11px] text-slate-500 sm:block">
                      {process.memoryMb} MB
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="lg:col-span-5">
          <Card>
            <CardHeader title="Maintenance" subtitle="Predefined actions - no shell commands" />
            <div className="grid grid-cols-2 gap-2.5">
              {EXTRA_TOOLS.map((tool) => {
                const Icon = tool.icon
                const isPending = actions.pending === tool.key
                return (
                  <Button
                    key={tool.key}
                    variant="glass"
                    size="lg"
                    loading={isPending}
                    onClick={() => actions[tool.key]()}
                    icon={<Icon className="h-5 w-5" />}
                    className="!min-h-[84px] flex-col !gap-2"
                  >
                    <span className="flex flex-col items-center gap-0.5">
                      <span className="text-[13px] font-semibold">{tool.label}</span>
                      <span className="text-[10px] font-normal text-slate-500">{tool.hint}</span>
                    </span>
                  </Button>
                )
              })}
            </div>

            <div className="mt-4 glass-inset rounded-2xl p-3">
              <p className="label-xs mb-2">Memory pressure</p>
              <ProgressBar
                value={stats?.ram.usage ?? 0}
                label="RAM usage"
                barClassName={stats && stats.ram.usage > 85 ? 'from-rose-500/70 to-rose-400' : undefined}
              />
              <p className="num mt-2 text-[11px] text-slate-500">
                {stats ? `${stats.ram.usedGb.toFixed(1)} of ${stats.ram.totalGb} GB in use` : 'Waiting for telemetry'}
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
