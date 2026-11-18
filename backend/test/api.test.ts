/**
 * API tests against the real dockerised databases (run `docker compose up -d && npm run reset` first).
 * Every test cleans up what it writes.
 */
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.ts'
import { pool } from '../src/db/pg.ts'
import { col, mongo } from '../src/db/mongo.ts'
import { syncRestaurant } from '../src/services/reviewSync.ts'

const app = createApp()
const login = async (email: string) => {
  const agent = request.agent(app)
  await agent.post('/api/auth/login').send({ email, password: 'demo1234' }).expect(200)
  return agent
}

beforeAll(async () => { await mongo.connect() })
afterAll(async () => { await mongo.close(); await pool.end() })

describe('auth', () => {
  const email = `test.${Date.now()}@oota.test`
  afterAll(async () => { await pool.query('DELETE FROM users WHERE email = $1', [email]) })

  it('signs up, sets an httpOnly cookie, and /me works', async () => {
    const agent = request.agent(app)
    const res = await agent.post('/api/auth/signup').send({ fullName: 'Test Diner', email, password: 'longenough1' }).expect(201)
    expect(String(res.headers['set-cookie'])).toMatch(/oota_session=.*HttpOnly/i)
    const me = await agent.get('/api/auth/me').expect(200)
    expect(me.body.user.email).toBe(email)
  })
  it('stores a bcrypt hash, never the password', async () => {
    const { rows } = await pool.query('SELECT password_hash FROM users WHERE email = $1', [email])
    expect(rows[0].password_hash).toMatch(/^\$2[aby]\$10\$/)
  })
  it('rejects a wrong password and a duplicate email with field errors', async () => {
    const bad = await request(app).post('/api/auth/login').send({ email, password: 'nope' }).expect(401)
    expect(bad.body.error.fields.password).toBeTruthy()
    const dup = await request(app).post('/api/auth/signup').send({ fullName: 'X Y', email, password: 'longenough1' }).expect(409)
    expect(dup.body.error.code).toBe('EMAIL_TAKEN')
  })
  it('validates input with zod', async () => {
    const res = await request(app).post('/api/auth/signup').send({ fullName: 'A', email: 'not-an-email', password: 'short' }).expect(400)
    expect(Object.keys(res.body.error.fields)).toEqual(expect.arrayContaining(['fullName', 'email', 'password']))
  })
})

describe('discovery (SQL)', () => {
  it('filters restaurants by diet + price + rating together', async () => {
    const res = await request(app).get('/api/restaurants?diet=veg&price=1&minRating=4').expect(200)
    expect(res.body.length).toBeGreaterThan(0)
    for (const r of res.body) {
      expect(r.item.priceLevel).toBe(1)
      expect(r.item.avgRating).toBeGreaterThanOrEqual(4)
    }
  })
  it('full-text searches dishes, including prefixes', async () => {
    const full = await request(app).get('/api/dishes?q=ghee%20roast').expect(200)
    expect(full.body.map((d: { item: { name: string } }) => d.item.name)).toContain('Ghee Roast Dosa')
    const prefix = await request(app).get('/api/dishes?q=dos').expect(200)
    expect(prefix.body.length).toBeGreaterThan(3)
  })
  it('flavour filter uses array containment', async () => {
    const res = await request(app).get('/api/dishes?flavour=smoky,spicy').expect(200)
    for (const d of res.body) expect(d.item.flavourTags).toEqual(expect.arrayContaining(['smoky', 'spicy']))
  })
})

