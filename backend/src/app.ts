import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { env } from './config/env.ts'
import { readUser } from './middleware/auth.ts'
import { errorHandler, notFound } from './middleware/error.ts'
import { activityRouter } from './modules/activity/routes.ts'
import { authRouter } from './modules/auth/routes.ts'
import { catalogRouter } from './modules/catalog/routes.ts'
import { dishesRouter } from './modules/dishes/routes.ts'
import { favouritesRouter } from './modules/favourites/routes.ts'
import { ordersRouter } from './modules/orders/routes.ts'
import { preferencesRouter } from './modules/preferences/routes.ts'
import { recommendationsRouter } from './modules/recommendations/routes.ts'
import { restaurantsRouter } from './modules/restaurants/routes.ts'
import { reviewsRouter } from './modules/reviews/routes.ts'
import { systemRouter } from './modules/system/routes.ts'

export function createApp() {
  const app = express()
  app.disable('x-powered-by')
  app.use(helmet())
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }))
  app.use(express.json({ limit: '100kb' }))
  app.use(cookieParser())
  app.use(readUser)

  const api = express.Router()
  api.use('/auth', authRouter)
  api.use(systemRouter)
  api.use(restaurantsRouter) // GET /restaurants (list) — before /restaurants/:slug
  api.use(catalogRouter)
  api.use(dishesRouter)
  api.use(reviewsRouter)
  api.use(preferencesRouter)
  api.use(favouritesRouter)
  api.use(activityRouter)
  api.use(recommendationsRouter)
  api.use(ordersRouter)
  app.use('/api', api)

  app.use(notFound)
  app.use(errorHandler)
  return app
}
