-- =====================================================================
--  Oota — PostgreSQL schema  (STRUCTURED / RELATIONAL data)
--  Users, cuisines, restaurants, menus, dishes, favourites, orders.
--  Flexible data (preferences, reviews, search history, views) lives in
--  MongoDB — see CLAUDE.md section 9.
--  Run:  psql -U postgres -d oota -v ON_ERROR_STOP=1 -f db/postgres/schema.sql
--  Re-runnable: drops everything first.   Tested on PostgreSQL 16.
-- =====================================================================

DROP VIEW  IF EXISTS v_restaurant_summary, v_popular_dishes CASCADE;
DROP TABLE IF EXISTS order_items, orders, favourite_restaurants, dishes,
                     menu_categories, restaurant_cuisines, restaurant_owners,
                     restaurants, cuisines, admins, users CASCADE;
DROP FUNCTION IF EXISTS fn_recalc_order_total() CASCADE;
DROP FUNCTION IF EXISTS fn_dish_search_vector() CASCADE;

-- ---------------------------------------------------------------- users
CREATE TABLE users (
    user_id        SERIAL PRIMARY KEY,
    full_name      VARCHAR(100) NOT NULL,
    email          VARCHAR(150) NOT NULL UNIQUE,
    password_hash  VARCHAR(100) NOT NULL,           -- bcrypt, never plain text
    phone          VARCHAR(15),
    city           VARCHAR(60)  NOT NULL DEFAULT 'Bengaluru',
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT chk_email CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

-- [extension] Platform administrators — separate login, manage everything.
CREATE TABLE admins (
    admin_id       SERIAL PRIMARY KEY,
    full_name      VARCHAR(100) NOT NULL,
    email          VARCHAR(150) NOT NULL UNIQUE,
    password_hash  VARCHAR(100) NOT NULL,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT chk_admin_email CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

-- ------------------------------------------------------------- cuisines
CREATE TABLE cuisines (
    cuisine_id  SERIAL PRIMARY KEY,
    slug        VARCHAR(50) NOT NULL UNIQUE,         -- e.g. 'south-indian'
    name        VARCHAR(50) NOT NULL UNIQUE,         -- e.g. 'South Indian'
    image_url   TEXT                                  -- photo for onboarding cards
);

-- ---------------------------------------------------------- restaurants
CREATE TABLE restaurants (
    restaurant_id  SERIAL PRIMARY KEY,
    slug           VARCHAR(80)  NOT NULL UNIQUE,
    name           VARCHAR(120) NOT NULL,
    description    TEXT,
    address        VARCHAR(255) NOT NULL,
    area           VARCHAR(60)  NOT NULL,
    city           VARCHAR(60)  NOT NULL DEFAULT 'Bengaluru',
    phone          VARCHAR(15),
    price_level    SMALLINT     NOT NULL CHECK (price_level BETWEEN 1 AND 4),
    cost_for_two   INTEGER      NOT NULL CHECK (cost_for_two > 0),      -- INR
    is_pure_veg    BOOLEAN      NOT NULL DEFAULT FALSE,
    opens_at       TIME         NOT NULL DEFAULT '11:00',
    closes_at      TIME         NOT NULL DEFAULT '23:00',
    cover_url      TEXT,
    gallery_urls   TEXT[]       NOT NULL DEFAULT '{}',
    -- cache of the MongoDB review aggregate, written by the review-sync service
    avg_rating     NUMERIC(2,1) NOT NULL DEFAULT 0 CHECK (avg_rating BETWEEN 0 AND 5),
    review_count   INTEGER      NOT NULL DEFAULT 0 CHECK (review_count >= 0),
    -- [extension] popularity 0-100 for the "Trending in Bengaluru" tier (the UI's Restaurant.trendingScore)
    trending_score SMALLINT     NOT NULL DEFAULT 50 CHECK (trending_score BETWEEN 0 AND 100),
    -- [extension] partner self sign-up: new restaurants are 'pending' (hidden from diners) until an admin approves
    status         VARCHAR(10)  NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_restaurants_city_area ON restaurants (city, area);
CREATE INDEX idx_restaurants_rating    ON restaurants (avg_rating DESC);
CREATE INDEX idx_restaurants_status    ON restaurants (status) WHERE status <> 'approved';  -- partial index: the admin queue

-- [extension] Restaurant partner accounts — the only accounts that can list food.
-- 1:1 with restaurants (UNIQUE restaurant_id); deleting a restaurant deletes its login.
CREATE TABLE restaurant_owners (
    owner_id       SERIAL PRIMARY KEY,
    restaurant_id  INTEGER      NOT NULL UNIQUE REFERENCES restaurants(restaurant_id) ON DELETE CASCADE,
    full_name      VARCHAR(100) NOT NULL,
    email          VARCHAR(150) NOT NULL UNIQUE,
    password_hash  VARCHAR(100) NOT NULL,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT chk_owner_email CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

-- M:N restaurants <-> cuisines
CREATE TABLE restaurant_cuisines (
    restaurant_id INTEGER NOT NULL REFERENCES restaurants(restaurant_id) ON DELETE CASCADE,
    cuisine_id    INTEGER NOT NULL REFERENCES cuisines(cuisine_id)       ON DELETE CASCADE,
    PRIMARY KEY (restaurant_id, cuisine_id)
);
CREATE INDEX idx_rc_cuisine ON restaurant_cuisines (cuisine_id);

-- ------------------------------------------------------- menu & dishes
CREATE TABLE menu_categories (
    category_id   SERIAL PRIMARY KEY,
    restaurant_id INTEGER     NOT NULL REFERENCES restaurants(restaurant_id) ON DELETE CASCADE,
    name          VARCHAR(60) NOT NULL,
    sort_order    SMALLINT    NOT NULL DEFAULT 0,
    UNIQUE (restaurant_id, name)
);

CREATE TABLE dishes (
    dish_id       SERIAL PRIMARY KEY,
    restaurant_id INTEGER      NOT NULL REFERENCES restaurants(restaurant_id) ON DELETE CASCADE,
    category_id   INTEGER      NOT NULL REFERENCES menu_categories(category_id) ON DELETE CASCADE,
    cuisine_id    INTEGER      NOT NULL REFERENCES cuisines(cuisine_id),
    name          VARCHAR(120) NOT NULL,
    description   TEXT,
    price         NUMERIC(8,2) NOT NULL CHECK (price > 0),               -- INR
    diet          VARCHAR(8)   NOT NULL CHECK (diet IN ('veg','egg','nonveg','vegan')),
    spice_level   SMALLINT     NOT NULL DEFAULT 1 CHECK (spice_level BETWEEN 0 AND 3),
    flavour_tags  TEXT[]       NOT NULL DEFAULT '{}',      -- spicy, tangy, sweet, creamy, smoky, mild, rich, fresh, crispy, comforting
    allergens     TEXT[]       NOT NULL DEFAULT '{}',      -- nuts, dairy, gluten, egg, shellfish, soy
    image_url     TEXT,
    is_available  BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),          -- [extension] when it was listed
    avg_rating    NUMERIC(2,1) NOT NULL DEFAULT 0 CHECK (avg_rating BETWEEN 0 AND 5),
    review_count  INTEGER      NOT NULL DEFAULT 0 CHECK (review_count >= 0),
    search_vector TSVECTOR
);
CREATE INDEX idx_dishes_restaurant ON dishes (restaurant_id);
CREATE INDEX idx_dishes_cuisine    ON dishes (cuisine_id);
CREATE INDEX idx_dishes_flavour    ON dishes USING GIN (flavour_tags);
CREATE INDEX idx_dishes_search     ON dishes USING GIN (search_vector);

-- Trigger: keep the full-text search vector in sync (name weighs more than description)
CREATE FUNCTION fn_dish_search_vector() RETURNS trigger AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B');
    RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_dish_search_vector
BEFORE INSERT OR UPDATE OF name, description ON dishes
FOR EACH ROW EXECUTE FUNCTION fn_dish_search_vector();

-- ------------------------------------------------------- favourites
CREATE TABLE favourite_restaurants (
    user_id       INTEGER NOT NULL REFERENCES users(user_id)             ON DELETE CASCADE,
    restaurant_id INTEGER NOT NULL REFERENCES restaurants(restaurant_id) ON DELETE CASCADE,
    saved_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, restaurant_id)
);

-- ------------------------------------------------------------ orders
CREATE TABLE orders (
    order_id      SERIAL PRIMARY KEY,
    user_id       INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    restaurant_id INTEGER NOT NULL REFERENCES restaurants(restaurant_id),
    status        VARCHAR(20) NOT NULL DEFAULT 'PLACED'
                  CHECK (status IN ('PLACED','PREPARING','DELIVERED','CANCELLED')),
    total_amount  NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    placed_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_user ON orders (user_id, placed_at DESC);

CREATE TABLE order_items (
    order_id   INTEGER NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    dish_id    INTEGER NOT NULL REFERENCES dishes(dish_id),
    quantity   SMALLINT NOT NULL CHECK (quantity BETWEEN 1 AND 20),
    unit_price NUMERIC(8,2) NOT NULL CHECK (unit_price > 0),   -- price frozen at order time
    PRIMARY KEY (order_id, dish_id)
);

-- Trigger: an order's total is always the sum of its line items
CREATE FUNCTION fn_recalc_order_total() RETURNS trigger AS $$
DECLARE oid INTEGER := COALESCE(NEW.order_id, OLD.order_id);
BEGIN
    UPDATE orders
       SET total_amount = (SELECT COALESCE(SUM(quantity * unit_price), 0)
                             FROM order_items WHERE order_id = oid)
     WHERE order_id = oid;
    RETURN NULL;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_order_total
AFTER INSERT OR UPDATE OR DELETE ON order_items
FOR EACH ROW EXECUTE FUNCTION fn_recalc_order_total();

-- ------------------------------------------------------------- views
CREATE VIEW v_restaurant_summary AS
SELECT r.restaurant_id, r.slug, r.name, r.description, r.area, r.city,
       r.price_level, r.cost_for_two, r.is_pure_veg, r.avg_rating, r.review_count,
       r.opens_at, r.closes_at, r.cover_url,
       ARRAY_AGG(DISTINCT c.name     ORDER BY c.name)     AS cuisines,
       ARRAY_AGG(DISTINCT c.cuisine_id)                   AS cuisine_ids,
       (SELECT COUNT(*) FROM dishes d WHERE d.restaurant_id = r.restaurant_id) AS dish_count
FROM restaurants r
JOIN restaurant_cuisines rc ON rc.restaurant_id = r.restaurant_id
JOIN cuisines c             ON c.cuisine_id     = rc.cuisine_id
GROUP BY r.restaurant_id;

-- Popularity from orders (feeds the "Trending" tier)
CREATE VIEW v_popular_dishes AS
SELECT d.dish_id, d.name, d.restaurant_id, r.name AS restaurant_name,
       COALESCE(SUM(oi.quantity), 0) AS times_ordered
FROM dishes d
JOIN restaurants r       ON r.restaurant_id = d.restaurant_id
LEFT JOIN order_items oi ON oi.dish_id      = d.dish_id
GROUP BY d.dish_id, r.name;
