import pg from 'pg'
import { env } from '../config/env.ts'

// NUMERIC comes back as string by default; ratings/prices are small, so parse to number.
pg.types.setTypeParser(1700, (v) => Number(v))

export const pool = new pg.Pool({ connectionString: env.DATABASE_URL, max: 10 })

/** Raw parameterised SQL — the queries are deliberately visible for the viva. */
export async function q<T extends pg.QueryResultRow = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T[]> {
  const res = await pool.query<T>(text, params)
  return res.rows
}

/** BEGIN … COMMIT, ROLLBACK on any error. */
export async function tx<T>(fn: (c: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const out = await fn(client)
    await client.query('COMMIT')
    return out
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}
