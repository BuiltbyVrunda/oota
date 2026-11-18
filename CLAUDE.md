# Oota — master context for Claude Code

Read this fully before doing anything. It is the single source of truth. `docs/PROMPTS.md` has the prompts to run, in order.

> **Current state (2026-11-18) — all three phases are built.** Changes made with the builder (Vrunda) that override the text below:
> * **Three account types, three logins, three cookies:** diners (`users`, `/login`), restaurant partners (`restaurant_owners`, 1:1 with `restaurants`, `/partner/*`) and admins (`admins`, `/admin/*`). **Only partners list food.** Partners self-register at `/partner/signup`; `restaurants.status` ∈ pending/approved/rejected (CHECK) and diners only see approved ones.
> * **Ordering:** cart ("tiffin") → `POST /api/orders` (transaction, trigger total) → `/orders`; partners move orders PLACED → PREPARING → DELIVERED (or CANCELLED), enforced in SQL.
> * **Live updates:** `db/postgres/realtime.sql` (statement NOTIFY triggers + DDL event triggers) and Mongo change streams (compose runs Mongo as replica set `rs0`) → `GET /api/events` (SSE) → React data hooks refetch. Admin → Live database page shows all tables/collections.
> * **Uploads:** `POST /api/uploads` (raw image, magic-byte checked, 6 MB) → `backend/uploads/`, served at `/uploads/…`.
> * **Design:** light "Liquid Tiffin" (see §5 override), Coastal morning background, Clear frost cards, Instagram-style like burst, enamel-tiffin splash.
> * **Docs:** `docs/Oota-DBMS-Explainer.pdf` (built by `python3 docs/pdf/build_html.py && node frontend/scripts/build-explainer.mjs` from live DB output), `docs/REPORT.md`, `README.md`.
> * Repo root is this macOS folder (not `F:\DBMSminiproject`); linter is oxlint (Vite template default), not ESLint.

## 1. What we are building

**Oota** (Kannada "meal") is a personalised food discovery website for **Bengaluru** (prices in ₹). Users sign up, pick tastes, explore restaurants and menus, search dishes, rate/review food, save favourites. Every user gets **different** recommendations based on (a) declared preferences, (b) search history, (c) their own ratings, (d) recently viewed. Every recommendation shows **why** it is there.

This is a **DBMS mini-project** (PES University). The point is the data layer: **PostgreSQL (SQL) for structured data + MongoDB (NoSQL) for flexible data**, used together deliberately. Marks come from the schema, queries, triggers, views, indexes, aggregation pipelines and a working demo.

Locale: Bengaluru areas — Indiranagar, Koramangala, Jayanagar, HSR Layout, Malleshwaram, Basavanagudi, Whitefield, Frazer Town, Ulsoor, Rajajinagar. Currency ₹. Ratings out of 5.

## 2. Phases (strict order — do NOT skip ahead)

| Phase | What | Rule |
|---|---|---|
| **1** | Frontend only, mock data, client-side state | **No backend, no SQL, no Mongo, no fake API calls/`fetch`/`setTimeout` "latency"**. Components read mock data through plain selector functions. |
| **2** | Backend + both databases + seed | Replace Phase 1 mock state with real API calls. |
| **3** | Integration, polish, report/viva material | |

Phase 1 must be fully working and reviewed before Phase 2 starts. Commit after each stage.

## 3. Tech stack — and where each piece lives

