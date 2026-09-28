import { useMemo, useState } from 'react'
import {
  AppWindow,
  Check,
  ChevronLeft,
  ChevronRight,
  Pin,
  PinOff,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import {
  CATEGORY_LABEL,
  ICON_CHOICES,
  TINT_CHOICES,
  useApps,
} from '@/hooks/useApps'
import type { AppCategory } from '@/types/api'
import { PageHeader } from '@/components/layout/PageHeader'
import { AppCard } from '@/components/dashboard/AppCard'
import { Button, IconButton } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { AppIcon } from '@/components/ui/AppIcon'
import { Badge } from '@/components/ui/Badge'

const CATEGORY_OPTIONS = (Object.keys(CATEGORY_LABEL) as Array<AppCategory | 'all'>).map((key) => ({
  value: key,
  label: CATEGORY_LABEL[key],
}))

export function AppsPage() {
  const {
    catalog,
    quickApps,
    launching,
    launch,
    addApp,
    removeApp,
    pinApp,
    unpinApp,
    moveApp,
    resetApps,
    isPinned,
  } = useApps()

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>('all')
  const [addOpen, setAddOpen] = useState(false)
  const [draft, setDraft] = useState({ name: '', description: '', icon: 'Rocket', tint: '#22D3EE' })

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return catalog.filter((app) => {
      const matchesQuery =
        needle === '' || app.name.toLowerCase().includes(needle) || app.description.toLowerCase().includes(needle)
      const matchesCategory = category === 'all' || app.category === category
      return matchesQuery && matchesCategory
    })
  }, [catalog, query, category])

  const submitDraft = () => {
    const name = draft.name.trim()
    if (!name) return
    const id = `custom-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`
    addApp({
      id,
      name,
      description: draft.description.trim() || 'Custom shortcut',
      icon: draft.icon,
      tint: draft.tint,
      category: 'custom',
    })
    setDraft({ name: '', description: '', icon: 'Rocket', tint: '#22D3EE' })
    setAddOpen(false)
  }

  return (
    <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-5">
      <PageHeader
        title="Apps"
        description="Launch anything on APEX with one tap. Executable paths are resolved on the PC, never in the browser."
        icon={<AppWindow className="h-5 w-5" />}
        actions={
          <>
            <Button size="sm" variant="ghost" icon={<RotateCcw className="h-4 w-4" />} onClick={resetApps}>
              Reset
            </Button>
            <Button size="sm" variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setAddOpen(true)}>
              Add App
            </Button>
          </>
        }
      />

      {/* pinned ------------------------------------------------------------ */}
      <section aria-label="Pinned apps">
        <SectionHeader
          title="Quick Apps"
          icon={<Pin className="h-4 w-4" />}
          action={<span className="text-[11px] text-slate-500">{quickApps.length} pinned</span>}
        />
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3 lg:grid-cols-6">
          {quickApps.map((app, index) => (
            <div key={app.id} className="relative">
              <AppCard app={app} launching={launching === app.id} onLaunch={(id) => void launch(id)} />
              <div className="mt-1.5 flex items-center justify-center gap-1">
                <IconButton
                  label={`Move ${app.name} left`}
                  size="sm"
                  className="!h-9 !w-9"
                  disabled={index === 0}
                  onClick={() => moveApp(app.id, -1)}
                  icon={<ChevronLeft className="h-4 w-4" />}
                />
                <IconButton
                  label={`Unpin ${app.name}`}
                  size="sm"
                  className="!h-9 !w-9"
                  onClick={() => unpinApp(app.id)}
                  icon={<PinOff className="h-4 w-4" />}
                />
                <IconButton
                  label={`Move ${app.name} right`}
                  size="sm"
                  className="!h-9 !w-9"
                  disabled={index === quickApps.length - 1}
                  onClick={() => moveApp(app.id, 1)}
                  icon={<ChevronRight className="h-4 w-4" />}
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="press glass-soft flex min-h-[124px] flex-col items-center justify-center gap-2.5 rounded-3xl border-dashed px-3 py-4 text-slate-500 hover:border-accent/40 hover:text-accent"
          >
            <span className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/5">
              <Plus className="h-7 w-7" />
            </span>
            <span className="text-[13px] font-semibold">Add App</span>
            <span className="text-[11px]">Custom Shortcut</span>
          </button>
        </div>
      </section>

      {/* library ----------------------------------------------------------- */}
      <section aria-label="App library">
        <SectionHeader
          title="Library"
          icon={<Search className="h-4 w-4" />}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search apps"
                  aria-label="Search apps"
                  className="glass-soft h-11 w-44 rounded-2xl pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-accent/50"
                />
              </div>
              <Select value={category} onChange={setCategory} options={CATEGORY_OPTIONS} className="w-40" />
            </div>
          }
        />

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Search className="h-6 w-6" />}
            title="No apps match your filters"
            description="Try a different keyword or category."
          />
        ) : (
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3 lg:grid-cols-6">
            {filtered.map((app) => (
              <div key={app.id} className="relative">
                <AppCard app={app} launching={launching === app.id} onLaunch={(id) => void launch(id)} />
                <div className="mt-1.5 flex items-center justify-center gap-1.5">
                  {isPinned(app.id) ? (
                    <Badge tone="accent">
                      <Check className="h-3 w-3" /> Pinned
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="!min-h-9 !px-2.5 !text-[11px]"
                      icon={<Pin className="h-3.5 w-3.5" />}
                      onClick={() => pinApp(app.id)}
                    >
                      Pin
                    </Button>
                  )}
                  {!app.builtIn ? (
                    <IconButton
                      label={`Delete ${app.name}`}
                      size="sm"
                      tone="danger"
                      className="!h-9 !w-9"
                      onClick={() => removeApp(app.id)}
                      icon={<Trash2 className="h-4 w-4" />}
                    />
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* add app modal ----------------------------------------------------- */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add a custom shortcut"
        description="Give the shortcut a name and pick an icon. The PC decides what actually opens."
        footer={
          <>
            <button
              type="button"
              onClick={() => setAddOpen(false)}
              className="press glass-soft inline-flex min-h-[48px] items-center justify-center rounded-2xl px-5 text-sm font-medium text-slate-200 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submitDraft}
              disabled={draft.name.trim() === ''}
              className="press inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-accent/40 bg-gradient-to-b from-accent/90 to-accent/60 px-5 text-sm font-semibold text-slate-950 disabled:opacity-50"
            >
              Add shortcut
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <TextField
            label="App name"
            value={draft.name}
            onChange={(name) => setDraft((prev) => ({ ...prev, name }))}
            placeholder="e.g. Blender"
            maxLength={24}
          />
          <TextField
            label="Short description"
            value={draft.description}
            onChange={(description) => setDraft((prev) => ({ ...prev, description }))}
            placeholder="e.g. 3D modelling"
            maxLength={32}
          />

          <div>
            <span className="label-xs mb-1.5 block">Icon</span>
            <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
              {ICON_CHOICES.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setDraft((prev) => ({ ...prev, icon }))}
                  aria-label={`Use ${icon} icon`}
                  aria-pressed={draft.icon === icon}
                  className={cn(
                    'press grid h-12 w-12 shrink-0 place-items-center rounded-2xl border transition',
                    draft.icon === icon
                      ? 'border-accent/50 bg-accent/15 text-accent'
                      : 'border-white/10 bg-white/5 text-slate-400 hover:text-slate-100',
                  )}
                >
                  <AppIcon name={icon} className="h-5 w-5" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="label-xs mb-1.5 block">Colour</span>
            <div className="flex flex-wrap gap-2">
              {TINT_CHOICES.map((tint) => (
                <button
                  key={tint}
                  type="button"
                  onClick={() => setDraft((prev) => ({ ...prev, tint }))}
                  aria-label={`Use colour ${tint}`}
                  aria-pressed={draft.tint === tint}
                  className={cn(
                    'h-11 w-11 rounded-2xl border transition',
                    draft.tint === tint ? 'scale-110 border-white/70' : 'border-white/15 hover:border-white/40',
                  )}
                  style={{ backgroundColor: tint }}
                />
              ))}
            </div>
          </div>

          <div className="glass-soft flex items-center gap-3 rounded-2xl p-3">
            <span
              className="grid h-11 w-11 place-items-center rounded-2xl"
              style={{ backgroundColor: `${draft.tint}26` }}
            >
              <AppIcon name={draft.icon} className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-100">{draft.name || 'Your app'}</p>
              <p className="truncate text-[11px] text-slate-500">{draft.description || 'Custom shortcut'}</p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
