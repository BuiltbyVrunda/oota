/** npm run resync — recompute every cached rating in PostgreSQL from the MongoDB reviews (idempotent repair). */
import { pool } from '../db/pg.ts'
import { mongo } from '../db/mongo.ts'
import { syncAll } from '../services/reviewSync.ts'

await mongo.connect()
console.log('re-synced', await syncAll())
await mongo.close()
await pool.end()
