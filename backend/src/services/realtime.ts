/**
 * Live changes → browser.
 *  - PostgreSQL: LISTEN oota_changes (fed by row triggers + an event trigger in db/postgres/realtime.sql)
 *  - MongoDB: a change stream on the oota database (needs the replica set from docker-compose)
 * Every event is pushed to connected browsers over Server-Sent Events (GET /api/events).
 */
import type { Request, Response } from 'express'
import pg from 'pg'
import { env } from '../config/env.ts'
import { mdb } from '../db/mongo.ts'

export interface ChangeEvent { source: 'postgres' | 'mongo'; table: string; op: string; at: string }
const clients = new Set<Response>()
const recent: ChangeEvent[] = []

export function broadcast(e: Omit<ChangeEvent, 'at'>) {
  const ev = { ...e, at: new Date().toISOString() }
  recent.unshift(ev)
  recent.length = Math.min(recent.length, 30)
  const line = `event: change\ndata: ${JSON.stringify(ev)}\n\n`
  for (const res of clients) res.write(line)
}
export const recentEvents = () => recent

export function sseHandler(req: Request, res: Response) {
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' })
  res.flushHeaders()
  res.write(`event: hello\ndata: ${JSON.stringify({ at: new Date().toISOString() })}\n\n`)
  clients.add(res)
  const ping = setInterval(() => res.write(': ping\n\n'), 25_000)
  req.on('close', () => { clearInterval(ping); clients.delete(res) })
}

export async function startPgListener() {
  const connect = async () => {
    const client = new pg.Client({ connectionString: env.DATABASE_URL })
    client.on('notification', (m) => {
      try {
        const p = JSON.parse(m.payload ?? '{}') as { table?: string; op?: string }
        broadcast({ source: 'postgres', table: p.table ?? '?', op: p.op ?? '?' })
      } catch { /* ignore malformed */ }
    })
    client.on('error', () => { setTimeout(connect, 2000) })
    try {
      await client.connect()
      await client.query('LISTEN oota_changes')
      console.log('  realtime: listening to PostgreSQL (oota_changes)')
    } catch {
      setTimeout(connect, 3000)
    }
  }
  await connect()
}

export async function startMongoWatcher() {
  try {
    const stream = mdb().watch([], { fullDocument: 'default' })
    stream.on('change', (c) => {
      const coll = 'ns' in c && c.ns && 'coll' in c.ns ? String(c.ns.coll) : '?'
      broadcast({ source: 'mongo', table: coll, op: c.operationType })
    })
    stream.on('error', (e) => { console.warn('  realtime: mongo change stream stopped:', e.message); setTimeout(startMongoWatcher, 3000) })
    console.log('  realtime: watching MongoDB change stream')
  } catch (e) {
    console.warn('  realtime: mongo change streams unavailable (needs the replica set):', (e as Error).message)
  }
}
