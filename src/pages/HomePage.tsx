import { useSystemStats } from '@/hooks/useSystemStats'
import { useMedia } from '@/hooks/useMedia'
import { useSystemActions } from '@/hooks/useSystemActions'
import { useConnection } from '@/hooks/useConnection'
import { HeroBanner } from '@/components/dashboard/HeroBanner'
import { QuickApps } from '@/components/dashboard/QuickApps'
import { SystemMonitor } from '@/components/dashboard/SystemMonitor'
import { SystemActions } from '@/components/dashboard/SystemActions'
import { MediaControl } from '@/components/dashboard/MediaControl'
import { VolumeControl } from '@/components/dashboard/VolumeControl'
import { LiveInfo } from '@/components/dashboard/LiveInfo'
import { RecentApps } from '@/components/dashboard/RecentApps'

/** Home dashboard - optimised for tablet landscape, stacks in portrait. */
export function HomePage() {
  const { stats, history, loading: statsLoading, stale } = useSystemStats()
  const media = useMedia()
  const systemActions = useSystemActions()
  const { status } = useConnection()

  return (
    <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-4 lg:gap-5">
      <HeroBanner />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
        <div className="lg:col-span-7 xl:col-span-8">
          <QuickApps />
        </div>
        <div className="lg:col-span-5 xl:col-span-4">
          <SystemMonitor stats={stats} history={history} loading={statsLoading} stale={stale} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
        <div className="lg:col-span-7 xl:col-span-8">
          <SystemActions pending={systemActions.pending} onAction={(key) => systemActions[key]()} />
        </div>
        <div className="lg:col-span-5 xl:col-span-4">
          <VolumeControl controller={media} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
        <div className="lg:col-span-7 xl:col-span-8">
          <LiveInfo status={status} stats={stats} loading={statsLoading} />
        </div>
        <div className="lg:col-span-5 xl:col-span-4">
          <MediaControl controller={media} />
        </div>
      </div>

      <RecentApps />
    </div>
  )
}
