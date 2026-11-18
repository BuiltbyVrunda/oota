import { Star } from 'lucide-react'
import { errorMessage } from '../../api/client'
import { adminApi } from '../../api/portal'
import { ConfirmButton } from '../../components/portal/ConfirmButton'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../context/ToastContext'
import { useResource } from '../../hooks/useResource'
import { cn } from '../../utils/cn'
import { relativeTime } from '../../utils/format'

export function AdminReviewsPage() {
  const r = useResource('admin-reviews', adminApi.reviews)
  const { push } = useToast()
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[32px] sm:text-[40px]">Reviews</h1>
        <p className="text-[15px] text-ink-2">Moderate reviews. Removing one deletes it from MongoDB and re-syncs that restaurant’s rating in PostgreSQL.</p>
      </div>
      {r.status === 'error' && <p role="alert" className="rounded-card bg-danger-wash p-4 text-danger">{r.error}</p>}
      {!r.data ? <Skeleton className="h-96 w-full rounded-tier" /> : (
        <section className="liquid rounded-tier px-4 py-2 sm:px-6">
          <ul className="relative z-[2] divide-y divide-seam">
            {r.data.map((rv) => (
              <li key={rv.id} className="flex flex-col gap-1.5 py-4 sm:flex-row sm:items-start sm:gap-4">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-x-2 text-[14px]">
                    <span className="font-semibold">{rv.userName}</span><span className="text-ink-3">on</span><span className="font-semibold">{rv.restaurantName}</span>
                    <span className="flex" aria-label={`${rv.rating} of 5`}>{[1, 2, 3, 4, 5].map((n) => <Star key={n} className={cn('size-3.5', n <= rv.rating ? 'fill-haldi text-haldi' : 'text-seam-strong')} aria-hidden />)}</span>
                    <span className="text-[13px] text-ink-3">{relativeTime(rv.createdAt)}</span>
                  </p>
                  <p className="measure text-[15px] text-ink-2">{rv.text}</p>
                </div>
                <ConfirmButton label="Remove" confirmLabel="Remove" question="Remove review?" onConfirm={async () => {
                  try { const out = await adminApi.deleteReview(rv.id); push({ tone: 'success', title: 'Review removed', body: `${rv.restaurantName} is now ${out.restaurant.avgRating.toFixed(1)}★` }); r.refresh() }
                  catch (e) { push({ tone: 'error', title: 'That didn’t work', body: errorMessage(e) }) }
                }} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