| Concern | Choice | Notes |
|---|---|---|
| Frontend | **React + Vite + TypeScript (strict)** | `frontend/` |
| Styling | **Tailwind CSS v4** (`@tailwindcss/vite`) | Tokens are CSS variables in `tokens.css`, mapped via `@theme`. No arbitrary colour values (`bg-[#f00]`) in components. |
| Motion | **Framer Motion** | Subtle only. Respect `prefers-reduced-motion`. |
| Icons | **lucide-react** | One stroke weight. **No emoji as icons.** |
| Routing | **react-router-dom v6** | |
| Fonts | `@fontsource-variable/bricolage-grotesque` (display), `@fontsource-variable/geist` (UI), `@fontsource/noto-sans-kannada` weight 600 (only the ಊಟ wordmark) | Self-hosted via npm, not Google CDN. |
| State (Phase 1) | React Context + `useLocalStorage` | Keys `oota:v1:*`. |
| Backend | **Node 22 + Express 5 + TypeScript**, run with `tsx` | `backend/`. Validation: `zod`. Tests: `vitest` + `supertest`. |
| SQL DB | **PostgreSQL 16** via `pg` (**raw SQL, no ORM** — the SQL must be visible for the viva) | Users, cuisines, restaurants, menus, dishes, favourites, orders. |
| NoSQL DB | **MongoDB 7** via official `mongodb` driver | Preferences, reviews, search history, recently viewed. |
| Auth | `bcryptjs` + `jsonwebtoken`, JWT in **httpOnly cookie** | |
| Security | `helmet`, `cors` (credentials, origin from env), `express-rate-limit` on auth | |
| Infra | `docker-compose.yml` (Postgres + Mongo) | Windows 10/11 + Docker Desktop. Use `npm`. |
| Design QA | **Impeccable** skill (see §10) | Mandatory for every UI surface. |

Ports: frontend 5173 · backend 4000 · Postgres 5432 · Mongo 27017.

## 4. Repo layout (project root = `F:\DBMSminiproject`)

```
CLAUDE.md                  <- this file
PRODUCT.md                 <- Impeccable product brief (copy into frontend/ too)
docker-compose.yml  .env.example
docs/                      PROMPTS.md, PHOTOS.md, images.ts
db/
  postgres/schema.sql      <- DONE and tested (PostgreSQL 16). Do not redesign; extend only if needed.
  seed/                    <- JSON exported from frontend mock data (Phase 2)
frontend/                  <- Phase 1
backend/                   <- Phase 2
```

### Frontend folder structure (required)

```
frontend/src/
  main.tsx  App.tsx  router.tsx            (protected-route guard)
  styles/   tokens.css  globals.css
  types/    index.ts
  data/     cuisines.ts areas.ts flavours.ts restaurants.ts dishes.ts reviews.ts users.ts images.ts
  context/  AuthContext PreferencesContext ActivityContext FavouritesContext ReviewsContext
  hooks/    useLocalStorage useDebounce useRecommendations useDiscovery useScrollSpy useMediaQuery
  utils/    recommend.ts filter.ts format.ts cn.ts
  components/
    ui/        Button IconButton Input Chip Select RangeSlider Tabs Modal Popover Toast Skeleton StarRating StarInput DietMark MatchMeter
    common/    ReasonPlate Rail SectionHeader SmartImage PriceLevel EmptyState
    layout/    AppShell TopBar MobileTabBar AuthLayout PageContainer
    auth/      LoginForm SignupForm AuthSwitcher   +  onboarding/ StepProgress CuisineStep DietStep FlavourStep
    dashboard/ WelcomeHeader TasteStrip Tier RestaurantCard DishCard TrendingList
    discovery/ SearchField FilterPanel ActiveFilters ResultTabs RestaurantResult DishResult NoResults
    restaurant/ CoverHeader MetaRow MenuNav MenuSection MenuDish ReviewSummary ReviewList ReviewModal
  pages/  LoginPage SignupPage OnboardingPage DashboardPage DiscoverPage RestaurantPage SavedPage PreferencesPage NotFoundPage
```

No monolithic files. One component per file, typed props, no `any`.

## 5. Design direction — DECIDED, do not re-open

