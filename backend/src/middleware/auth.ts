import type { RequestHandler, Response } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.ts'
import { HttpError } from './error.ts'

export const COOKIE = 'oota_session'
export interface AuthUser { id: number; fullName: string; email: string }
declare module 'express-serve-static-core' { interface Request { user?: AuthUser } }

export function setSession(res: Response, user: AuthUser) {
  const token = jwt.sign({ sub: user.id, name: user.fullName, email: user.email }, env.JWT_SECRET, { expiresIn: '7d' })
  res.cookie(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: env.NODE_ENV === 'production', maxAge: 7 * 24 * 3600 * 1000, path: '/' })
}
export const clearSession = (res: Response) => res.clearCookie(COOKIE, { path: '/' })

/** Reads the JWT cookie if present. */
export const readUser: RequestHandler = (req, _res, next) => {
  const token = req.cookies?.[COOKIE]
  if (token) {
    try {
      const p = jwt.verify(token, env.JWT_SECRET) as unknown as { sub: number; name: string; email: string }
      req.user = { id: Number(p.sub), fullName: p.name, email: p.email }
    } catch { /* expired or tampered: treat as logged out */ }
  }
  next()
}

export const requireUser: RequestHandler = (req, _res, next) => (req.user ? next() : next(new HttpError(401, 'UNAUTHENTICATED', 'Please log in.')))
