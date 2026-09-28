import { Radio } from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'
import { useConnection } from '@/hooks/useConnection'
import { ConnectionPill } from '@/components/ui/ConnectionPill'
import { formatClock, formatDateLong } from '@/utils/format'
import { useClock } from '@/hooks/useClock'

/**
 * Hero banner. The artwork is generated entirely in SVG/CSS (original
 * abstract landscape) - no third-party imagery is used.
 */
export function HeroBanner() {
  const { settings } = useSettings()
  const { state, status } = useConnection()
  const now = useClock(1000)

  return (
    <section className="relative h-40 overflow-hidden rounded-3xl border border-white/10 sm:h-48 lg:h-52" aria-label="Dashboard banner">
      {/* sky ---------------------------------------------------------------- */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#070b16_0%,#0b1226_45%,#05070d_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_18%_0%,rgb(var(--accent-rgb)/0.28),transparent_58%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(90%_80%_at_88%_12%,rgb(var(--accent2-rgb)/0.26),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_120%,rgb(var(--accent-rgb)/0.16),transparent_70%)]" />

      {/* stars -------------------------------------------------------------- */}
      <svg className="absolute inset-0 h-full w-full opacity-70" viewBox="0 0 800 220" preserveAspectRatio="none" aria-hidden="true">
        <g fill="#ffffff">
          <circle cx="72" cy="34" r="1.1" opacity="0.8" />
          <circle cx="148" cy="66" r="0.8" opacity="0.5" />
          <circle cx="212" cy="24" r="1.3" opacity="0.9" />
          <circle cx="286" cy="58" r="0.7" opacity="0.45" />
          <circle cx="352" cy="30" r="1" opacity="0.7" />
          <circle cx="428" cy="52" r="0.9" opacity="0.55" />
          <circle cx="496" cy="26" r="1.2" opacity="0.85" />
          <circle cx="566" cy="62" r="0.8" opacity="0.5" />
          <circle cx="634" cy="34" r="1.1" opacity="0.75" />
          <circle cx="702" cy="56" r="0.9" opacity="0.6" />
          <circle cx="762" cy="28" r="1.2" opacity="0.8" />
        </g>
      </svg>

      {/* moon / glow -------------------------------------------------------- */}
      <div className="absolute right-8 top-6 h-16 w-16 rounded-full bg-[radial-gradient(circle_at_35%_35%,rgb(255_255_255/0.95),rgb(148_163_184/0.25)_60%,transparent_70%)] blur-[0.5px] sm:right-16 sm:top-8 sm:h-20 sm:w-20" />

      {/* ridges ------------------------------------------------------------- */}
      <svg
        className="absolute inset-x-0 bottom-0 h-[62%] w-full"
        viewBox="0 0 800 220"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="apex-ridge-far" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(var(--accent2-rgb) / 0.45)" />
            <stop offset="100%" stopColor="#070b16" />
          </linearGradient>
          <linearGradient id="apex-ridge-mid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(var(--accent-rgb) / 0.4)" />
            <stop offset="100%" stopColor="#05070d" />
          </linearGradient>
          <linearGradient id="apex-ridge-near" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0b1020" />
            <stop offset="100%" stopColor="#04060c" />
          </linearGradient>
        </defs>
        <path d="M0 132 L96 92 L164 120 L252 66 L330 112 L420 58 L512 108 L604 72 L690 118 L800 84 L800 220 L0 220 Z" fill="url(#apex-ridge-far)" />
        <path d="M0 168 L88 138 L176 162 L268 122 L360 156 L452 126 L548 162 L640 132 L736 166 L800 142 L800 220 L0 220 Z" fill="url(#apex-ridge-mid)" />
        <path d="M0 196 L110 176 L214 192 L320 170 L430 190 L540 172 L650 194 L760 176 L800 190 L800 220 L0 220 Z" fill="url(#apex-ridge-near)" />
      </svg>

      {/* horizon light ------------------------------------------------------ */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent" />

      {/* content ------------------------------------------------------------ */}
      <div className="relative flex h-full flex-col items-start justify-center gap-2 px-5 sm:px-8">
        <p className="label-xs !text-accent/80">Remote command centre</p>
        <h2 className="text-2xl font-bold tracking-[0.22em] text-slate-50 text-glow sm:text-3xl">
          {settings.dashboardName}
        </h2>
        <p className="label-xs !tracking-[0.3em] !text-slate-400">CONTROL · MONITOR · AUTOMATE</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <ConnectionPill state={state} hostname={status?.hostname ?? 'APEX'} compact />
          <span className="glass-soft num inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/10 px-3.5 text-[13px] font-semibold text-slate-200">
            {formatClock(now)}
            <span className="text-slate-500">{formatDateLong(now)}</span>
          </span>
          <span className="glass-soft inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/10 px-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            <Radio className="h-3.5 w-3.5 text-accent" />
            {settings.demoMode ? 'Demo PC' : status?.ipAddress ?? 'local'}
          </span>
        </div>
      </div>
    </section>
  )
}
