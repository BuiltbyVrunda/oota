import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import { useFavourites } from '../../context/FavouritesContext'
import { useToast } from '../../context/ToastContext'
import { cn } from '../../utils/cn'
import type { MouseEvent } from 'react'

export function SaveButton({ restaurantId, name, className, withLabel }: { restaurantId: number; name: string; className?: string; withLabel?: boolean }) {
  const { isSaved, toggle } = useFavourites()
  const { push } = useToast()
  const saved = isSaved(restaurantId)
  const onClick = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const now = toggle(restaurantId)
    push({ tone: now ? 'success' : 'info', title: now ? `Saved ${name}` : `Removed ${name}`, action: { label: 'Undo', onClick: () => toggle(restaurantId) } })
  }
  return (
    <button type="button" onClick={onClick} aria-pressed={saved} aria-label={saved ? `Remove ${name} from saved` : `Save ${name}`}
      className={cn('liquid-chip relative inline-flex items-center justify-center gap-2 rounded-full text-ink transition-transform active:scale-90',
        withLabel ? 'h-11 px-4 text-[15px] font-medium' : 'size-11', className)}>
      <motion.span className="relative z-[2]" key={String(saved)} initial={{ scale: saved ? 0.5 : 1 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 600, damping: 14 }}>
        <Heart className={cn('size-5', saved ? 'fill-chilli text-chilli drop-shadow-[0_0_8px_var(--chilli)]' : '')} aria-hidden />
      </motion.span>
      {withLabel && <span className="relative z-[2]">{saved ? 'Saved' : 'Save'}</span>}
    </button>
  )
}
