-- Transaction demo: placing an order is all-or-nothing.
-- 1) A good order: BEGIN … COMMIT. The trigger trg_order_total fills orders.total_amount from the line items.
BEGIN;
INSERT INTO orders (user_id, restaurant_id) VALUES (2, 4) RETURNING order_id;
INSERT INTO order_items (order_id, dish_id, quantity, unit_price)
  SELECT currval('orders_order_id_seq'), dish_id, 2, price FROM dishes WHERE dish_id = 28;   -- 2 × Chicken Donne Biryani
INSERT INTO order_items (order_id, dish_id, quantity, unit_price)
  SELECT currval('orders_order_id_seq'), dish_id, 1, price FROM dishes WHERE dish_id = 29;   -- 1 × Mutton Donne Biryani
SELECT order_id, total_amount FROM orders WHERE order_id = currval('orders_order_id_seq');
COMMIT;

-- 2) A bad order: the second line breaks a CHECK (quantity 1..20) → the whole transaction rolls back.
SELECT COUNT(*) AS orders_before FROM orders;
BEGIN;
INSERT INTO orders (user_id, restaurant_id) VALUES (2, 4);
INSERT INTO order_items (order_id, dish_id, quantity, unit_price) SELECT currval('orders_order_id_seq'), 28, 1, 280;
INSERT INTO order_items (order_id, dish_id, quantity, unit_price) SELECT currval('orders_order_id_seq'), 29, 99, 360;
COMMIT;
SELECT COUNT(*) AS orders_after FROM orders;

-- 3) The trigger keeps totals right on UPDATE/DELETE too
UPDATE order_items SET quantity = 3 WHERE order_id = (SELECT MAX(order_id) FROM orders) AND dish_id = 28;
SELECT order_id, total_amount FROM orders WHERE order_id = (SELECT MAX(order_id) FROM orders);
DELETE FROM orders WHERE order_id = (SELECT MAX(order_id) FROM orders);
