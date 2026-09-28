import { useState } from 'react'
import {
  Bell,
  ClipboardCopy,
  Gamepad2,
  Lamp,
  Recycle,
  Rocket,
  Satellite,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Zap,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { api } from '@/services/api'
import { useApps } from '@/hooks/useApps'
import { useSystemActions } from '@/hooks/useSystemActions'
import { useToast } from '@/hooks/useToast'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { AppIcon } from '@/components/ui/AppIcon'

interface Macro {
  id: string;
  name: string;
  description: string;
  apps: string[];
  icon: typeof Rocket;
}

const MACROS: Macro[] = [
  {
    id: 'work',
    name: 'Morning Setup',
    description: 'Chrome · VS Code · Spotify · Discord',
    apps: ['chrome', 'vscode', 'spotify', 'discord'],
    icon: Sparkles,
  },
  {
    id: 'gaming',
    name: 'Gaming Mode',
    description: 'Steam · Discord · Games',
    apps: ['steam', 'discord', 'games'],
    icon: Gamepad2,
  },
  {
    id: 'focus',
    name: 'Focus Session',
    description: 'VS Code · Terminal · Notion',
    apps: ['vscode', 'terminal', 'notion'],
    icon: Zap,
  },
]

const QUICK_ACTIONS = [
  { key: 'displayOff' as const, label: 'Display off', hint: 'Blank the monitors', icon: Lamp },
  { key: 'screenshot' as const, label: 'Screenshot', hint: 'Save to Pictures', icon: Bell },
  { key: 'recycleBin' as const, label: 'Empty Recycle Bin', hint: 'Free up space', icon: Recycle },
  { key: 'wakeOnLan' as const, label: 'Wake on LAN', hint: 'Magic packet', icon: Satellite },
]

/** Stream-Deck style macros, remote input helpers and maintenance actions. */
export function ToolsPage() {
  const { catalog, launch } = useApps()
  const actions = useSystemActions()
  const toast = useToast()
  const [clipboard, setClipboard] = useState('')
  const [notify, setNotify] = useState({ title: 'APEX CONTROL', message: 'Sent from your tablet' })
  const [running, setRunning] = useState<string | null>(null)

  const runMacro = async (macro: Macro) => {
    setRunning(macro.id)
    try {
      for (const appId of macro.apps) {
        await api.launchApp(appId)
      }
      toast.success(`${macro.name} sent`, `${macro.apps.length} apps queued on APEX`)
    } catch (error) {
      toast.error('Macro interrupted', error instanceof Error ? error.message : undefined)
    } finally {
      setRunning(null)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-5">
      <PageHeader
        title="Tools"
        description="One-tap macros and remote helpers. Every action maps to a fixed, predefined endpoint."
        icon={<SlidersHorizontal className="h-5 w-5" />}
      />

      {/* macros ----------------------------------------------------------- */}
      <section aria-label="Macros">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {MACROS.map((macro) => {
            const Icon = macro.icon
            return (
              <Card key={macro.id} className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl border border-accent/25 bg-accent/10 text-accent">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate text-[15px] font-semibold text-slate-100">{macro.name}</h2>
                    <p className="truncate text-[11px] text-slate-500">{macro.description}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {macro.apps.map((appId) => {
                    const app = catalog.find((entry) => entry.id === appId)
                    return (
                      <span
                        key={appId}
                        className="glass-soft inline-flex items-center gap-1.5 rounded-full py-1 pl-1.5 pr-2.5 text-[11px] text-slate-300"
                      >
                        <span className="grid h-6 w-6 place-items-center rounded-full" style={{ backgroundColor: `${app?.tint ?? '#22D3EE'}26` }}>
                          <AppIcon name={app?.icon ?? 'Rocket'} className="h-3.5 w-3.5" />
                        </span>
                        {app?.name ?? appId}
                      </span>
                    )
                  })}
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  block
                  loading={running === macro.id}
                  onClick={() => void runMacro(macro)}
                  icon={<Rocket className="h-4 w-4" />}
                >
                  Run macro
                </Button>
              </Card>
            )
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
        {/* remote input ---------------------------------------------------- */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <Card>
            <CardHeader
              title="Send text to the PC"
              icon={<ClipboardCopy className="h-5 w-5" />}
              subtitle="Pushes a snippet into the APEX clipboard"
            />
            <TextField
              label="Clipboard content"
              value={clipboard}
              onChange={setClipboard}
              placeholder="Paste or type something to copy on APEX"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="primary"
                loading={running === 'clipboard'}
                onClick={async () => {
                  if (!clipboard.trim()) {
                    toast.error('Nothing to send', 'Type some text first')
                    return
                  }
                  setRunning('clipboard')
                  try {
                    const result = await api.pushClipboard(clipboard)
                    toast.success(result.message ?? 'Clipboard updated')
                  } catch (error) {
                    toast.error('Clipboard failed', error instanceof Error ? error.message : undefined)
                  } finally {
                    setRunning(null)
                  }
                }}
              >
                Push to clipboard
              </Button>
              <Button variant="ghost" onClick={() => setClipboard('')} disabled={clipboard === ''}>
                Clear
              </Button>
            </div>
          </Card>

          <Card>
            <CardHeader title="Send a notification" icon={<Bell className="h-5 w-5" />} subtitle="Shows a toast on the PC" />
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField label="Title" value={notify.title} onChange={(title) => setNotify((prev) => ({ ...prev, title }))} />
              <TextField
                label="Message"
                value={notify.message}
                onChange={(message) => setNotify((prev) => ({ ...prev, message }))}
              />
            </div>
            <div className="mt-3">
              <Button
                variant="glass"
                loading={running === 'notify'}
                onClick={async () => {
                  setRunning('notify')
                  try {
                    const result = await api.sendNotification(notify.title, notify.message)
                    toast.success(result.message ?? 'Notification delivered')
                  } catch (error) {
                    toast.error('Notification failed', error instanceof Error ? error.message : undefined)
                  } finally {
                    setRunning(null)
                  }
                }}
              >
                Send notification
              </Button>
            </div>
          </Card>
        </div>

        {/* quick actions --------------------------------------------------- */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <Card>
            <CardHeader title="Quick actions" subtitle="Maintenance endpoints" />
            <div className="grid grid-cols-2 gap-2.5">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon
                return (
                  <Button
                    key={action.key}
                    variant="glass"
                    size="lg"
                    loading={actions.pending === action.key}
                    onClick={() => actions[action.key]()}
                    icon={<Icon className="h-5 w-5" />}
                    className={cn('!min-h-[84px] flex-col !gap-2')}
                  >
                    <span className="flex flex-col items-center gap-0.5">
                      <span className="text-[13px] font-semibold">{action.label}</span>
                      <span className="text-[10px] font-normal text-slate-500">{action.hint}</span>
                    </span>
                  </Button>
                )
              })}
            </div>
          </Card>

          <Card>
            <CardHeader title="Launch a single app" icon={<Rocket className="h-5 w-5" />} />
            <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
              {catalog.slice(0, 10).map((app) => (
                <button
                  key={app.id}
                  type="button"
                  onClick={() => void launch(app.id)}
                  className="press glass-soft flex min-h-[64px] shrink-0 flex-col items-center justify-center gap-1.5 rounded-2xl px-3"
                  title={`Launch ${app.name}`}
                >
                  <span className="grid h-9 w-9 place-items-center rounded-xl" style={{ backgroundColor: `${app.tint}26` }}>
                    <AppIcon name={app.icon} className="h-4.5 w-4.5" />
                  </span>
                  <span className="text-[10px] font-medium text-slate-300">{app.name}</span>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* security note ----------------------------------------------------- */}
      <Card className="border-emerald-400/20">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-emerald-400/25 bg-emerald-400/10 text-emerald-300">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-[15px] font-semibold text-slate-100">No arbitrary commands</h2>
            <p className="mt-1 text-[13px] leading-relaxed text-slate-400">
              This dashboard can only call the fixed actions listed below. There is no endpoint that accepts a raw
              shell command, so nothing typed in the browser can be executed on the PC.
            </p>
            <div className="mt-3 grid gap-1.5 font-mono text-[11px] text-slate-400 sm:grid-cols-2">
              {[
                'POST /api/apps/launch',
                'POST /api/system/lock',
                'POST /api/system/sleep',
                'POST /api/system/restart',
                'POST /api/system/shutdown',
                'POST /api/media/play-pause',
                'POST /api/media/volume',
                'POST /api/tools/clipboard',
              ].map((endpoint) => (
                <span key={endpoint} className="glass-soft rounded-lg px-2.5 py-1.5">
                  {endpoint}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
