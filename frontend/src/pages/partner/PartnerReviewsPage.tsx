import { MessageSquareText } from 'lucide-react'
import { partnerApi } from '../../api/portal'
import { EmptyState } from '../../components/common/EmptyState'
import { ReviewCard } from '../../components/restaurant/ReviewList'
import { Skeleton } from '../../components/ui/Skeleton'
import { useResource } from '../../hooks/useResource'

export function PartnerReviewsPage() {
  const reviews = useResource('partner-reviews', partnerApi.reviews)
  const menu = useResource('partner-menu', partnerApi.menu)
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[32px] sm:text-[40px]">Reviews</h1>
        <p className="text-[15px] text-ink-2">What diners say, newest first. Stored in MongoDB; your rating is synced into PostgreSQL.</p>
      </div>
      {reviews.status === 'error' && <p role="alert" className="rounded-card bg-danger-wash p-4 text-danger">{reviews.error}</p>}
      {!reviews.data ? <Skeleton className="h-64 w-full rounded-tier" /> : reviews.data.length === 0 ? (
        <div className="liquid rounded-tier"><div className="relative z-[2]"><EmptyState icon={<MessageSquareText className="size-6" />} title="No reviews yet">They’ll appear here as diners rate you.</EmptyState></div></div>
      ) : (
        <section className="liquid rounded-tier p-3 sm:p-5"><div className="relative z-[2]">
          {reviews.data.map((rv) => <ReviewCard key={rv.id} r={rv} menu={menu.data ?? []} />)}
        </div></section>
      )}
    </div>
  )
}