describe('review → rating sync (Mongo → Postgres)', () => {
  it('upserting a review updates the cached average in Postgres, and deleting restores it', async () => {
    const agent = await login('meera@oota.demo')
    const restaurantId = 15 // Momo Mandala — Meera has not reviewed it
    const before = (await pool.query('SELECT avg_rating::float AS a, review_count AS n FROM restaurants WHERE restaurant_id = $1', [restaurantId])).rows[0]
    const res = await agent.post(`/api/restaurants/${restaurantId}/reviews`).send({ rating: 1, text: 'Testing the sync path, please ignore.', tags: [], dishRatings: [] }).expect(201)
    const after = (await pool.query('SELECT avg_rating::float AS a, review_count AS n FROM restaurants WHERE restaurant_id = $1', [restaurantId])).rows[0]
    expect(after.n).toBe(before.n + 1)
    expect(after.a).toBeLessThan(before.a)
    expect(res.body.restaurant.reviewCount).toBe(after.n)
    // edit = upsert, still one review
    await agent.post(`/api/restaurants/${restaurantId}/reviews`).send({ rating: 2, text: 'Edited test review, please ignore.', tags: [], dishRatings: [] }).expect(200)
    expect(await col.reviews().countDocuments({ userId: 3, restaurantId })).toBe(1)
    await agent.delete(`/api/restaurants/${restaurantId}/reviews/mine`).expect(200)
    const restored = (await pool.query('SELECT avg_rating::float AS a, review_count AS n FROM restaurants WHERE restaurant_id = $1', [restaurantId])).rows[0]
    expect(restored).toEqual(before)
  })
  it('the sync is idempotent', async () => {
    const a = await syncRestaurant(1, [])
    const b = await syncRestaurant(1, [])
    expect(a).toEqual(b)
  })
})

describe('recommendations', () => {
  it('the three demo users get clearly different dashboards', async () => {
    const tops = await Promise.all(['ananya@oota.demo', 'rohan@oota.demo', 'meera@oota.demo'].map(async (e) => {
      const agent = await login(e)
      const res = await agent.get('/api/me/recommendations').expect(200)
      return res.body.top.items.slice(0, 5).map((r: { item: { slug: string } }) => r.item.slug) as string[]
    }))
    const overlap = (a: string[], b: string[]) => a.filter((x) => b.includes(x)).length
    expect(overlap(tops[0], tops[1])).toBeLessThanOrEqual(1)
    expect(overlap(tops[1], tops[2])).toBeLessThanOrEqual(1)
    expect(overlap(tops[0], tops[2])).toBeLessThanOrEqual(2)
  })
  it('a vegan never gets a non-vegan dish (SQL hard filter)', async () => {
    const agent = await login('meera@oota.demo')
    const res = await agent.get('/api/me/recommendations').expect(200)
    for (const d of [...res.body.trending.dishes, ...res.body.searched.dishes]) expect(d.item.diet).toBe('vegan')
  })
})

describe('orders (transaction)', () => {
  it('commits the order and the trigger computes the total', async () => {
    const agent = await login('rohan@oota.demo')
    const res = await agent.post('/api/orders').send({ restaurantId: 4, items: [{ dishId: 28, quantity: 2 }, { dishId: 29, quantity: 1 }] }).expect(201)
    const { rows } = await pool.query('SELECT SUM(quantity * unit_price)::float AS s FROM order_items WHERE order_id = $1', [res.body.id])
    expect(res.body.total).toBe(rows[0].s)
    await pool.query('DELETE FROM orders WHERE order_id = $1', [res.body.id])
  })
  it('rolls back completely when one item is invalid', async () => {
    const agent = await login('rohan@oota.demo')
    const count = async () => (await pool.query('SELECT COUNT(*)::int AS n FROM orders')).rows[0].n
    const before = await count()
    const res = await agent.post('/api/orders').send({ restaurantId: 4, items: [{ dishId: 28, quantity: 1 }, { dishId: 1, quantity: 1 }] }).expect(400)
    expect(res.body.error.code).toBe('BAD_DISH')
    expect(await count()).toBe(before)
  })
})

describe('errors', () => {
  it('never leaks stack traces and uses the error envelope', async () => {
    const res = await request(app).get('/api/nope').expect(404)
    expect(res.body).toEqual({ error: { code: 'NOT_FOUND', message: expect.any(String) } })
  })
  it('requires login for /me routes', async () => {
    await request(app).get('/api/me/favourites').expect(401)
  })
})
