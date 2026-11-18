import type { ErrorRequestHandler, RequestHandler } from 'express'
import { ZodError } from 'zod'

export class HttpError extends Error {
  constructor(public status: number, public code: string, message: string, public fields?: Record<string, string>) { super(message) }
}

/** Postgres error → friendly API error. 42P01 matters for the viva: a table dropped from the terminal. */
function fromPg(e: { code?: string; message?: string; table?: string; constraint?: string; detail?: string }): HttpError | null {
  switch (e.code) {
    case '42P01': {
      const t = /relation "([^"]+)"/.exec(e.message ?? '')?.[1] ?? 'a table'
      return new HttpError(503, 'TABLE_MISSING', `The "${t}" table is missing from PostgreSQL. Restore it with: cd backend && npm run reset`)
    }
    case '42703': return new HttpError(503, 'COLUMN_MISSING', `A column is missing: ${e.message}. Restore with: npm run reset`)
    case '23505': return new HttpError(409, 'DUPLICATE', e.detail ?? 'That already exists.')
    case '23503': return new HttpError(409, 'FOREIGN_KEY', e.detail ?? 'That refers to a row that does not exist.')
    case '23514': return new HttpError(400, 'CHECK_FAILED', `Rejected by constraint ${e.constraint}.`)
    case '22P02': return new HttpError(400, 'BAD_VALUE', 'Invalid value.')
    case 'ECONNREFUSED': return new HttpError(503, 'DB_DOWN', 'A database is not reachable. Is docker compose running?')
    default: return null
  }
}

export const notFound: RequestHandler = (req, _res, next) => next(new HttpError(404, 'NOT_FOUND', `No route ${req.method} ${req.path}`))

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  void _next
  let e: HttpError
  if (err instanceof HttpError) e = err
  else if (err instanceof ZodError) {
    const fields: Record<string, string> = {}
    for (const i of err.issues) fields[i.path.join('.') || '_'] = i.message
    e = new HttpError(400, 'VALIDATION', 'Some fields are invalid.', fields)
  } else if (err?.name === 'MongoServerSelectionError' || err?.name === 'MongoNetworkError') {
    e = new HttpError(503, 'MONGO_DOWN', 'MongoDB is not reachable. Is docker compose running?')
  } else e = fromPg(err) ?? new HttpError(500, 'INTERNAL', 'Something went wrong.')
  if (e.status >= 500 && e.code === 'INTERNAL') console.error(err)
  res.status(e.status).json({ error: { code: e.code, message: e.message, ...(e.fields ? { fields: e.fields } : {}) } })
}
