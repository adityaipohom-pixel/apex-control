import { History, Trash2 } from 'lucide-react'
import { formatRelativeTime } from '@/utils/format'
import { useApps } from '@/hooks/useApps'
import { AppCard } from './AppCard'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { EmptyState } from '@/components/ui/EmptyState'

/** Recently launched shortcuts, stored locally and mirrored by the backend. */
export function RecentApps() {
  const { recent, launching, launch } = useApps()

  return (
    <section aria-label="Recent apps">
      <SectionHeader
        title="Recent Apps"
        icon={<History className="h-4 w-4" />}
        action={
          recent.length > 0 ? (
            <span className="text-[11px] text-slate-500">{recent.length} tracked</span>
          ) : null
        }
      />

      {recent.length === 0 ? (
        <EmptyState
          icon={<History className="h-6 w-6" />}
          title="Nothing launched yet"
          description="Apps you open from this dashboard will show up here for one-tap relaunch."
        />
      ) : (
        <div className="glass rounded-3xl p-3">
          <div className="hide-scrollbar flex gap-3 overflow-x-auto scroll-touch">
            {recent.map((entry) => (
              <div key={entry.app.id} className="flex flex-col items-center gap-1">
                <AppCard app={entry.app} compact launching={launching === entry.app.id} onLaunch={(id) => void launch(id)} />
                <span className="text-[10px] text-slate-600">{formatRelativeTime(entry.at)}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 flex items-center gap-1.5 border-t border-white/8 pt-2 text-[11px] text-slate-500">
            <Trash2 className="h-3 w-3" />
            History stays on this tablet - the PC never sees it.
          </p>
        </div>
      )}
    </section>
  )
}
