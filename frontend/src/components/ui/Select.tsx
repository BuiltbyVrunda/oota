import { ChevronDown } from 'lucide-react'
import { useId, type SelectHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

interface Props extends SelectHTMLAttributes<HTMLSelectElement> { label: string; options: { value: string; label: string }[]; hideLabel?: boolean }

export function Select({ label, options, hideLabel, className, ...rest }: Props) {
  const id = useId()
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <label htmlFor={id} className={cn('text-[14px] text-ink-3', hideLabel && 'sr-only')}>{label}</label>
      <div className="relative">
        <select id={id} className="h-10 appearance-none rounded-full border border-seam bg-plate pl-4 pr-9 text-[14px] font-medium text-ink hover:border-seam-strong [&>option]:bg-solid-plate" {...rest}>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-pewter" aria-hidden />
      </div>
    </div>
  )
}
