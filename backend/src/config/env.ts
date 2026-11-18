import 'dotenv/config'
import { z } from 'zod'

const schema = z.object({
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  MONGO_URL: z.string().min(1),
  MONGO_DB: z.string().default('oota'),
  JWT_SECRET: z.string().min(16),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
})

const parsed = schema.safeParse(process.env)
if (!parsed.success) {
  console.error('Invalid environment. Copy .env.example to backend/.env.\n', z.prettifyError(parsed.error))
  process.exit(1)
}
export const env = parsed.data
