import { cn } from '../../utils/cn'

/** ಊಟ on a little steel lid + "Oota". */
export function Wordmark({ className, size = 'md' }: { className?: string; size?: 'md' | 'lg' }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span className={cn('steel-plate wordmark-kn grid place-items-center rounded-[10px] leading-none', size === 'md' ? 'h-9 w-11 text-[17px]' : 'h-12 w-15 text-[24px]')} aria-hidden>
        ಊಟ
      </span>
      <span className={cn('font-display font-semibold tracking-[-0.03em]', size === 'md' ? 'text-[22px]' : 'text-[30px]')}>Oota</span>
    </span>
  )
}
