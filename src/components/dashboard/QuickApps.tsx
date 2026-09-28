import { Plus, Rocket, SlidersHorizontal } from 'lucide-react'
import { useApps } from '@/hooks/useApps'
import { useRouter } from '@/hooks/useRouter'
import { AppCard } from './AppCard'
import { Button } from '@/components/ui/Button'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { EmptyState } from '@/components/ui/EmptyState'

/** Quick Apps grid shown on the home dashboard. */
export function QuickApps() {
  const { quickApps, launching, launch } = useApps()
  const { navigate } = useRouter()

  return (
    <section aria-label="Quick apps">
      <SectionHeader
        title="Quick Apps"
        icon={<Rocket className="h-4 w-4" />}
        action={
          <Button
            size="sm"
            variant="ghost"
            icon={<SlidersHorizontal className="h-4 w-4" />}
            onClick={() => navigate('apps')}
          >
            Customise
          </Button>
        }
      />

      {quickApps.length === 0 ? (
        <EmptyState
          icon={<Plus className="h-6 w-6" />}
          title="No shortcuts yet"
          description="Add your favourite apps from the Apps page to pin them here."
          action={
            <Button variant="primary" size="sm" onClick={() => navigate('apps')}>
              Browse apps
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3 md:grid-cols-4 xl:grid-cols-5">
          {quickApps.map((app) => (
            <AppCard key={app.id} app={app} launching={launching === app.id} onLaunch={(id) => void launch(id)} />
          ))}

          <button
            type="button"
            onClick={() => navigate('apps')}
            aria-label="Add a custom app shortcut"
            className="press glass-soft flex min-h-[124px] flex-col items-center justify-center gap-2.5 rounded-3xl border-dashed px-3 py-4 text-slate-500 transition hover:-translate-y-1 hover:border-accent/40 hover:text-accent"
          >
            <span className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/5">
              <Plus className="h-7 w-7" />
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-[13px] font-semibold leading-tight">Add App</span>
              <span className="text-[11px] leading-tight text-slate-500">Custom Shortcut</span>
            </span>
          </button>
        </div>
      )}
    </section>
  )
}
