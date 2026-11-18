import type { RequestHandler, Response } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.ts'
import { HttpError } from './error.ts'

/**
 * Three separate account types, three separate logins, three separate httpOnly cookies —
 * so a diner, a restaurant partner and an admin can each be signed in at once (handy for the demo).
 *   diner   → users             (browse, review, save)
 *   partner → restaurant_owners (list and manage food for their own restaurant)
 *   admin   → admins            (manage everything)
 */
export type Role = 'diner' | 'partner' | 'admin'
export const COOKIES: Record<Role, string> = { diner: 'oota_session', partner: 'oota_partner', admin: 'oota_admin' }

export interface AuthUser { id: number; fullName: string; email: string }
export interface AuthPartner extends AuthUser { restaurantId: number }

declare module 'express-serve-static-core' {
  interface Request { user?: AuthUser; partner?: AuthPartner; admin?: AuthUser }
}

interface Claims { sub: number; role: Role; name: string; email: string; rid?: number }

export function setSession(res: Response, role: Role, who: AuthUser & { restaurantId?: number }) {
  const claims: Claims = { sub: who.id, role, name: who.fullName, email: who.email, ...(who.restaurantId ? { rid: who.restaurantId } : {}) }
  const token = jwt.sign(claims, env.JWT_SECRET, { expiresIn: '7d' })
  res.cookie(COOKIES[role], token, { httpOnly: true, sameSite: 'lax', secure: env.NODE_ENV === 'production', maxAge: 7 * 24 * 3600 * 1000, path: '/' })
}
export const clearSession = (res: Response, role: Role) => res.clearCookie(COOKIES[role], { path: '/' })

function read(token: string | undefined, role: Role): Claims | null {
  if (!token) return null
  try {
    const c = jwt.verify(token, env.JWT_SECRET) as unknown as Claims
    return c.role === role ? c : null // a diner token can't be replayed as an admin token
  } catch {
    return null
  }
}

/** Reads whichever session cookies are present. */
export const readUser: RequestHandler = (req, _res, next) => {
  const d = read(req.cookies?.[COOKIES.diner], 'diner')
  if (d) req.user = { id: Number(d.sub), fullName: d.name, email: d.email }
  const p = read(req.cookies?.[COOKIES.partner], 'partner')
  if (p && p.rid) req.partner = { id: Number(p.sub), fullName: p.name, email: p.email, restaurantId: p.rid }
  const a = read(req.cookies?.[COOKIES.admin], 'admin')
  if (a) req.admin = { id: Number(a.sub), fullName: a.name, email: a.email }
  next()
}

export const requireUser: RequestHandler = (req, _res, next) => (req.user ? next() : next(new HttpError(401, 'UNAUTHENTICATED', 'Please log in.')))
export const requirePartner: RequestHandler = (req, _res, next) => (req.partner ? next() : next(new HttpError(401, 'UNAUTHENTICATED', 'Please log in to the partner portal.')))
export const requireAdmin: RequestHandler = (req, _res, next) => (req.admin ? next() : next(new HttpError(401, 'UNAUTHENTICATED', 'Please log in as an admin.')))
