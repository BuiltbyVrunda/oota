-- Index demo on a 300,000-row benchmark copy of the orders shape (dropped at the end; the app's tables are untouched)
DROP TABLE IF EXISTS bench_orders;
CREATE TABLE bench_orders AS
SELECT g AS order_id, (random() * 5000)::int + 1 AS user_id, (random() * 24)::int + 1 AS restaurant_id,
       round((random() * 2000 + 100)::numeric, 2) AS total_amount, now() - (random() * 365 || ' days')::interval AS placed_at
FROM generate_series(1, 300000) g;
ANALYZE bench_orders;

-- BEFORE: one diner's 10 latest orders, no index
EXPLAIN (ANALYZE, COSTS OFF, TIMING ON) SELECT * FROM bench_orders WHERE user_id = 42 ORDER BY placed_at DESC LIMIT 10;

-- the same composite index the app has on orders: (user_id, placed_at DESC)
CREATE INDEX idx_bench_user_time ON bench_orders (user_id, placed_at DESC);
ANALYZE bench_orders;

-- AFTER
EXPLAIN (ANALYZE, COSTS OFF, TIMING ON) SELECT * FROM bench_orders WHERE user_id = 42 ORDER BY placed_at DESC LIMIT 10;

DROP TABLE bench_orders;
