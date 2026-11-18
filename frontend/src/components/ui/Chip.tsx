import { X } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../utils/cn'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> { selected?: boolean; onRemove?: () => void; icon?: ReactNode; size?: 'sm' | 'md' }

/** Pill. Selected = haldi wash + haldi border + haldi text. With onRemove it renders as a removable token. */
export function Chip({ selected, onRemove, icon, size = 'md', className, children, ...rest }: Props) {
  const base = cn(
    'inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap transition-[background-color,border-color,color,transform] duration-150',
    size === 'md' ? 'h-10 px-4 text-[14px]' : 'h-8 px-3 text-[13px]',
    selected ? 'border-haldi bg-haldi-wash text-haldi-ink' : 'border-seam bg-plate text-ink-2 hover:border-seam-strong hover:text-ink',
  )
  if (onRemove) {
    return (
      <span className={cn(base, 'pr-1', className)}>
        {icon}
        {children}
        <button type="button" onClick={onRemove} aria-label={`Remove ${typeof children === 'string' ? children : 'filter'}`}
          className="grid size-7 place-items-center rounded-full hover:bg-plate-strong">
          <X className="size-3.5" />
        </button>
      </span>
    )
  }
  return (
    <button type="button" aria-pressed={selected} className={cn(base, 'active:scale-95', className)} {...rest}>
      {icon}
      {children}
    </button>
  )
}
