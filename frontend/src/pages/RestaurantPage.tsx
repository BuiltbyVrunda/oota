import { MessageSquareText, Store } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { AmbientField } from '../components/common/AmbientField'
import { EmptyState } from '../components/common/EmptyState'
import { PageContainer } from '../components/layout/PageContainer'
import { CoverHeader } from '../components/restaurant/CoverHeader'
import { MenuNav } from '../components/restaurant/MenuNav'
import { sectionId } from '../utils/menu'
import { MenuSection } from '../components/restaurant/MenuSection'
import { ReviewCard, ReviewList } from '../components/restaurant/ReviewList'
import { ReviewModal } from '../components/restaurant/ReviewModal'
import { ReviewSummary } from '../components/restaurant/ReviewSummary'
import { Button } from '../components/ui/Button'
import { useActivity } from '../context/ActivityContext'
import { useCatalog } from '../context/CatalogContext'
import { useReviews, type ReviewDraft } from '../context/ReviewsContext'
import { useToast } from '../context/ToastContext'
import { useScrollSpy } from '../hooks/useScrollSpy'

export function RestaurantPage() {
  const { slug = '' } = useParams()
  const { hash } = useLocation()
  const { bySlug, menuOf, status } = useCatalog()
  const { forRestaurant, myReviewFor, upsert, remove } = useReviews()
  const { recordView } = useActivity()
  const { push } = useToast()
  const r = bySlug(slug)
  const [vegOnly, setVegOnly] = useState(false)
  const [modal, setModal] = useState(false)
  const viewed = useRef<string | null>(null)

  useEffect(() => {
    if (r && viewed.current !== r.slug) { viewed.current = r.slug; recordView(r.id) }
  }, [r, recordView])

  const menu = useMemo(() => (r ? menuOf(r.id) : []), [r, menuOf])
  const shown = vegOnly ? menu.filter((d) => d.diet === 'veg' || d.diet === 'vegan') : menu
  const categories = useMemo(() => [...new Set(shown.map((d) => d.category))], [shown])
  const ids = useMemo(() => categories.map(sectionId), [categories])
  const active = useScrollSpy(ids)

  const highlightId = hash.startsWith('#dish-') ? Number(hash.slice(6)) : null
  useEffect(() => {
    if (!highlightId) return
    const t = window.setTimeout(() => document.getElementById(`dish-${highlightId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 350)
    return () => window.clearTimeout(t)
  }, [highlightId])

  if (status === 'ready' && !r) {
    return (
      <PageContainer className="pt-20">
        <EmptyState icon={<Store className="size-6" />} title="This restaurant isn’t on Oota" actions={<Link to="/discover"><Button>Browse restaurants</Button></Link>}>
          It may have been removed, or the link is wrong.
        </EmptyState>
      </PageContainer>
    )
  }
  if (!r) return null

  const reviews = forRestaurant(r.id)
  const mine = myReviewFor(r.id)
  const hasNonVeg = menu.some((d) => d.diet === 'nonveg' || d.diet === 'egg')

  const submit = async (d: ReviewDraft) => {
    const before = r.avgRating
    await upsert(r.id, d)
    setModal(false)
    push({ tone: 'success', title: mine ? 'Review updated' : 'Review posted', body: `Thanks! ${r.name} was ${before.toFixed(1)}★ — your picks have been re-ranked.` })
  }
  const del = async () => {
    const snapshot = mine
    await remove(r.id)
    push({ tone: 'info', title: 'Review deleted', action: snapshot ? { label: 'Undo', onClick: () => void upsert(r.id, snapshot) } : undefined })
  }

  return (
    <>
      <AmbientField photo={r.coverUrl} />
      <PageContainer className="pt-4 sm:pt-6">
        <CoverHeader r={r} onRate={() => setModal(true)} hasReview={Boolean(mine)} />

        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0">
            <MenuNav categories={categories} active={active} vegOnly={vegOnly} onVegOnly={setVegOnly} showVegToggle={hasNonVeg} />
            <div className="liquid tint-haldi mt-4 rounded-tier px-2 py-5 sm:px-4">
              <div className="relative z-[2] flex flex-col gap-8">
                {categories.map((c, i) => <MenuSection key={c} name={c} first={i === 0} dishes={shown.filter((d) => d.category === c)} highlightId={highlightId} />)}
                {categories.length === 0 && <p className="px-3 text-ink-2">No vegetarian dishes here. Turn off “Veg only” to see the full menu.</p>}
              </div>
            </div>
          </div>

          <aside aria-label="Ratings and reviews" className="lg:sticky lg:top-24 lg:self-start">
            <div className="liquid tint-kokum rounded-tier p-5">
              <div className="relative z-[2]">
                <h2 className="text-[22px]">Ratings</h2>
                <div className="mt-4"><ReviewSummary reviews={reviews} avg={r.avgRating} /></div>
                {mine ? (
                  <div className="mt-5"><ReviewCard r={mine} menu={menu} mine onEdit={() => setModal(true)} onDelete={() => void del()} /></div>
                ) : (
                  <Button variant="secondary" full className="mt-5" onClick={() => setModal(true)} icon={<MessageSquareText className="size-4" />}>Write a review</Button>
                )}
              </div>
            </div>
          </aside>
        </div>

        <section aria-labelledby="reviews-h" className="liquid tint-coconut mt-8 rounded-tier p-5 sm:p-7">
          <div className="relative z-[2]">
            <h2 id="reviews-h" className="mb-4 text-[26px]">What diners say</h2>
            {reviews.length ? <ReviewList reviews={reviews} menu={menu} excludeId={mine?.id} /> : (
              <EmptyState icon={<MessageSquareText className="size-6" />} title="No reviews yet" actions={<Button variant="accent" onClick={() => setModal(true)}>Be the first</Button>}>
                Your review sets this place’s first rating.
              </EmptyState>
            )}
          </div>
        </section>
      </PageContainer>
      <ReviewModal open={modal} onClose={() => setModal(false)} restaurantName={r.name} menu={menu} existing={mine} onSubmit={submit} />
    </>
  )
}
