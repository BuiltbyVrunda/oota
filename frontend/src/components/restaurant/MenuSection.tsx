import type { Dish } from '../../types'
import { AddToTiffin } from '../order/AddToTiffin'
import { MenuDish } from './MenuDish'
import { sectionId } from '../../utils/menu'

export function MenuSection({ name, dishes, highlightId, first }: { name: string; dishes: Dish[]; highlightId: number | null; first?: boolean }) {
  return (
    <section id={sectionId(name)} aria-labelledby={`${sectionId(name)}-h`} className="scroll-mt-40">
      <h2 id={`${sectionId(name)}-h`} className="mb-2 px-3 text-[24px]">{name} <span className="font-sans text-[15px] font-normal tracking-normal text-ink-3">{dishes.length}</span></h2>
      <div className="flex flex-col divide-y divide-seam">
        {dishes.map((d, i) => <MenuDish key={d.id} d={d} highlighted={highlightId === d.id} eager={first && i < 3} action={<AddToTiffin d={d} />} />)}
      </div>
    </section>
  )
}
