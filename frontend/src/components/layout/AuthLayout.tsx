import type { ReactNode } from 'react'
import { photo } from '../../data/images'
import { AmbientField } from '../common/AmbientField'
import { SmartImage } from '../common/SmartImage'
import { Wordmark } from '../common/Wordmark'

const COLLAGE = [
  { code: 'p01', alt: 'Crisp masala dosa with chutneys in steel bowls' },
  { code: 'p09', alt: 'Chicken biryani in a white bowl' },
  { code: 'p37', alt: 'Momos with an orange chilli sauce' },
  { code: 'p34', alt: 'Margherita pizza fresh from the oven' },
  { code: 'p25', alt: 'South Indian filter coffee set in brass' },
]

/** Split layout: a floating photo collage on the left, glass form panel on the right. */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative grid min-h-dvh grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <AmbientField />
      <aside className="relative hidden overflow-hidden lg:block" aria-label="Food from across Bengaluru">
        <div className="liquid-lens absolute inset-6 rounded-[32px] p-4">
        <div className="relative z-[2] grid size-full grid-cols-6 grid-rows-6 gap-4">
          {COLLAGE.map((c, i) => (
            <SmartImage key={c.code} src={photo(c.code, 700, 700)} alt={c.alt} width={700} height={700} eager
              className={['col-[1/5] row-[1/4]', 'col-[5/7] row-[1/3]', 'col-[5/7] row-[3/7]', 'col-[1/3] row-[4/7]', 'col-[3/5] row-[4/7]'][i] + ' rounded-[22px] shadow-e2'} />
          ))}
        </div>
        </div>
        <div className="liquid-lens absolute bottom-14 left-14 right-[38%] rounded-tier p-6">
          <div className="relative z-[2]">
            <Wordmark size="lg" />
            <p className="mt-3 text-[18px] leading-snug text-ink">Eat what you actually like. Oota learns from your tastes, searches and ratings, and tells you why it picked each place.</p>
          </div>
        </div>
      </aside>
      <main className="relative flex items-center justify-center px-4 py-10 sm:px-8">{children}</main>
    </div>
  )
}