> **Override (2026-11-18, requested by the builder): "Liquid Tiffin".** The whole app uses **liquid-glass** surfaces with **popping colours** on a dark ground. Keep the Steel Tiffin *structure* (tier stack, engraved steel reason plates, match meter, haldi = live, diet shapes, fonts), but: dark ground `#100f0e` lit by vivid spice colour fields (haldi, chilli, curry-leaf, kokum); tiers/bars/panels are liquid glass (specular rim, backdrop blur + saturation, SVG refraction on small floating controls in Chromium, pointer-follow highlight). This **replaces the ban on glass/blur** below and the light palette table. `frontend/src/styles/tokens.css` is the authoritative palette; contrast is re-measured there. Everything else in this section still applies.
>
> **Update (same day): light theme.** The builder then asked for a **white/light background with tinted glass cards**. Current state: light liquid glass; each surface sets a spice `--tint` (`tint-haldi|chilli|leaf|kokum|coconut`; dashboard tiers each get a different one). Background options live in `frontend/src/styles/themes.css` (white, saffron/"Haldi hour", leaf, kokum, rangoli, coastal); **default = "Coastal morning"** (chosen by the builder), switchable in Preferences → Appearance or `?bg=<id>`. Card colour default = **Clear frost** (untinted milky glass; options in `tokens.css` `[data-card=…]`, `?card=<id>`). A background-strength slider scales the ambient light (`--amb-k`). Performance rule: `backdrop-filter` only on floating chrome (`.liquid-lens`), transient overlays (`.liquid-strong`) and one `.liquid-frost` panel per screen. Splash = white background with a coloured enamel tiffin.

**"Steel Tiffin."** South-Indian steel tableware: stacked tiffin tiers, engraved names on steel. The dashboard is a **stack of tiers**; each tier opens with a small engraved **reason plate** ("Because you searched *ghee roast*"). Tapping the plate opens a popover listing the signals behind the picks.

Impeccable may offer other "directions" when you run it. **Reject them; use this one.** Mode is *Operate* (app UI): scanability and consistency over expression.

### Palette (CSS variables; all in `tokens.css`)

| Token | Hex | Use |
|---|---|---|
| `ground` | `#F4F3F0` | App background |
| `plate` | `#FFFFFF` | Cards, modals |
| `brushed` | `#ECEBE7` | Tier bands, inputs |
| `seam` | `#DCDAD4` | Borders, dividers |
| `pewter` | `#7A776F` | **Icons / non-text only** (≈4.0–4.5:1; fails for body text) |
| `ink-2` | `#5E5B55` | Secondary text |
| `ink` / `graphite` | `#1D1C1A` | Text, top bar |
| `steel-on-dark` | `#C9C6BF` | Secondary text on graphite |
| `haldi` | `#E3A21A` | **Means "live"**: selected, active, focus, primary action, stars. Nothing decorative is yellow. |
| `haldi-ink` | `#8A5A00` | Accent text on light |
| `haldi-wash` | `#FBF0D4` | Selected chip fill |
| `veg` `#1E7B3A` · `nonveg` `#A63A22` · `egg` `#9A5F00` · `danger` `#B42318` | | Diet/error. Diet **always** has a shape too (square+dot / square+triangle / square+half-dot) — never colour alone. |

Measured contrast: ink/ground 15.4, ink-2/ground 6.1, haldi-ink/ground 5.3, nonveg/ground 5.8, danger/ground 5.9, ink on haldi 7.7, steel-on-dark/graphite 10.0, veg/ground 4.8, egg/ground 4.7. **Known gaps to fix in the quality pass:** pewter < 4.5 as text; `veg`/`egg` on `brushed` ≈ 4.4; haldi stroke on white is only 2.2:1, so never rely on a haldi outline alone for focus — pair with a graphite ring.

### Type

Display **Bricolage Grotesque** 600, tracking −0.02em (headings, restaurant names, tier titles). UI/body **Geist** 400/500/600, tabular figures for ₹ and ratings. Scale: 12 / 14 / 16 / 20 / 28 / 36 / 48. Body measure ≤ 66ch. Headings `text-wrap: balance`.

### Tokens

Spacing 4px base (4/8/12/16/24/32/48/64). Radius: `sm 6` (plates, diet marks) · `md 10` (buttons, inputs) · `card 14` · `tier 20` (bands, modals, cover) · `full`. Shadows: `e1 0 1px 2px rgb(29 28 26/.06)` · `e2 0 6px 20px -8px rgb(29 28 26/.18)` · `e3 0 24px 48px -12px rgb(29 28 26/.24)` · `engrave inset 0 1px 0 rgb(255 255 255/.8), inset 0 -1px 0 rgb(29 28 26/.08)`. Motion: quick 140ms ease-out, standard 220ms `cubic-bezier(.2,.7,.2,1)`, results reorder = spring (stiffness 380, damping 34). Breakpoints sm 640 · md 768 · lg 1024 · xl 1280; content max 1200.

