import { Router } from 'express'
import { requireUser } from '../../middleware/auth.ts'
import { dashboardFor } from '../../services/recommender.ts'

export const recommendationsRouter = Router()

/** The personalised dashboard: same DashboardData shape the Phase-1 hook produced. */
recommendationsRouter.get('/me/recommendations', requireUser, async (req, res) => {
  res.json(await dashboardFor(req.user!.id))
})
