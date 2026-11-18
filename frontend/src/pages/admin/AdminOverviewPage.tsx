import { ArrowRight, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { adminApi } from '../../api/portal'
import { StatPlate } from '../../components/portal/StatPlate'
import { Skeleton } from '../../components/ui/Skeleton'
import { useResource } from '../../hooks/useResource'
import { inr } from '../../utils/format'

export function AdminOverviewPage() {
  const r = useResource('admin-overview', adminApi.overview)
  const o = r.data
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[32px] sm:text-[40px]">Overview</h1>
        <p className="text-[15px] text-ink-2">Everything on Oota, across PostgreSQL and MongoDB.</p>
      </div>
      {r.status === 'error' && <p role="alert" className="rounded-card bg-danger-wash p-4 text-danger">{r.error}</p>}
      {!o ? <Skeleton className="h-40 w-full rounded-tier" /> : (
        <>
          {o.pending > 0 && (
            <Link to="/admin/restaurants" className="liquid tint-haldi flex items-center gap-3 rounded-tier p-5 transition-transform hover:-translate-y-0.5">
              <Clock className="relative z-[2] size-5 text-haldi-ink" aria-hidden />
              <span className="relative z-[2] flex-1 text-[16px]"><span className="font-semibold">{o.pending} restaurant{o.pending > 1 ? 's' : ''} waiting for approval.</span> Review them now.</span>
              <ArrowRight className="relative z-[2] size-5" aria-hidden />
            </Link>
          )}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatPlate label="Restaurants" value={o.restaurants} sub={`${o.partners} partner logins`} />
            <StatPlate label="Dishes" value={o.dishes} />
            <StatPlate label="Diners" value={o.diners} sub={`${o.newDiners7d} joined this week`} />
            <StatPlate label="Reviews" value={o.reviews} sub="MongoDB" />
            <StatPlate label="Orders" value={o.orders} />
            <StatPlate label="Order value" value={inr(o.gmv)} sub="sum of trigger-computed totals" />
          </div>
        </>
      )}
    </div>
  )
}
