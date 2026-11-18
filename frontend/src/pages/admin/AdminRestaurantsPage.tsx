import { ArrowUpRight, Check, Plus, Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { errorMessage } from '../../api/client'
import { adminApi, type AdminRestaurant } from '../../api/portal'
import { SmartImage } from '../../components/common/SmartImage'
import { ConfirmButton } from '../../components/portal/ConfirmButton'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Skeleton } from '../../components/ui/Skeleton'
import { StarRating } from '../../components/ui/StarRating'
import { useToast } from '../../context/ToastContext'
import { useResource } from '../../hooks/useResource'
import { cn } from '../../utils/cn'
import { inr } from '../../utils/format'

const STATUS: Record<AdminRestaurant['status'], string> = { approved: 'bg-veg-wash text-veg', pending: 'bg-haldi-wash text-haldi-ink', rejected: 'bg-danger-wash text-danger' }

export function AdminRestaurantsPage() {
  const r = useResource('admin-restaurants', adminApi.restaurants)
  const { push } = useToast()
  const [q, setQ] = useState('')
  const list = useMemo(() => (r.data ?? []).filter((x) => `${x.name} ${x.area} ${x.ownerEmail ?? ''}`.toLowerCase().includes(q.toLowerCase())), [r.data, q])
  const run = async (fn: () => Promise<unknown>, ok: string) => {
    try { await fn(); push({ tone: 'success', title: ok }); r.refresh() } catch (e) { push({ tone: 'error', title: 'That didn’t work', body: errorMessage(e) }) }
  }
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[32px] sm:text-[40px]">Restaurants</h1>
          <p className="text-[15px] text-ink-2">Approve partner sign-ups, edit listings, or remove a restaurant from both databases.</p>
        </div>
        <Link to="/admin/restaurants/new" className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-[15px] font-medium text-on-ink"><Plus className="size-4" aria-hidden /> Add restaurant</Link>
      </div>
      <div className="max-w-md"><Input label="Search restaurants" hideLabel placeholder="Search by name, area or owner email" icon={<Search className="size-4" />} value={q} onChange={(e) => setQ(e.target.value)} /></div>
      {r.status === 'error' && <p role="alert" className="rounded-card bg-danger-wash p-4 text-danger">{r.error}</p>}
      {!r.data ? <Skeleton className="h-96 w-full rounded-tier" /> : (
        <section className="liquid rounded-tier px-4 py-2 sm:px-6">
          <ul className="relative z-[2] divide-y divide-seam">
            {list.map((x) => (
              <li key={x.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                <SmartImage src={x.coverUrl ?? ''} alt={x.name} width={200} height={150} className="h-14 w-20 shrink-0 rounded-[10px]" />
                <div className="min-w-0 flex-1 basis-56">
                  <p className="flex flex-wrap items-center gap-2 text-[16px] font-semibold">
                    {x.name}
                    <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-bold uppercase', STATUS[x.status])}>{x.status}</span>
                  </p>
                  <p className="truncate text-[13px] text-ink-3">{x.area} · {x.cuisines.join(', ')} · {inr(x.costForTwo)} for two · {x.dishes} dishes</p>
                  <p className="truncate text-[13px] text-ink-3">Partner: {x.ownerEmail ?? 'none'}</p>
                </div>
                <StarRating value={x.avgRating} count={x.reviewCount} size="sm" />
                <span className="flex flex-wrap items-center gap-1">
                  {x.status !== 'approved' && <Button size="sm" variant="secondary" icon={<Check className="size-3.5" />} onClick={() => run(() => adminApi.updateRestaurant(x.id, { status: 'approved' }), `${x.name} is live`)}>Approve</Button>}
                  {x.status === 'pending' && <Button size="sm" variant="ghost" icon={<X className="size-3.5" />} onClick={() => run(() => adminApi.updateRestaurant(x.id, { status: 'rejected' }), `${x.name} rejected`)}>Reject</Button>}
                  {x.status === 'approved' && <Link to={`/restaurant/${x.slug}`} target="_blank" className="inline-flex h-9 items-center gap-1 rounded-full px-3 text-[14px] font-medium text-ink-2 hover:bg-brushed">View <ArrowUpRight className="size-3.5" aria-hidden /></Link>}
                  <Link to={`/admin/dishes?q=${encodeURIComponent(x.name)}`} className="inline-flex h-9 items-center rounded-full px-3 text-[14px] font-medium text-ink-2 hover:bg-brushed">Menu</Link>
                  <ConfirmButton question={`Delete ${x.name} everywhere?`} onConfirm={() => run(() => adminApi.deleteRestaurant(x.id), `Deleted ${x.name}`)} />
                </span>
              </li>
            ))}
            {list.length === 0 && <li className="py-6 text-center text-ink-3">No restaurants match “{q}”.</li>}
          </ul>
        </section>
      )}
    </div>
  )
}
