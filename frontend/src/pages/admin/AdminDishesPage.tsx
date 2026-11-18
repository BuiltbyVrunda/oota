import { Search } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { errorMessage } from '../../api/client'
import { adminApi } from '../../api/portal'
import { ManagedDishRow } from '../../components/portal/ManagedDishRow'
import { Input } from '../../components/ui/Input'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../context/ToastContext'
import { useDebounce } from '../../hooks/useDebounce'
import { useResource } from '../../hooks/useResource'

export function AdminDishesPage() {
  const [params] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const dq = useDebounce(q, 200)
  const r = useResource(`admin-dishes:${dq}`, () => adminApi.dishes(dq))
  const { push } = useToast()
  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    try { await fn(); if (ok) push({ tone: 'success', title: ok }); r.refresh() } catch (e) { push({ tone: 'error', title: 'That didn’t work', body: errorMessage(e) }) }
  }
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[32px] sm:text-[40px]">Dishes</h1>
        <p className="text-[15px] text-ink-2">Every dish on every menu. Restaurants add their own; you can correct prices, mark sold out, or remove.</p>
      </div>
      <div className="max-w-md"><Input label="Search dishes" hideLabel placeholder="Dish or restaurant name" icon={<Search className="size-4" />} value={q} onChange={(e) => setQ(e.target.value)} /></div>
      {r.status === 'error' && <p role="alert" className="rounded-card bg-danger-wash p-4 text-danger">{r.error}</p>}
      {!r.data ? <Skeleton className="h-96 w-full rounded-tier" /> : (
        <section className="liquid rounded-tier px-4 py-2 sm:px-6">
          <p className="relative z-[2] pt-2 text-[13px] text-ink-3">{r.data.length} dishes</p>
          <ul className="relative z-[2] divide-y divide-seam">
            {r.data.map((d) => (
              <ManagedDishRow key={d.id} d={d} showRestaurant onUpdate={(p) => run(() => adminApi.updateDish(d.id, p))} onDelete={() => run(() => adminApi.deleteDish(d.id), `Deleted ${d.name}`)} />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
