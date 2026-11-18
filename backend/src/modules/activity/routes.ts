import { Router } from 'express'
import { z } from 'zod'
import { col } from '../../db/mongo.ts'
import { requireUser } from '../../middleware/auth.ts'
import { body } from '../../middleware/validate.ts'

const searchSchema = z.object({
  query: z.string().trim().min(1).max(100),
  filters: z.record(z.string(), z.unknown()).default({}),
  resultCount: z.number().int().min(0).optional(),
  clickedRestaurantId: z.number().int().positive().optional(),
})
const viewSchema = z.object({ restaurantId: z.number().int().positive() })

export const activityRouter = Router()

/** Search history (TTL 90 days via index). The filter snapshot shape varies per search — a document fits it. */
activityRouter.post('/me/searches', requireUser, body(searchSchema), async (req, res) => {
  const b = req.body as z.infer<typeof searchSchema>
  await col.searches().insertOne({ userId: req.user!.id, query: b.query, filters: b.filters, ...(b.resultCount !== undefined ? { resultCount: b.resultCount } : {}),
    ...(b.clickedRestaurantId ? { clickedRestaurantId: b.clickedRestaurantId } : {}), createdAt: new Date() })
  res.status(201).json({ ok: true })
})

activityRouter.get('/me/searches', requireUser, async (req, res) => {
  const limit = Math.min(30, Number(req.query.limit ?? 30) || 30)
  const docs = await col.searches().find({ userId: req.user!.id }).sort({ createdAt: -1 }).limit(limit).toArray()
  res.json(docs.map((d) => ({ query: d.query, filters: d.filters, at: d.createdAt.toISOString(), ...(d.clickedRestaurantId ? { clickedRestaurantId: d.clickedRestaurantId } : {}) })))
})

activityRouter.delete('/me/searches', requireUser, async (req, res) => {
  await col.searches().deleteMany({ userId: req.user!.id })
  res.status(204).end()
})

/** Recently viewed: one entry per restaurant, newest first, keep the last 20. */
activityRouter.post('/me/views', requireUser, body(viewSchema), async (req, res) => {
  const userId = req.user!.id
  const { restaurantId } = req.body as z.infer<typeof viewSchema>
  await col.views().deleteMany({ userId, restaurantId })
  await col.views().insertOne({ userId, restaurantId, viewedAt: new Date() })
  const old = await col.views().find({ userId }).sort({ viewedAt: -1 }).skip(20).project({ _id: 1 }).toArray()
  if (old.length) await col.views().deleteMany({ _id: { $in: old.map((o) => o._id) } })
  res.status(201).json({ ok: true })
})

activityRouter.get('/me/views', requireUser, async (req, res) => {
  const docs = await col.views().find({ userId: req.user!.id }).sort({ viewedAt: -1 }).limit(20).toArray()
  res.json(docs.map((d) => ({ restaurantId: d.restaurantId, at: d.viewedAt.toISOString() })))
})