```css
/* styles/globals.css */
@import "tailwindcss";
@import "./tokens.css";
@theme {
  --color-ground: var(--ground);  --color-plate: var(--plate);  --color-brushed: var(--brushed);
  --color-seam: var(--seam);  --color-pewter: var(--pewter);  --color-ink: var(--ink);  --color-ink-2: var(--ink-2);
  --color-graphite: var(--graphite);  --color-haldi: var(--haldi);  --color-haldi-ink: var(--haldi-ink);
  --color-haldi-wash: var(--haldi-wash);  --color-veg: var(--veg);  --color-nonveg: var(--nonveg);
  --color-egg: var(--egg);  --color-danger: var(--danger);
  --font-display: "Bricolage Grotesque Variable", system-ui, sans-serif;
  --font-sans: "Geist Variable", system-ui, sans-serif;
  --radius-card: 14px;  --radius-tier: 20px;
  --shadow-e1: var(--e1);  --shadow-e2: var(--e2);  --shadow-e3: var(--e3);
}
```

### Component language

Primary button = graphite fill. Accent button = haldi fill + graphite text (only for the one key action per screen, e.g. "Rate this place"). Secondary = plate + seam border. Inputs: 40px, `brushed`/`ground` fill. Chips: pill, selected = haldi-wash + haldi border + haldi-ink text. **Match meter** (the *only* way match strength is shown): five 14×4px bars, filled = haldi, with a word label (Strong / Good / Fair match). Reason plate: small steel nameplate with the `engrave` shadow.

### Rules (from Impeccable's craft floor — treat as bans)

No eyebrow/kicker above headings. No section numbers. No identical icon+heading+text card grids as page structure; no nested cards. No gradient text, no glass/blur as decoration, no coloured left-border > 1px, no hard offset shadows. No emoji as icons. No modal for things that don't need one (filters are an inline panel / sheet; the **review modal** is the one allowed modal). One authored motion moment, not scattered effects. Labels (price, area, diet) keep one fixed size at every breakpoint; only headings scale. Every control must work; keyboard focus visible; hover/disabled/loading/error/empty states for every interactive thing.

## 6. Phase 1 scope (frontend, mock data)

Routes: `/login` `/signup` `/onboarding` (protected) `/` dashboard (protected) `/discover` `/restaurant/:slug` `/saved` `/preferences` `*`.

**A. Auth.** Login + signup with a cross-fade between them. Mock auth in `AuthContext`: accepts the seeded demo users or creates a new user in localStorage (bcrypt not needed in Phase 1). Validation + error states. Then a **3-step onboarding**: (1) favourite cuisines as photo cards (multi-select, min 3), (2) diet (Any / Veg / Egg / Vegan) + allergens + spice 0–3, (3) flavour interests (spicy, tangy, sweet, creamy, smoky, mild, rich, fresh, crispy, comforting). Progress indicator; back/next; skip allowed on step 3. Editable later in `/preferences`.

**B. Dashboard** (tiers, in this order; vary the shapes — do not make a grid of identical cards):
1. Welcome line with a fact ("3 new picks since you rated …") + editable **taste chips**.
2. **Because you searched X** — most recent search with results (fallback "Start with what you like").
3. **Top-rated for your tastes** — rail of restaurant cards with match meter + reason.
4. **Trending in Bengaluru** — restaurants rail + a compact **trending dishes** list with thumbnails (different layout on purpose).
5. **Pick up where you left off** — recently viewed (small cards).
6. **Your cuisines** — cuisine tiles (photo) linking to Discover pre-filtered.
Horizontally scrollable rails with scroll-snap and keyboard access.

**C. Discover.** Search box with suggestions dropdown (recent searches, matching cuisines, matching dishes, matching restaurants). Tabs **Restaurants | Dishes** with counts. Filters: cuisine (multi), diet (any/veg/egg/non-veg/vegan), price level 1–4 (₹ … ₹₹₹₹), min rating (any/3.5/4/4.5), flavour profile (multi). Sort: Best match / Rating / Price low→high. **Instant** filtering (debounce ≤150ms); results reorder in place with Framer `layout`. Active-filter chips with remove + **Clear all**. Rich empty state (what filter is too narrow, one-click relax, popular searches). Record a search into history on Enter / suggestion click / result click (not on every keystroke).

