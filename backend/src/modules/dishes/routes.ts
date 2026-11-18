import { Router } from 'express'
import { query } from '../../middleware/validate.ts'
import { discoverQuery, type DiscoverQuery } from '../restaurants/schema.ts'
import { discoverDishes } from '../restaurants/service.ts'

/** GET /api/dishes?q&cuisine=&diet=&price=&minRating=&flavour=&sort= — PostgreSQL full-text search + ILIKE fallback */
export const dishesRouter = Router()
dishesRouter.get('/dishes', query(discoverQuery), async (req, res) => {
  res.json(await discoverDishes(res.locals.query as DiscoverQuery, req.user?.id))
})
