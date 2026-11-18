-- =====================================================================
--  Oota — showcase queries (run: docker exec -i oota-postgres psql -U oota -d oota < docs/queries.sql)
-- =====================================================================

-- Q1  JOIN + GROUP BY: restaurants with their cuisines and menu size
SELECT r.name, r.area, string_agg(DISTINCT c.name, ', ') AS cuisines, COUNT(DISTINCT d.dish_id) AS dishes
FROM restaurants r
JOIN restaurant_cuisines rc ON rc.restaurant_id = r.restaurant_id
JOIN cuisines c ON c.cuisine_id = rc.cuisine_id
LEFT JOIN dishes d ON d.restaurant_id = r.restaurant_id
GROUP BY r.restaurant_id ORDER BY r.name LIMIT 6;

-- Q2  GROUP BY + HAVING: areas with at least 3 restaurants and their average rating
SELECT area, COUNT(*) AS restaurants, ROUND(AVG(avg_rating), 2) AS avg_rating
FROM restaurants WHERE status = 'approved'
GROUP BY area HAVING COUNT(*) >= 3 ORDER BY avg_rating DESC;

-- Q3  Window function: best-rated dish in every restaurant (RANK() OVER PARTITION BY)
SELECT restaurant, dish, avg_rating FROM (
  SELECT r.name AS restaurant, d.name AS dish, d.avg_rating,
         RANK() OVER (PARTITION BY d.restaurant_id ORDER BY d.avg_rating DESC, d.review_count DESC) AS rnk
  FROM dishes d JOIN restaurants r ON r.restaurant_id = d.restaurant_id
) t WHERE rnk = 1 ORDER BY avg_rating DESC, restaurant LIMIT 8;

-- Q4  CTE: revenue per restaurant and its share of all order value
WITH rev AS (
  SELECT restaurant_id, SUM(total_amount) AS revenue, COUNT(*) AS orders
  FROM orders WHERE status <> 'CANCELLED' GROUP BY restaurant_id
)
SELECT r.name, rev.orders, rev.revenue,
       ROUND(100.0 * rev.revenue / SUM(rev.revenue) OVER (), 1) AS pct_of_total
FROM rev JOIN restaurants r USING (restaurant_id)
ORDER BY rev.revenue DESC LIMIT 6;

-- Q5  Correlated subquery: dishes priced above their own restaurant's average
SELECT r.name AS restaurant, d.name AS dish, d.price
FROM dishes d JOIN restaurants r ON r.restaurant_id = d.restaurant_id
WHERE d.price > (SELECT AVG(d2.price) FROM dishes d2 WHERE d2.restaurant_id = d.restaurant_id)
ORDER BY d.price DESC LIMIT 6;

-- Q6  Full-text search (tsvector kept current by trigger, GIN index) with ranking
SELECT d.name, r.name AS restaurant, ROUND(ts_rank(d.search_vector, q)::numeric, 3) AS rank
FROM dishes d JOIN restaurants r ON r.restaurant_id = d.restaurant_id,
     websearch_to_tsquery('english', 'ghee roast') q
WHERE d.search_vector @@ q ORDER BY rank DESC;

-- Q7  Array containment on the GIN-indexed flavour_tags: dishes that are BOTH spicy AND crispy
SELECT d.name, d.flavour_tags, d.diet FROM dishes d
WHERE d.flavour_tags @> ARRAY['spicy', 'crispy'] ORDER BY d.name LIMIT 8;

-- Q8  Diet hard filter for a vegan diner, avoiding nuts (what the recommender runs first)
SELECT COUNT(*) AS vegan_nut_free_dishes FROM dishes
WHERE is_available AND diet = ANY (ARRAY['vegan']) AND NOT (allergens && ARRAY['nuts']);

-- Q9  View: v_restaurant_summary (cuisines aggregated, dish count) — top rated
SELECT name, area, cuisines, avg_rating, review_count, dish_count
FROM v_restaurant_summary ORDER BY avg_rating DESC, review_count DESC LIMIT 5;

-- Q10 View: v_popular_dishes — most ordered dishes (feeds "Trending")
SELECT name, restaurant_name, times_ordered FROM v_popular_dishes ORDER BY times_ordered DESC, name LIMIT 6;

-- Q11 EXISTS / NOT EXISTS: restaurants nobody has saved yet
SELECT r.name FROM restaurants r
WHERE NOT EXISTS (SELECT 1 FROM favourite_restaurants f WHERE f.restaurant_id = r.restaurant_id)
ORDER BY r.name LIMIT 8;

-- Q12 Self-documenting integrity: every order total equals the sum of its items (maintained by trg_order_total)
SELECT COUNT(*) AS orders_checked,
       COUNT(*) FILTER (WHERE o.total_amount = s.items_sum) AS totals_matching
FROM orders o JOIN (SELECT order_id, SUM(quantity * unit_price) AS items_sum FROM order_items GROUP BY order_id) s USING (order_id);

-- Q13 Three account types, three tables (disjoint)
SELECT 'diners' AS account_type, COUNT(*) FROM users
UNION ALL SELECT 'restaurant partners', COUNT(*) FROM restaurant_owners
UNION ALL SELECT 'admins', COUNT(*) FROM admins;

-- Q14 Diners who ordered from more than one restaurant (GROUP BY + HAVING on DISTINCT)
SELECT u.full_name, COUNT(DISTINCT o.restaurant_id) AS restaurants, SUM(o.total_amount) AS spent
FROM users u JOIN orders o ON o.user_id = u.user_id
GROUP BY u.user_id HAVING COUNT(DISTINCT o.restaurant_id) > 1
ORDER BY spent DESC LIMIT 5;