**D. Restaurant page.** Cover image (+ small gallery), name, cuisines, rating, ₹ level + cost for two, area, hours + computed **Open/Closed**, Save (heart, toggles, persists) and **Rate this place** (opens the modal). Sticky **menu category nav** with scroll-spy; dish rows with photo, description, ₹ price, diet mark, spice meter, flavour tags, rating; "Veg only" toggle. Reviews: summary with 5-bar distribution, list with sort (Newest / Highest / Lowest). **Review modal**: star input, optional per-dish ratings (pick from this menu), tag chips, text (counter, min 10 chars), validation, focus-trap, Esc closes; submit adds the review immediately, recomputes the average, shows a toast, and changes recommendations. Own review editable. Viewing a restaurant adds it to recently viewed.

**E. Also** `/saved` (favourites) and `/preferences` (edit everything from onboarding).

### Shared types (`types/index.ts`) — Phase 2 API returns exactly these

```ts
export type Diet = 'veg' | 'egg' | 'nonveg' | 'vegan'
export type DietPref = 'any' | 'veg' | 'egg' | 'vegan'   // veg pref sees veg+vegan; egg sees veg+egg+vegan; vegan sees vegan only
export type Flavour = 'spicy'|'tangy'|'sweet'|'creamy'|'smoky'|'mild'|'rich'|'fresh'|'crispy'|'comforting'
export interface Cuisine { id: number; slug: string; name: string; imageUrl: string }
export interface Restaurant { id: number; slug: string; name: string; description: string; area: string; address: string;
  priceLevel: 1|2|3|4; costForTwo: number; isPureVeg: boolean; opensAt: string; closesAt: string;
  coverUrl: string; galleryUrls: string[]; cuisineIds: number[]; avgRating: number; reviewCount: number; trendingScore: number }
export interface Dish { id: number; restaurantId: number; category: string; cuisineId: number; name: string; description: string;
  price: number; diet: Diet; spiceLevel: 0|1|2|3; flavourTags: Flavour[]; allergens: string[]; imageUrl: string; avgRating: number; reviewCount: number }
export interface Review { id: string; restaurantId: number; userId: number; userName: string; rating: 1|2|3|4|5; text: string;
  tags: string[]; dishRatings: { dishId: number; rating: 1|2|3|4|5 }[]; createdAt: string }
export interface Preferences { cuisineIds: number[]; diet: DietPref; allergens: string[]; spiceLevel: 0|1|2|3; flavours: Flavour[]; onboarded: boolean }
export interface SearchEntry { query: string; filters: Partial<Filters>; at: string; clickedRestaurantId?: number }
export interface Filters { cuisineIds: number[]; diet: DietPref; priceLevels: number[]; minRating: number; flavours: Flavour[]; sort: 'match'|'rating'|'price' }
export interface Recommendation<T> { item: T; score: number; match: 1|2|3|4|5; reasons: string[] }  // reasons e.g. "You rated Andhra food 5★"
```

### Recommender contract (`utils/recommend.ts`; same logic reimplemented in the backend)

`score = 0.30·cuisineAffinity + 0.25·searchAffinity + 0.20·ratingSignal + 0.15·tasteFit + 0.10·qualityPrior`
- **Hard filters first**: diet pref and allergens exclude dishes; a veg-pref user never sees non-veg-only places ranked as matches.
- `cuisineAffinity`: 1 if cuisine is in declared favourites, else learned from the user's own ratings.
- `searchAffinity`: cuisines/dish keywords in the last 30 searches, exponential decay (half-life 7 days).
- `ratingSignal`: user's ratings on same cuisine/restaurant/dish tags, centred on 3 (≥4 boosts, ≤2 penalises).
- `tasteFit`: spice-level closeness + flavour-tag overlap with the user's flavours.
- `qualityPrior`: Bayesian-smoothed average rating, normalised.
- Output `match` 1–5 by quantising `score`; `reasons` = the top two contributing signals in plain words. **Pure and deterministic**; unit-test it. Cold start (no signals) → quality + trending.

