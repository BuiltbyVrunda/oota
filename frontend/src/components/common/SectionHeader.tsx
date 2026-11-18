import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

export function SectionHeader({ title, aside, children, className, as: As = 'h2' }: { title: ReactNode; aside?: ReactNode; children?: ReactNode; className?: string; as?: 'h1' | 'h2' | 'h3' }) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-x-4 gap-y-2', className)}>
      <div className="min-w-0">
        <As className={As === 'h1' ? 'text-[32px] sm:text-[40px]' : 'text-[22px] sm:text-[26px]'}>{title}</As>
        {children && <div className="mt-1 text-[15px] text-ink-2">{children}</div>}
      </div>
      {aside}
    </div>
  )
}
