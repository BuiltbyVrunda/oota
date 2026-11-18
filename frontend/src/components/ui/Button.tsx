import { LoaderCircle } from 'lucide-react'
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { usePointerLight } from '../../hooks/usePointerLight'
import { cn } from '../../utils/cn'

export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger'
interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant; size?: 'sm' | 'md' | 'lg'; loading?: boolean; icon?: ReactNode; iconRight?: ReactNode; full?: boolean
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-ink text-on-ink shadow-e2 hover:bg-ink-2 active:bg-ink',
  accent: 'haldi-gloss hover:brightness-105 active:brightness-95',
  secondary: 'liquid-flat lit text-ink hover:bg-plate-strong',
  ghost: 'text-ink-2 hover:text-ink hover:bg-brushed',
  danger: 'bg-danger-wash text-danger border border-danger/40 hover:bg-danger/20',
}
const sizes = { sm: 'h-9 px-3.5 text-[14px] gap-1.5', md: 'h-11 px-5 text-[15px] gap-2', lg: 'h-13 px-6 text-[16px] gap-2.5' }

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', size = 'md', loading, icon, iconRight, full, className, children, disabled, onPointerMove, ...rest }, ref,
) {
  const light = usePointerLight()
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      onPointerMove={(e) => { light(e); onPointerMove?.(e) }}
      className={cn(
        'relative inline-flex select-none items-center justify-center rounded-full font-medium whitespace-nowrap',
        'transition-[background-color,filter,transform,box-shadow] duration-150 ease-out active:scale-[0.97]',
        'disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100',
        variants[variant], sizes[size], full && 'w-full', className,
      )}
      {...rest}
    >
      <span className="relative z-[2] inline-flex items-center gap-[inherit]">
        {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : icon}
        {children}
        {iconRight}
      </span>
    </button>
  )
})
