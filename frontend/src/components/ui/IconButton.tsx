import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../utils/cn'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> { label: string; children: ReactNode; tone?: 'glass' | 'lens' | 'plain'; size?: 'sm' | 'md' }

export const IconButton = forwardRef<HTMLButtonElement, Props>(function IconButton({ label, children, tone = 'glass', size = 'md', className, ...rest }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'relative inline-grid shrink-0 place-items-center rounded-full text-ink transition-[transform,background-color] duration-150 active:scale-90',
        'disabled:opacity-40 disabled:cursor-not-allowed [&_svg]:relative [&_svg]:z-[2]',
        size === 'md' ? 'size-11' : 'size-9',
        tone === 'glass' && 'liquid-flat hover:bg-plate-strong',
        tone === 'lens' && 'liquid-chip hover:bg-plate-strong',
        tone === 'plain' && 'hover:bg-brushed',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
})
