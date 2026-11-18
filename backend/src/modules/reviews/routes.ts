import { Router } from 'express'
import { z } from 'zod'
import { q } from '../../db/pg.ts'
import { col } from '../../db/mongo.ts'
import { requireUser } from '../../middleware/auth.ts'
import { HttpError } from '../../middleware/error.ts'
import { body } from '../../middleware/validate.ts'
import { syncRestaurant } from '../../services/reviewSync.ts'
import { toReview } from '../../services/signals.ts'

const star = z.number().int().min(1).max(5)
const reviewSchema = z.object({
  rating: star,
  text: z.string().trim().min(10, 'Write at least 10 characters.').max(600),
  tags: z.array(z.string().trim().min(1).max(40)).max(14).default([]),
  dishRatings: z.array(z.object({ dishId: z.number().int().positive(), rating: star })).max(20).default([]),
})
type ReviewBody = z.infer<typeof reviewSchema>

export const reviewsRouter = Router()

async function restaurantOr404(id: number) {
  const [r] = await q<{ id: number; name: string }>('SELECT restaurant_id AS id, name FROM restaurants WHERE restaurant_id = $1', [id])
  if (!r) throw new HttpError(404, 'NOT_FOUND', 'This restaurant isn’t on Oota.')
  return r
}

reviewsRouter.get('/restaurants/:id/reviews', async (req, res) => {
  const id = Number(req.params.id)
  const sort = String(req.query.sort ?? 'newest')
  const order: Record<string, 1 | -1> = sort === 'highest' ? { rating: -1, createdAt: -1 } : sort === 'lowest' ? { rating: 1, createdAt: -1 } : { createdAt: -1 }
  const docs = await col.reviews().find({ restaurantId: id }).sort(order).toArray()
  res.json(docs.map(toReview))
})

reviewsRouter.get('/me/reviews', requireUser, async (req, res) => {
  const docs = await col.reviews().find({ userId: req.user!.id }).sort({ createdAt: -1 }).toArray()
  res.json(docs.map(toReview))
})

/** Create or edit (upsert) — then the cross-database sync: Mongo aggregate → Postgres cached rating. */
async function upsert(restaurantId: number, userId: number, userName: string, b: ReviewBody) {
  await restaurantOr404(restaurantId)
  // cross-database integrity, checked in the app: rated dishes must belong to this restaurant (Postgres)
  if (b.dishRatings.length) {
    const ids = b.dishRatings.map((d) => d.dishId)
    const ok = await q<{ id: number }>('SELECT dish_id AS id FROM dishes WHERE restaurant_id = $1 AND dish_id = ANY($2::int[])', [restaurantId, ids])
    if (ok.length !== new Set(ids).size) throw new HttpError(400, 'BAD_DISH', 'One of those dishes is not on this menu.')
  }
  const before = await col.reviews().findOne({ userId, restaurantId })
  const now = new Date()
  // 1) MongoDB first (unique index {userId, restaurantId} makes this one review per person per place)
  await col.reviews().updateOne(
    { userId, restaurantId },
    { $set: { userName, rating: b.rating as 1, text: b.text, tags: b.tags, dishRatings: b.dishRatings as { dishId: number; rating: 1 }[], updatedAt: now }, $setOnInsert: { createdAt: now } },
    { upsert: true },
  )
  // 2) PostgreSQL second: recompute the aggregate and UPDATE the cache (idempotent — safe to re-run)
  const touched = [...new Set([...(before?.dishRatings ?? []).map((d) => d.dishId), ...b.dishRatings.map((d) => d.dishId)])]
  const stats = await syncRestaurant(restaurantId, touched)
  const doc = await col.reviews().findOne({ userId, restaurantId })
  return { review: toReview(doc!), restaurant: { avgRating: Math.round(stats.avg * 10) / 10, reviewCount: stats.count }, created: !before }
}

reviewsRouter.post('/restaurants/:id/reviews', requireUser, body(reviewSchema), async (req, res) => {
  const out = await upsert(Number(req.params.id), req.user!.id, req.user!.fullName, req.body as ReviewBody)
  res.status(out.created ? 201 : 200).json(out)
})
reviewsRouter.put('/restaurants/:id/reviews/mine', requireUser, body(reviewSchema), async (req, res) => {
  res.json(await upsert(Number(req.params.id), req.user!.id, req.user!.fullName, req.body as ReviewBody))
})
reviewsRouter.delete('/restaurants/:id/reviews/mine', requireUser, async (req, res) => {
  const restaurantId = Number(req.params.id)
  const before = await col.reviews().findOneAndDelete({ userId: req.user!.id, restaurantId })
  if (!before) throw new HttpError(404, 'NOT_FOUND', 'You haven’t reviewed this place.')
  const stats = await syncRestaurant(restaurantId, before.dishRatings.map((d) => d.dishId))
  res.json({ restaurant: { avgRating: Math.round(stats.avg * 10) / 10, reviewCount: stats.count } })
})
