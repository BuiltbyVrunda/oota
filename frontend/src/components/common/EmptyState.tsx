import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

export function EmptyState({ icon, title, children, actions, className }: { icon: ReactNode; title: string; children?: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-12 text-center', className)}>
      <div className="liquid-flat mb-5 grid size-16 place-items-center rounded-full text-haldi [&_svg]:relative [&_svg]:z-[2]">{icon}</div>
      <h3 className="text-[22px]">{title}</h3>
      {children && <div className="measure mt-2 text-[15px] text-ink-2">{children}</div>}
      {actions && <div className="mt-6 flex flex-wrap justify-center gap-3">{actions}</div>}
    </div>
  )
}
