import { ArrowUpRight, Clock, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { partnerApi } from '../../api/portal'
import { SmartImage } from '../../components/common/SmartImage'
import { StatPlate } from '../../components/portal/StatPlate'
import { Skeleton } from '../../components/ui/Skeleton'
import { StarRating } from '../../components/ui/StarRating'
import { usePortalAuth } from '../../context/PortalAuthContext'
import { useResource } from '../../hooks/useResource'
import { inr } from '../../utils/format'

export function PartnerOverviewPage() {
  const { user } = usePortalAuth()
  const r = useResource('partner-overview', partnerApi.overview)
  const pending = user?.restaurantStatus === 'pending'
  if (r.status === 'error') return <p role="alert" className="rounded-card bg-danger-wash p-4 text-danger">{r.error}</p>
  if (!r.data) return <Skeleton className="h-64 w-full rounded-tier" />
  const { restaurant: rest, stats, ratings } = r.data
  const max = Math.max(1, ratings.r1, ratings.r2, ratings.r3, ratings.r4, ratings.r5)
  return (
    <div className="flex flex-col gap-6">
      {pending && (
        <div role="status" className="liquid tint-haldi flex items-start gap-3 rounded-tier p-5">
          <Clock className="relative z-[2] mt-0.5 size-5 shrink-0 text-haldi-ink" aria-hidden />
          <p className="relative z-[2] text-[15px]"><span className="font-semibold">Waiting for approval.</span> An Oota admin is reviewing {rest.name}. Build your menu now — diners will see it the moment you’re approved.</p>
        </div>
      )}
      {user?.restaurantStatus === 'rejected' && <p role="alert" className="rounded-card bg-danger-wash p-4 text-danger">This listing was not approved. Contact the Oota team.</p>}

      <section className="liquid flex flex-col gap-5 rounded-tier p-5 sm:flex-row sm:items-center sm:p-6">
        <SmartImage src={rest.coverUrl} alt={rest.name} width={1200} height={700} className="relative z-[2] aspect-[16/10] w-full shrink-0 rounded-card sm:w-60" />
        <div className="relative z-[2] min-w-0 flex-1">
          <h1 className="text-[32px] sm:text-[40px]">{rest.name}</h1>
          <p className="text-[15px] text-ink-2">{rest.area} · {inr(rest.costForTwo)} for two · {rest.opensAt}–{rest.closesAt}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link to="/partner/menu/new" className="haldi-gloss inline-flex h-11 items-center gap-2 rounded-full px-5 text-[15px] font-medium"><Plus className="size-4" aria-hidden /> Add a dish</Link>
            {!pending && <Link to={`/restaurant/${rest.slug}`} target="_blank" className="liquid-flat inline-flex h-11 items-center gap-2 rounded-full px-5 text-[15px] font-medium"><span className="relative z-[2] inline-flex items-center gap-2">See it as a diner <ArrowUpRight className="size-4" aria-hidden /></span></Link>}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatPlate label="Dishes on menu" value={stats.dishes} sub={`${stats.available} available · ${stats.sections} sections`} />
        <StatPlate label="Orders, last 30 days" value={stats.orders30} sub={`${stats.unitsSold} items sold all time`} />
        <StatPlate label="Revenue, last 30 days" value={inr(stats.revenue30)} />
        <StatPlate label="Saved by diners" value={stats.saves} />
      </div>

      <section className="liquid tint-kokum rounded-tier p-5 sm:p-6" aria-labelledby="pr-h">
        <div className="relative z-[2] flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
          <div>
            <h2 id="pr-h" className="text-[22px]">Rating</h2>
            <p className="tabular mt-1 font-display text-[48px] font-semibold leading-none">{ratings.count ? ratings.avg.toFixed(1) : '—'}</p>
            <StarRating value={Math.round(ratings.avg * 10) / 10} count={ratings.count} size="sm" />
          </div>
          <ul className="flex flex-1 flex-col gap-1.5" aria-label="Rating distribution (MongoDB aggregation)">
            {([5, 4, 3, 2, 1] as const).map((n) => {
              const c = ratings[`r${n}`]
              return (
                <li key={n} className="flex items-center gap-2 text-[13px]">
                  <span className="tabular w-3 text-ink-2">{n}</span>
                  <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-brushed"><span className="absolute inset-y-0 left-0 rounded-full bg-haldi" style={{ width: `${(c / max) * 100}%` }} /></span>
                  <span className="tabular w-5 text-right text-ink-3">{c}</span>
                </li>
              )
            })}
          </ul>
          <Link to="/partner/reviews" className="self-start text-[14px] font-semibold text-haldi-ink hover:underline sm:self-center">Read reviews</Link>
        </div>
      </section>
    </div>
  )
}
