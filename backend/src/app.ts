import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { env } from './config/env.ts'
import { readUser } from './middleware/auth.ts'
import { errorHandler, notFound } from './middleware/error.ts'
import { activityRouter } from './modules/activity/routes.ts'
import { adminRouter } from './modules/admin/routes.ts'
import { adminAuthRouter, authRouter, partnerAuthRouter } from './modules/auth/routes.ts'
import { catalogRouter } from './modules/catalog/routes.ts'
import { dishesRouter } from './modules/dishes/routes.ts'
import { favouritesRouter } from './modules/favourites/routes.ts'
import { ordersRouter } from './modules/orders/routes.ts'
import { partnerRouter } from './modules/partner/routes.ts'
import { preferencesRouter } from './modules/preferences/routes.ts'
import { recommendationsRouter } from './modules/recommendations/routes.ts'
import { restaurantsRouter } from './modules/restaurants/routes.ts'
import { reviewsRouter } from './modules/reviews/routes.ts'
import { UPLOAD_DIR, uploadsRouter } from './modules/uploads/routes.ts'
import { systemRouter } from './modules/system/routes.ts'

export function createApp() {
  const app = express()
  app.disable('x-powered-by')
  app.use(helmet())
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }))
  app.use(express.json({ limit: '100kb' }))
  app.use(cookieParser())
  app.use(readUser)

  // uploaded photos (covers, dishes) are plain static files; the DB stores '/uploads/<uuid>.<ext>'
  app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d', index: false }))

  const api = express.Router()
  api.use(uploadsRouter)
  api.use('/auth', authRouter)
  api.use('/partner/auth', partnerAuthRouter)
  api.use('/admin/auth', adminAuthRouter)
  api.use('/partner', partnerRouter)
  api.use('/admin', adminRouter)
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
