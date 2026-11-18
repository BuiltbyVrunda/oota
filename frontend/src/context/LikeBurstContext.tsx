import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface Point { x: number; y: number }
interface Burst { id: number; from: Point; to: Point; onArrive: () => void }
type BurstFn = (from: Point, to: Point, onArrive: () => void) => void

const Ctx = createContext<BurstFn | null>(null)
let seq = 1
const SIZE = 104 // px, the heart at full size

/**
 * The "like" animation (modelled on the double-tap heart from the reference recording):
 * a big hot-pink heart pops in at the tap point tilted left, overshoots, settles, floats up a touch,
 * then shrinks while arcing into the heart button — which fills only when it lands.
 */
export function LikeBurstProvider({ children }: { children: ReactNode }) {
  const [bursts, setBursts] = useState<Burst[]>([])
  const reduce = useReducedMotion()
  const burst = useCallback<BurstFn>((from, to, onArrive) => {
    if (reduce) { onArrive(); return }
    setBursts((b) => [...b, { id: seq++, from, to, onArrive }])
  }, [reduce])
  const done = (b: Burst) => {
    b.onArrive()
    setBursts((list) => list.filter((x) => x.id !== b.id))
  }
  return (
    <Ctx.Provider value={burst}>
      {children}
      {createPortal(
        <div aria-hidden className="pointer-events-none fixed inset-0 z-[70]">
          <AnimatePresence>
            {bursts.map((b) => <FlyingHeart key={b.id} b={b} onDone={() => done(b)} />)}
          </AnimatePresence>
        </div>,
        document.body,
      )}
    </Ctx.Provider>
  )
}

function FlyingHeart({ b, onDone }: { b: Burst; onDone: () => void }) {
  const dx = b.to.x - b.from.x
  const dy = b.to.y - b.from.y
  const T = 0.74
  const times = [0, 0.18, 0.3, 0.52, 0.96, 1]
  return (
    <motion.div
      className="absolute"
      style={{ left: b.from.x - SIZE / 2, top: b.from.y - SIZE / 2, width: SIZE, height: SIZE }}
      initial={{ scale: 0, rotate: -18, x: 0, y: 0, opacity: 1 }}
      animate={{
        scale: [0, 1.22, 1, 1, 0.22, 0.22],
        rotate: [-18, -8, -13, -9, 0, 0],
        x: [0, 0, 0, 0, dx, dx],
        y: [0, 0, 0, -18, dy, dy],
        opacity: [1, 1, 1, 1, 1, 0],
      }}
      transition={{
        duration: T,
        scale: { duration: T, times, ease: ['backOut', 'easeOut', 'linear', 'easeIn', 'linear'] },
        rotate: { duration: T, times },
        // x eases in while y eases out → the heart travels on an arc, not a straight line
        x: { duration: T, times, ease: ['linear', 'linear', 'linear', [0.55, 0, 0.9, 0.45], 'linear'] },
        y: { duration: T, times, ease: ['linear', 'linear', 'easeOut', [0.15, 0.6, 0.35, 1], 'linear'] },
        opacity: { duration: T, times },
      }}
      onAnimationComplete={onDone}
    >
      <svg viewBox="0 0 100 92" className="size-full drop-shadow-[0_10px_24px_rgb(255_45_111/0.45)]">
        <defs>
          <linearGradient id="like-fill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" style={{ stopColor: 'var(--like-a)' }} />
            <stop offset="1" style={{ stopColor: 'var(--like-b)' }} />
          </linearGradient>
        </defs>
        <path d="M50 88C47 85.6 6 60.5 6 30.5 6 15.3 17.6 5 31 5c8.3 0 15.2 4.4 19 11 3.8-6.6 10.7-11 19-11 13.4 0 25 10.3 25 25.5C94 60.5 53 85.6 50 88Z" fill="url(#like-fill)" />
        <ellipse cx="30" cy="25" rx="11" ry="7" transform="rotate(-30 30 25)" fill="rgb(255 255 255 / 0.35)" />
      </svg>
    </motion.div>
  )
}

export function useLikeBurst(): BurstFn {
  const v = useContext(Ctx)
  if (!v) throw new Error('useLikeBurst outside LikeBurstProvider')
  return v
}

/** Fired by double-tap surfaces (e.g. the restaurant cover photo); the matching SaveButton handles it. */
export const LIKE_EVENT = 'oota:like'
export interface LikeEventDetail { restaurantId: number; x: number; y: number }
