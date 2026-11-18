/** npm run migrate — (re)creates the PostgreSQL schema from db/postgres/*.sql. Destructive: drops and recreates tables. */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pool } from '../db/pg.ts'

const dir = resolve(dirname(fileURLToPath(import.meta.url)), '../../../db/postgres')
for (const file of ['schema.sql', 'realtime.sql']) {
  process.stdout.write(`  applying ${file} … `)
  await pool.query(readFileSync(`${dir}/${file}`, 'utf8'))
  console.log('ok')
}
const { rows } = await pool.query<{ t: string }>("SELECT string_agg(tablename, ', ' ORDER BY tablename) AS t FROM pg_tables WHERE schemaname = 'public'")
console.log(`  tables: ${rows[0].t}`)
await pool.end()
