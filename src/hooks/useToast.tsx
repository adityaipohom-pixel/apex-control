/** Lightweight toast notifications (no dependency, tablet-friendly). */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { cn } from '@/utils/cn'

export type ToastKind = 'success' | 'error' | 'info'

export interface Toast {
  id: number
  kind: ToastKind
  title: string
  description?: string
}

interface ToastContextValue {
  toasts: Toast[]
  push: (toast: Omit<Toast, 'id'>) => void
  success: (title: string, description?: string) => void
  error: (title: string, description?: string) => void
  info: (title: string, description?: string) => void
  dismiss: (id: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const ICONS = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
} as const

const TONE = {
  success: 'text-emerald-300 border-emerald-400/25',
  error: 'text-rose-300 border-rose-400/25',
  info: 'text-accent border-accent/25',
} as const

const LIFETIME_MS = 4200

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const push = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = Date.now() + Math.random()
      setToasts((prev) => [...prev.slice(-3), { ...toast, id }])
      window.setTimeout(() => dismiss(id), LIFETIME_MS)
    },
    [dismiss],
  )

  const value = useMemo<ToastContextValue>(
    () => ({
      toasts,
      push,
      dismiss,
      success: (title, description) => push({ kind: 'success', title, description }),
      error: (title, description) => push({ kind: 'error', title, description }),
      info: (title, description) => push({ kind: 'info', title, description }),
    }),
    [toasts, push, dismiss],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex flex-col items-center gap-2 px-4 pb-24 sm:pb-6 lg:items-end lg:pr-8"
        aria-live="polite"
        role="status"
      >
        {toasts.map((toast) => {
          const Icon = ICONS[toast.kind]
          return (
            <div
              key={toast.id}
              role="alert"
              className={cn(
                'glass pointer-events-auto flex w-full max-w-sm animate-pop-in items-start gap-3 rounded-2xl px-4 py-3',
                'border',
                TONE[toast.kind],
              )}
            >
              <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-100">{toast.title}</p>
                {toast.description ? (
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{toast.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="tap -m-1 flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white/5 hover:text-slate-200 active:scale-95"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
