import bcrypt from 'bcryptjs'
import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { q } from '../../db/pg.ts'
import { clearSession, setSession, type Role } from '../../middleware/auth.ts'
import { HttpError } from '../../middleware/error.ts'
import { body } from '../../middleware/validate.ts'
import { createRestaurantWithOwner, newRestaurantSchema, type NewRestaurant } from '../../services/restaurants.ts'

const signupSchema = z.object({
  fullName: z.string().trim().min(2, 'Tell us your name (at least 2 letters).').max(100),
  email: z.string().trim().toLowerCase().regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, 'Enter an email like name@example.com.').max(150),
  password: z.string().min(8, 'Use at least 8 characters.').max(200),
})
const loginSchema = z.object({ email: z.string().trim().toLowerCase().min(3), password: z.string().min(1) })
type Login = z.infer<typeof loginSchema>

// brute-force protection on credential endpoints only (not /me, which the app calls on every live update)
const limiter = rateLimit({
  windowMs: 10 * 60_000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many attempts. Wait a few minutes and try again.' } },
})

/** Each account type lives in its own table, so each login queries a different one. */
const ACCOUNTS: Record<Role, { sql: string; noAccount: string }> = {
  diner: {
    sql: 'SELECT user_id AS id, full_name AS "fullName", email, password_hash AS hash FROM users WHERE email = $1',
    noAccount: 'No diner account with that email. Check the spelling or create one.',
  },
  partner: {
    sql: `SELECT o.owner_id AS id, o.full_name AS "fullName", o.email, o.password_hash AS hash, o.restaurant_id AS "restaurantId"
            FROM restaurant_owners o WHERE o.email = $1`,
    noAccount: 'No restaurant partner account with that email.',
  },
  admin: {
    sql: 'SELECT admin_id AS id, full_name AS "fullName", email, password_hash AS hash FROM admins WHERE email = $1',
    noAccount: 'No admin account with that email.',
  },
}
const ME_SQL: Record<Role, string> = {
  diner: 'SELECT user_id AS id, full_name AS "fullName", email FROM users WHERE user_id = $1',
  partner: `SELECT o.owner_id AS id, o.full_name AS "fullName", o.email, o.restaurant_id AS "restaurantId",
                   r.name AS "restaurantName", r.slug AS "restaurantSlug", r.status AS "restaurantStatus"
              FROM restaurant_owners o JOIN restaurants r ON r.restaurant_id = o.restaurant_id WHERE o.owner_id = $1`,
  admin: 'SELECT admin_id AS id, full_name AS "fullName", email FROM admins WHERE admin_id = $1',
}

function loginRoute(role: Role) {
  return async (req: import('express').Request, res: import('express').Response) => {
    const { email, password } = req.body as Login
    const [u] = await q<{ id: number; fullName: string; email: string; hash: string; restaurantId?: number }>(ACCOUNTS[role].sql, [email])
    if (!u) throw new HttpError(401, 'NO_ACCOUNT', ACCOUNTS[role].noAccount, { email: 'No account with that email.' })
    if (!(await bcrypt.compare(password, u.hash))) throw new HttpError(401, 'BAD_PASSWORD', 'That password doesn’t match. Demo accounts use demo1234.', { password: 'Wrong password.' })
    const who = { id: u.id, fullName: u.fullName, email: u.email, ...(u.restaurantId ? { restaurantId: u.restaurantId } : {}) }
    setSession(res, role, who)
    const [me] = await q(ME_SQL[role], [u.id])
    res.json({ user: me })
  }
}

function meRoute(role: Role) {
  return async (req: import('express').Request, res: import('express').Response) => {
    const id = role === 'diner' ? req.user?.id : role === 'partner' ? req.partner?.id : req.admin?.id
    if (!id) { res.json({ user: null }); return }
    // re-read from Postgres so an account deleted in the terminal (or by an admin) is signed out
    const [u] = await q(ME_SQL[role], [id])
    if (!u) clearSession(res, role)
    res.json({ user: u ?? null })
  }
}

/** Diners: /api/auth/* */
export const authRouter = Router()
authRouter.post('/signup', limiter, body(signupSchema), async (req, res) => {
  const { fullName, email, password } = req.body as z.infer<typeof signupSchema>
  const exists = await q('SELECT 1 FROM users WHERE email = $1', [email])
  if (exists.length) throw new HttpError(409, 'EMAIL_TAKEN', 'An account with this email already exists. Log in instead.', { email: 'Already registered.' })
  const hash = await bcrypt.hash(password, 10)
  const [u] = await q<{ id: number; fullName: string; email: string }>(
    'INSERT INTO users (full_name, email, password_hash) VALUES ($1, $2, $3) RETURNING user_id AS id, full_name AS "fullName", email',
    [fullName, email, hash])
  setSession(res, 'diner', u)
  res.status(201).json({ user: u })
})
authRouter.post('/login', limiter, body(loginSchema), loginRoute('diner'))
authRouter.post('/logout', (_req, res) => { clearSession(res, 'diner'); res.status(204).end() })
authRouter.get('/me', meRoute('diner'))

/** Restaurant partners: /api/partner/auth/* */
export const partnerAuthRouter = Router()

/** Self sign-up: restaurant + cuisines + owner login in one transaction, status 'pending' until an admin approves. */
partnerAuthRouter.post('/signup', limiter, body(newRestaurantSchema), async (req, res) => {
  const b = req.body as NewRestaurant
  const taken = await q('SELECT 1 FROM restaurant_owners WHERE email = $1', [b.ownerEmail])
  if (taken.length) throw new HttpError(409, 'EMAIL_TAKEN', 'A partner account with this email already exists. Log in instead.', { ownerEmail: 'Already registered.' })
  const r = await createRestaurantWithOwner(b, 'pending')
  setSession(res, 'partner', { id: r.ownerId, fullName: b.ownerName, email: b.ownerEmail, restaurantId: r.id })
  const [me] = await q(ME_SQL.partner, [r.ownerId])
  res.status(201).json({ user: me })
})
partnerAuthRouter.post('/login', limiter, body(loginSchema), loginRoute('partner'))
partnerAuthRouter.post('/logout', (_req, res) => { clearSession(res, 'partner'); res.status(204).end() })
partnerAuthRouter.get('/me', meRoute('partner'))

/** Admins: /api/admin/auth/* */
export const adminAuthRouter = Router()
adminAuthRouter.post('/login', limiter, body(loginSchema), loginRoute('admin'))
adminAuthRouter.post('/logout', (_req, res) => { clearSession(res, 'admin'); res.status(204).end() })
adminAuthRouter.get('/me', meRoute('admin'))
