import { createApp } from './app.ts'
import { env } from './config/env.ts'
import { pool } from './db/pg.ts'
import { mongo } from './db/mongo.ts'
import { ensureMongoIndexes } from './db/mongoIndexes.ts'
import { startMongoWatcher, startPgListener } from './services/realtime.ts'

console.log('Oota API starting…')
try {
  await pool.query('SELECT 1')
  console.log('  postgres: connected')
} catch (e) {
  console.error('  postgres: NOT reachable — run `docker compose up -d`.', (e as Error).message)
}
try {
  await mongo.connect()
  await ensureMongoIndexes()
  console.log('  mongo: connected, indexes ensured')
  await startMongoWatcher()
} catch (e) {
  console.error('  mongo: NOT reachable — run `docker compose up -d`.', (e as Error).message)
}
await startPgListener()

const server = createApp().listen(env.PORT, () => console.log(`  listening on http://localhost:${env.PORT}/api`))

const shutdown = async () => {
  server.close()
  await Promise.allSettled([pool.end(), mongo.close()])
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
