import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useHaptics } from '@/hooks/useHaptics'

export type ButtonVariant = 'primary' | 'glass' | 'ghost' | 'danger' | 'success'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: ReactNode
  loading?: boolean
  block?: boolean
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'border border-accent/40 bg-gradient-to-b from-accent/90 to-accent/60 text-slate-950 font-semibold shadow-glow-sm hover:from-accent hover:to-accent/70',
  glass:
    'glass-soft text-slate-200 hover:border-white/20 hover:bg-white/10 hover:text-white',
  ghost: 'border border-transparent text-slate-300 hover:bg-white/5 hover:text-white',
  danger:
    'border border-rose-400/35 bg-gradient-to-b from-rose-500/90 to-rose-600/70 text-white font-semibold shadow-[0_8px_26px_-10px_rgb(244_63_94/0.55)] hover:from-rose-500 hover:to-rose-600/80',
  success:
    'border border-emerald-400/35 bg-gradient-to-b from-emerald-500/85 to-emerald-600/65 text-white font-semibold hover:from-emerald-500 hover:to-emerald-600/75',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'min-h-[44px] rounded-xl px-3.5 text-[13px] gap-1.5',
  md: 'min-h-[48px] rounded-2xl px-4 text-sm gap-2',
  lg: 'min-h-[56px] rounded-2xl px-5 text-[15px] gap-2.5',
}

/** Touch-first button: every size is at least 44px tall. */
export function Button({
  variant = 'glass',
  size = 'md',
  icon,
  loading = false,
  block = false,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  const tap = useHaptics()

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={(event) => {
        tap()
        rest.onClick?.(event)
      }}
      className={cn(
        'press inline-flex items-center justify-center whitespace-nowrap font-medium tracking-tight',
        'disabled:pointer-events-none disabled:opacity-45',
        VARIANTS[variant],
        SIZES[size],
        block && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : icon}
      {children}
    </button>
  )
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  icon: ReactNode
  size?: 'sm' | 'md' | 'lg'
  tone?: 'default' | 'accent' | 'danger';
}

const ICON_SIZES = {
  sm: 'h-10 w-10 rounded-xl',
  md: 'h-12 w-12 rounded-2xl',
  lg: 'h-14 w-14 rounded-2xl',
} as const

/** Square icon-only control with an accessible label. */
export function IconButton({ label, icon, size = 'md', tone = 'default', className, ...rest }: IconButtonProps) {
  const tap = useHaptics()

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(event) => {
        tap()
        rest.onClick?.(event)
      }}
      className={cn(
        'press grid place-items-center border text-slate-300 transition duration-200',
        'disabled:pointer-events-none disabled:opacity-40',
        tone === 'accent' && 'border-accent/40 bg-accent/15 text-accent hover:bg-accent/25 hover:text-white',
        tone === 'danger' && 'border-rose-400/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20',
        tone === 'default' && 'glass-soft border-white/10 hover:border-white/25 hover:bg-white/10 hover:text-white',
        ICON_SIZES[size],
        className,
      )}
      {...rest}
    >
      {icon}
    </button>
  )
}
