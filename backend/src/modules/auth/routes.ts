import bcrypt from 'bcryptjs'
import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { q } from '../../db/pg.ts'
import { clearSession, requireUser, setSession } from '../../middleware/auth.ts'
import { HttpError } from '../../middleware/error.ts'
import { body } from '../../middleware/validate.ts'

const signupSchema = z.object({
  fullName: z.string().trim().min(2, 'Tell us your name (at least 2 letters).').max(100),
  email: z.string().trim().toLowerCase().regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, 'Enter an email like name@example.com.').max(150),
  password: z.string().min(8, 'Use at least 8 characters.').max(200),
})
const loginSchema = z.object({ email: z.string().trim().toLowerCase().min(3), password: z.string().min(1) })

export const authRouter = Router()
authRouter.use(rateLimit({ windowMs: 15 * 60_000, limit: 100, standardHeaders: 'draft-8', legacyHeaders: false }))

authRouter.post('/signup', body(signupSchema), async (req, res) => {
  const { fullName, email, password } = req.body as z.infer<typeof signupSchema>
  const exists = await q('SELECT 1 FROM users WHERE email = $1', [email])
  if (exists.length) throw new HttpError(409, 'EMAIL_TAKEN', 'An account with this email already exists. Log in instead.', { email: 'Already registered.' })
  const hash = await bcrypt.hash(password, 10)
  const [u] = await q<{ id: number; fullName: string; email: string }>(
    'INSERT INTO users (full_name, email, password_hash) VALUES ($1, $2, $3) RETURNING user_id AS id, full_name AS "fullName", email',
    [fullName, email, hash])
  setSession(res, u)
  res.status(201).json({ user: u })
})

authRouter.post('/login', body(loginSchema), async (req, res) => {
  const { email, password } = req.body as z.infer<typeof loginSchema>
  const [u] = await q<{ id: number; fullName: string; email: string; hash: string }>(
    'SELECT user_id AS id, full_name AS "fullName", email, password_hash AS hash FROM users WHERE email = $1', [email])
  if (!u) throw new HttpError(401, 'NO_ACCOUNT', 'No account with that email. Check the spelling or create one.', { email: 'No account with that email.' })
  if (!(await bcrypt.compare(password, u.hash))) throw new HttpError(401, 'BAD_PASSWORD', 'That password doesn’t match. Demo accounts use demo1234.', { password: 'Wrong password.' })
  const user = { id: u.id, fullName: u.fullName, email: u.email }
  setSession(res, user)
  res.json({ user })
})

authRouter.post('/logout', (_req, res) => { clearSession(res); res.status(204).end() })

authRouter.get('/me', requireUser, async (req, res) => {
  // re-read from Postgres so a user deleted in the terminal is logged out
  const [u] = await q('SELECT user_id AS id, full_name AS "fullName", email FROM users WHERE user_id = $1', [req.user!.id])
  if (!u) { clearSession(res); throw new HttpError(401, 'UNAUTHENTICATED', 'Your account no longer exists.') }
  res.json({ user: u })
})
