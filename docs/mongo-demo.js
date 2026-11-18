// MongoDB showcase — run: docker exec -i oota-mongo mongosh oota --quiet < docs/mongo-demo.js
print('--- Pipeline 1: per-restaurant average, count and 1–5★ distribution ($group)')
db.reviews.aggregate([
  { $match: { restaurantId: { $in: [1, 5, 9] } } },
  { $group: { _id: '$restaurantId', avg: { $avg: '$rating' }, count: { $sum: 1 },
      r5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } }, r4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
      r3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } }, r2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
      r1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } } } },
  { $project: { avg: { $round: ['$avg', 2] }, count: 1, r5: 1, r4: 1, r3: 1, r2: 1, r1: 1 } },
  { $sort: { _id: 1 } },
]).toArray().forEach((d) => print(JSON.stringify(d)))

print('--- Pipeline 2: a diner\'s favourite review tags ($unwind → $group → $sort)')
db.reviews.aggregate([
  { $match: { userId: 2 } }, { $unwind: '$tags' },
  { $group: { _id: '$tags', count: { $sum: 1 }, avgRating: { $avg: '$rating' } } },
  { $sort: { count: -1, avgRating: -1 } }, { $limit: 5 },
  { $project: { count: 1, avgRating: { $round: ['$avgRating', 2] } } },
]).toArray().forEach((d) => print(JSON.stringify(d)))

print('--- Pipeline 3: per-dish rating from embedded dishRatings ($unwind of an array of sub-documents)')
db.reviews.aggregate([
  { $unwind: '$dishRatings' },
  { $group: { _id: '$dishRatings.dishId', avg: { $avg: '$dishRatings.rating' }, n: { $sum: 1 } } },
  { $sort: { n: -1, avg: -1 } }, { $limit: 5 },
  { $project: { n: 1, avg: { $round: ['$avg', 2] } } },
]).toArray().forEach((d) => print(JSON.stringify(d)))

print('--- Indexes on reviews')
db.reviews.getIndexes().forEach((i) => print(JSON.stringify({ name: i.name, key: i.key, unique: !!i.unique })))
print('--- TTL index on search_history')
db.search_history.getIndexes().filter((i) => i.expireAfterSeconds).forEach((i) => print(JSON.stringify({ name: i.name, key: i.key, expireAfterSeconds: i.expireAfterSeconds })))

print('--- explain(): reviews for one restaurant, newest first')
const ex = db.reviews.find({ restaurantId: 5 }).sort({ createdAt: -1 }).explain('executionStats')
const stage = (s) => (s.inputStage ? `${s.stage} → ${stage(s.inputStage)}` : `${s.stage}${s.indexName ? ' (' + s.indexName + ')' : ''}`)
print(JSON.stringify({ plan: stage(ex.queryPlanner.winningPlan), docsExamined: ex.executionStats.totalDocsExamined, keysExamined: ex.executionStats.totalKeysExamined, returned: ex.executionStats.nReturned }, null, 1))

print('--- Unique index enforces one review per diner per restaurant')
try { db.reviews.insertOne({ userId: 1, restaurantId: 1, userName: 'dup', rating: 5, text: 'duplicate test', tags: [], dishRatings: [], createdAt: new Date() }) }
catch (e) { print('rejected: ' + (e.errmsg || e.message).split(' dup key')[0]) }