## 7. Mock data (Phase 1) — realistic, Bengaluru, invented names

Volume: **18 cuisines, 24 restaurants across the 10 areas, ~220 dishes (8–10 per restaurant, 3–4 menu categories each), ~150 reviews (4–9 per restaurant)**. Ratings must look real: restaurant averages spread 3.7–4.7, include some 2★/3★ and critical reviews. Reviews mention specific dishes. **Restaurant names are invented — keep them clearly fictional; do not copy real Bengaluru restaurants.**

Cuisines (slug): south-indian, udupi, karnataka-meals, andhra, coastal, biryani, north-indian, mughlai, street-food, cafe, bakery, italian, japanese, pan-asian, tibetan, american, continental, desserts.

Starter roster (name · area · cuisines · cost for two ₹ · veg? · cover photo `pNN` from `docs/images.ts`):
1 Tuppa & Co. · Jayanagar · south-indian · 300 · pure veg · p01
2 Sanje Darshini · Malleshwaram · udupi, south-indian · 250 · pure veg · p05
3 Bale Ele Meals · Basavanagudi · karnataka-meals · 450 · pure veg · p03
4 Hosa Biryani Mane · Koramangala · biryani · 600 · p09
5 Kempu Kitchen · HSR Layout · andhra · 700 · p12
6 Degree Kaapi Co. · Indiranagar · cafe, south-indian · 350 · p25
7 Nagara Tandoor · Indiranagar · north-indian, mughlai · 1400 · p17
8 Dhaba Number 9 · Whitefield · north-indian · 800 · p15
9 Kebab Kothi · Frazer Town · mughlai · 900 · p23
10 Mangala Coast · Indiranagar · coastal · 1000 · p06
11 Forno Verde · Indiranagar · italian · 1500 · p34
12 Trattoria Ulsoor · Ulsoor · italian · 1600 · p33 (interior p55)
13 Slow Roast & Crumb · Koramangala · cafe, bakery · 600 · p27
14 Bean Atlas · HSR Layout · cafe, continental · 700 · p31 (interior p48)
15 Momo Mandala · Koramangala · tibetan · 400 · p37
16 Ginza Noodle Bar · Indiranagar · japanese · 1300 · p42
17 Bao & Basil · Whitefield · pan-asian · 1100 · p40
18 Smash Yard · Koramangala · american · 800 · p44
19 Patty & Pickle · HSR Layout · american · 700 · p43
20 Chaat Gully · Basavanagudi · street-food · 250 · pure veg · p13
21 Appe Adda · Jayanagar · south-indian · 280 · pure veg · p58
22 Saaru & Sons · Rajajinagar · karnataka-meals, andhra · 500 · p04
23 Sweet Shed · Whitefield · desserts, bakery · 450 · p59
24 Greenhouse 5 · Koramangala · cafe, continental · 1200 · vegan-friendly · p48

Dish photos: pick from the cuisine-matching photos in `docs/PHOTOS.md` (reuse across different dishes is fine; never put the same photo on two adjacent dishes). Interiors (p46–p55) are only for covers/galleries.

**Demo users** (password `demo1234`): `ananya@oota.demo` — veg, south-indian/udupi/karnataka-meals/cafe, spicy, searches "ghee roast", "filter coffee", "idli". `rohan@oota.demo` — any diet, biryani/mughlai/north-indian/american, smoky+rich, searches "biryani", "kebab", "burger". `meera@oota.demo` — vegan, cafe/italian/continental/desserts, fresh+creamy+sweet, searches "vegan pizza", "brunch", "tiramisu". Their dashboards **must look clearly different** — that is the demo.

Photos: `docs/images.ts` has 60 verified Unsplash photos (free licence, hotlinked). Copy to `frontend/src/data/images.ts`. Always descriptive `alt`, explicit width/height, `loading="lazy"` below the fold, a `SmartImage` with skeleton + fallback on error. Footer credit: "Photography from Unsplash".

## 8. Quality gates (Definition of Done per page)

