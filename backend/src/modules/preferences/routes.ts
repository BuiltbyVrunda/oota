import { Router } from 'express'
import { z } from 'zod'
import { col } from '../../db/mongo.ts'
import { requireUser } from '../../middleware/auth.ts'
import { body } from '../../middleware/validate.ts'
import { toPrefs } from '../../services/signals.ts'

const prefsSchema = z.object({
  cuisineIds: z.array(z.number().int().positive()).max(18),
  diet: z.enum(['any', 'veg', 'egg', 'vegan']),
  allergens: z.array(z.enum(['nuts', 'dairy', 'gluten', 'egg', 'shellfish', 'soy'])).max(6),
  spiceLevel: z.number().int().min(0).max(3),
  flavours: z.array(z.enum(['spicy', 'tangy', 'sweet', 'creamy', 'smoky', 'mild', 'rich', 'fresh', 'crispy', 'comforting'])).max(10),
  onboarded: z.boolean().default(true),
})

export const preferencesRouter = Router()

preferencesRouter.get('/me/preferences', requireUser, async (req, res) => {
  res.json(toPrefs(await col.prefs().findOne({ _id: req.user!.id })))
})

/** One document per user, _id = the Postgres user_id (the link between the two databases). */
preferencesRouter.put('/me/preferences', requireUser, body(prefsSchema), async (req, res) => {
  const p = req.body as z.infer<typeof prefsSchema>
  const existing = await col.prefs().findOne({ _id: req.user!.id })
  await col.prefs().updateOne(
    { _id: req.user!.id },
    { $set: { cuisineIds: p.cuisineIds, diet: p.diet, allergens: p.allergens, spiceLevel: p.spiceLevel as 0, flavours: p.flavours, updatedAt: new Date(),
      onboardedAt: p.onboarded ? existing?.onboardedAt ?? new Date() : null } },
    { upsert: true },
  )
  res.json(toPrefs(await col.prefs().findOne({ _id: req.user!.id })))
})
