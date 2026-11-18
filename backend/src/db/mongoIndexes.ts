import { col } from './mongo.ts'

/** Created on startup (idempotent). Each one exists for a specific query — see docs/REPORT.md. */
export async function ensureMongoIndexes() {
  await Promise.all([
    // reviews for a restaurant, newest first (restaurant page)
    col.reviews().createIndex({ restaurantId: 1, createdAt: -1 }, { name: 'by_restaurant_recent' }),
    // a user's own reviews (recommender rating signal)
    col.reviews().createIndex({ userId: 1, createdAt: -1 }, { name: 'by_user_recent' }),
    // one review per user per place — editing is an upsert
    col.reviews().createIndex({ userId: 1, restaurantId: 1 }, { name: 'one_per_user_place', unique: true }),
    // last 30 searches per user
    col.searches().createIndex({ userId: 1, createdAt: -1 }, { name: 'by_user_recent' }),
    // search history expires after 90 days (TTL)
    col.searches().createIndex({ createdAt: 1 }, { name: 'ttl_90d', expireAfterSeconds: 90 * 24 * 3600 }),
    // recently viewed
    col.views().createIndex({ userId: 1, viewedAt: -1 }, { name: 'by_user_recent' }),
  ])
}