`npm run build` and `tsc --noEmit` clean · ESLint clean · no `any` · responsive at **1440 / 834 / 390** (no horizontal scroll, touch targets ≥ 44px) · keyboard-only path works for every flow · contrast fixed per §5 gaps · `prefers-reduced-motion` honoured · loading/empty/error states exist · Impeccable `critique` + `npx impeccable detect src/` (and against `http://localhost:5173`) have no unresolved findings — **implement the fixes, don't just report them** · Playwright screenshots of every page at the 3 widths reviewed by eye.

## 9. Phase 2 — Backend & databases

### Why two databases (be ready to explain this in the viva)

| Data | Store | Why |
|---|---|---|
| users, restaurants, cuisines, menus, dishes, favourites, orders | **PostgreSQL** | Fixed shape, relations, constraints, transactions, joins, FTS |
| preferences, reviews, search history, recently viewed | **MongoDB** | Shape varies per user (tags, per-dish ratings, filter snapshots), append-heavy, read by user/restaurant, aggregation pipelines |

### PostgreSQL
`db/postgres/schema.sql` is written and **tested**: 9 tables, `ON DELETE CASCADE` FKs, CHECK constraints (email regex, rating 0–5, price > 0, diet enum), GIN indexes (full-text + flavour tags), **triggers** (`trg_dish_search_vector` keeps the tsvector current; `trg_order_total` keeps `orders.total_amount` equal to its line items), **views** (`v_restaurant_summary`, `v_popular_dishes`). `restaurants.avg_rating/review_count` and `dishes.avg_rating/review_count` are a **cache of the Mongo review aggregate**.

### MongoDB collections (`oota` database)
```
user_preferences { _id: userId(int, from PG), cuisineIds:[int], diet, allergens:[str], spiceLevel:0-3, flavours:[str], budget:{min,max}, onboardedAt, updatedAt }   // unique on _id
reviews          { _id, restaurantId, userId, userName, rating:1-5, text, tags:[str], dishRatings:[{dishId,rating}], visitedOn, createdAt, updatedAt }
                 // indexes: {restaurantId:1, createdAt:-1}, {userId:1, createdAt:-1}, UNIQUE {userId:1, restaurantId:1}  (one review per user per place; edit = upsert)
search_history   { _id, userId, query, filters:{}, resultCount, clickedRestaurantId?, createdAt }
                 // indexes: {userId:1, createdAt:-1}; TTL index on createdAt (90 days)
restaurant_views { _id, userId, restaurantId, viewedAt }   // index {userId:1, viewedAt:-1}; keep last 20 per user
```
Create indexes in `backend/src/db/mongoIndexes.ts` on startup. Show 2+ **aggregation pipelines**: per-restaurant `{avg, count, 1–5 distribution}` with `$group`; per-user favourite tags with `$unwind`/`$group`/`$sort`.

### Review → rating sync (the key cross-database flow)
`POST /api/restaurants/:id/reviews` → validate → **upsert into Mongo** → run the Mongo aggregation for that restaurant (and each rated dish) → `UPDATE restaurants/dishes SET avg_rating, review_count` in Postgres. Mongo first, Postgres second; the recompute is **idempotent**, so a failed second step is fixed by re-running it (no distributed transaction). Document this trade-off in the report.

### API (JSON, cookie auth; all under `/api`)
```
POST /auth/signup {fullName,email,password}      POST /auth/login      POST /auth/logout     GET /auth/me
GET  /cuisines
GET  /restaurants?q&cuisine=&diet=&price=&minRating=&flavour=&sort=&limit=&offset=      GET /restaurants/:slug   (+menu grouped by category)
GET  /dishes?q&cuisine=&diet=&price=&flavour=&sort=            (Postgres full-text: websearch_to_tsquery + ILIKE fallback)
GET  /restaurants/:id/reviews?sort=   POST /restaurants/:id/reviews   PUT/DELETE own review
GET  /me/preferences   PUT /me/preferences
GET  /me/favourites    PUT/DELETE /me/favourites/:restaurantId
POST /me/searches  {query,filters,clickedRestaurantId?}     GET /me/searches?limit=
POST /me/views {restaurantId}                                 GET /me/views
GET  /me/recommendations   ->  { tiers: [{ key, title, reason, items: Recommendation<Restaurant|Dish>[] }] }   // same shape the Phase 1 hooks produce
POST /orders {restaurantId, items:[{dishId,quantity}]}   GET /me/orders   // optional stretch: a transaction demo (insert order + items in one BEGIN/COMMIT; unit_price copied from dishes)
```
Errors: `{ error: { code, message, fields? } }` with proper status codes. Never leak stack traces. Passwords: bcrypt cost 10. JWT 7d in httpOnly, SameSite=Lax cookie. Rate-limit `/auth/*`.

