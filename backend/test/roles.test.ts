/** Roles, approval and order-status rules. Runs against the dockerised databases; cleans up after itself. */
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.ts'
import { pool } from '../src/db/pg.ts'
import { mongo } from '../src/db/mongo.ts'

const app = createApp()
const agent = async (path: string, email: string) => {
  const a = request.agent(app)
  await a.post(path).send({ email, password: 'demo1234' }).expect(200)
  return a
}
const COVER = 'https://images.unsplash.com/photo-1694849789325-914b71ab4075?w=1200&h=700&fit=crop&q=70&auto=format'

beforeAll(async () => { await mongo.connect() })
afterAll(async () => {
  await pool.query("DELETE FROM restaurants WHERE slug LIKE 'roles-test-%'")
  await mongo.close(); await pool.end()
})

describe('three separate logins', () => {
  it('each login only accepts its own kind of account', async () => {
    await request(app).post('/api/partner/auth/login').send({ email: 'ananya@oota.demo', password: 'demo1234' }).expect(401)
    await request(app).post('/api/admin/auth/login').send({ email: 'tuppa-and-co@partner.oota.demo', password: 'demo1234' }).expect(401)
    await request(app).post('/api/auth/login').send({ email: 'admin@oota.demo', password: 'demo1234' }).expect(401)
  })
  it('sessions are separate cookies and do not grant each other’s APIs', async () => {
    const diner = await agent('/api/auth/login', 'ananya@oota.demo')
    await diner.get('/api/partner/menu').expect(401)
    await diner.get('/api/admin/overview').expect(401)
    const partner = await agent('/api/partner/auth/login', 'tuppa-and-co@partner.oota.demo')
    await partner.get('/api/admin/overview').expect(401)
    await partner.get('/api/me/favourites').expect(401)
  })
})

describe('partners only touch their own menu', () => {
  it('cannot edit another restaurant’s dish; cannot delete an ordered dish', async () => {
    const partner = await agent('/api/partner/auth/login', 'tuppa-and-co@partner.oota.demo')
    await partner.patch('/api/partner/dishes/30').send({ price: 1 }).expect(404) // dish 30 belongs to Hosa Biryani Mane
    const { rows: [ordered] } = await pool.query('SELECT oi.dish_id AS id FROM order_items oi JOIN dishes d USING (dish_id) WHERE d.restaurant_id = 1 LIMIT 1')
    if (ordered) {
      const res = await partner.delete(`/api/partner/dishes/${ordered.id}`).expect(409)
      expect(res.body.error.code).toBe('HAS_ORDERS')
    }
  })
})

describe('partner self sign-up → admin approval', () => {
  it('a new restaurant is hidden from diners until approved', async () => {
    const slug = `roles-test-${Date.now()}`
    const res = await request(app).post('/api/partner/auth/signup').send({
      name: slug, area: 'Ulsoor', address: '1 Test Road', costForTwo: 300, opensAt: '08:00', closesAt: '20:00',
      cuisineIds: [1], coverUrl: COVER, ownerName: 'Test Owner', ownerEmail: `${slug}@partner.oota.test`, ownerPassword: 'longenough1',
    }).expect(201)
    expect(res.body.user.restaurantStatus).toBe('pending')
    await request(app).get(`/api/restaurants/${slug}`).expect(404)
    const admin = await agent('/api/admin/auth/login', 'admin@oota.demo')
    await admin.patch(`/api/admin/restaurants/${res.body.user.restaurantId}`).send({ status: 'approved' }).expect(200)
    await request(app).get(`/api/restaurants/${slug}`).expect(200)
  })
  it('the status column rejects anything but pending/approved/rejected (CHECK)', async () => {
    await expect(pool.query("UPDATE restaurants SET status = 'maybe' WHERE restaurant_id = 1")).rejects.toThrow(/check constraint/)
  })
})

describe('order status only moves forward', () => {
  it('PLACED → PREPARING → DELIVERED; skipping or going back is rejected', async () => {
    const diner = await agent('/api/auth/login', 'rohan@oota.demo')
    const o = (await diner.post('/api/orders').send({ restaurantId: 1, items: [{ dishId: 1, quantity: 1 }] }).expect(201)).body
    const partner = await agent('/api/partner/auth/login', 'tuppa-and-co@partner.oota.demo')
    await partner.patch(`/api/partner/orders/${o.id}`).send({ status: 'DELIVERED' }).expect(409) // can't skip PREPARING
    await partner.patch(`/api/partner/orders/${o.id}`).send({ status: 'PREPARING' }).expect(200)
    await diner.patch(`/api/me/orders/${o.id}/cancel`).expect(409) // too late for the diner
    await partner.patch(`/api/partner/orders/${o.id}`).send({ status: 'DELIVERED' }).expect(200)
    await partner.patch(`/api/partner/orders/${o.id}`).send({ status: 'CANCELLED' }).expect(409) // delivered is final
    await pool.query('DELETE FROM orders WHERE order_id = $1', [o.id])
  })
})
