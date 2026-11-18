import { Router } from 'express'
import { query } from '../../middleware/validate.ts'
import { discoverQuery, type DiscoverQuery } from './schema.ts'
import { discoverRestaurants } from './service.ts'

/** GET /api/restaurants?q&cuisine=&diet=&price=&minRating=&flavour=&sort=&limit=&offset= */
export const restaurantsRouter = Router()
restaurantsRouter.get('/restaurants', query(discoverQuery), async (req, res) => {
  res.json(await discoverRestaurants(res.locals.query as DiscoverQuery, req.user?.id))
})