### Backend structure
```
backend/src/ config/env.ts · db/{pg.ts, mongo.ts, mongoIndexes.ts} · middleware/{auth,error,validate}.ts
 modules/{auth,cuisines,restaurants,dishes,reviews,preferences,favourites,activity,recommendations,orders}/{routes.ts,service.ts,schema.ts}
 services/{reviewSync.ts, recommender.ts}   scripts/{migrate.ts, seed.ts}   app.ts · server.ts
```
`recommender.ts` ports §6's scoring: hard-filter in SQL (diet/allergens), pull candidates from Postgres, signals from Mongo (preferences, last 30 searches, user's reviews, views), score in TypeScript, return reasons.

### Seeding — single source of truth
Add `npm run export:seed` in `frontend/` that writes `db/seed/*.json` from the Phase 1 mock data. `backend/src/scripts/seed.ts` loads those into Postgres (users with bcrypt hashes of `demo1234`, cuisines, restaurants, menus, dishes) and Mongo (preferences, reviews, searches, views), then runs the review sync so cached ratings match. Idempotent (`TRUNCATE … RESTART IDENTITY CASCADE` then insert). Map Phase-1 numeric ids to Postgres ids deterministically.

### Phase 3 — integration
Replace each Context's mock source with a typed API client (`frontend/src/api/`), keep component props unchanged. Vite dev proxy `/api → http://localhost:4000`. Add loading skeletons and error toasts (now real). Keep Phase 1 mock data as the seed source only.

### Env (`.env.example`) and run
`docker compose up -d` → `cd backend && npm run migrate && npm run seed && npm run dev` → `cd frontend && npm run dev`.

## 10. Impeccable (design skill) — how to use it

Install once from the **frontend** folder: `npx impeccable install` (choose *project* scope, **accept the design hook**, reload Claude Code). Copy `PRODUCT.md` into `frontend/`. Impeccable auto-runs `context` and reads `PRODUCT.md`. Useful commands: `/impeccable shape <feature>` (plan UX before code) · `/impeccable critique <target>` · `/impeccable audit <target>` · `/impeccable polish <target>` · `/impeccable layout|typeset|adapt|harden|onboard <target>` · `/impeccable document` (writes `DESIGN.md` at the end). Detector: `npx impeccable detect src/` and `npx impeccable detect http://localhost:5173`. Use it **throughout**, per page and per major component, and apply the fixes. Do not let it replace the Steel Tiffin direction (§5).

## 11. DBMS report / viva checklist (Phase 3)

ER diagram (Mermaid) · relational schema + normalisation to 3NF with the reasoning · 12+ meaningful SQL queries (joins, GROUP BY/HAVING, subquery, CTE, a window function such as `RANK() OVER (PARTITION BY restaurant_id ORDER BY avg_rating DESC)`) · triggers/functions/views explained · an index demonstrated with `EXPLAIN ANALYZE` before/after · a transaction (order placement, with a rollback demo) · Mongo schema + 2 aggregation pipelines + index justification · the "why two databases" table · the review-sync consistency trade-off · screenshots of the three demo users' different dashboards. Put it in `docs/REPORT.md`.

## 12. Working rules for Claude Code

- Windows + PowerShell. Use `npm`. Node 22. Don't use Unix-only commands in npm scripts (use `cross-env`, `rimraf`).
- Inspect the repo before changing it. Small commits per stage: `feat(frontend): …`.
- Never invent features, libraries or data outside this file without saying so. If something here conflicts with reality, say so instead of silently diverging.
- Don't commit `.env`, `node_modules`, or secrets. Keep `.env.example` current.
- Verify by running: build, type-check, the app, and real queries — don't claim it works without having run it. State honestly what you could not test.
- Phase 1 stays backend-free until the user says Phase 2 begins.
