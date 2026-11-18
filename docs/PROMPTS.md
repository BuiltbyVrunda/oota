# Prompts to give Claude Code — run in order

Open Claude Code in `F:\DBMSminiproject`. `CLAUDE.md` loads automatically. Check each stage works before moving on. Start a fresh session between phases if the context gets long (CLAUDE.md carries everything).

---

## Prompt 0 — Scaffold + tools
```
Read CLAUDE.md fully. Don't write app code yet.
1. Create frontend/ with Vite + React + TypeScript (strict). Install: tailwindcss@4 @tailwindcss/vite react-router-dom@6 framer-motion lucide-react clsx @fontsource-variable/bricolage-grotesque @fontsource-variable/geist @fontsource/noto-sans-kannada. Configure the Tailwind plugin.
2. Copy PRODUCT.md and docs/images.ts (-> frontend/src/data/images.ts) into frontend/.
3. From frontend/, run `npx impeccable install` (project scope, accept the design hook). Tell me if it needs anything from me.
4. Create the folder structure from CLAUDE.md §4 (empty files are fine).
5. Write styles/tokens.css and styles/globals.css from §5 exactly.
Then show me the tree and stop.
```

## Prompt 1 — Foundation
```
Phase 1, Stage 2 (CLAUDE.md §5–§6). Build: the ui/ components (Button, IconButton, Input, Chip, Select, RangeSlider, Tabs, Modal, Popover, Toast, Skeleton, StarRating, StarInput, DietMark, MatchMeter), common/ (ReasonPlate, Rail, SectionHeader, SmartImage, PriceLevel, EmptyState), layout/ (AppShell, TopBar, MobileTabBar, AuthLayout, PageContainer), router.tsx with the protected-route guard, and a temporary /kit page showing every component in every state.
Use Impeccable: /impeccable shape for the shell, then /impeccable critique on /kit. Implement the fixes. Screenshot at 1440/834/390 with Playwright and look at them. Commit.
```

## Prompt 2 — Mock data + state
```
Phase 1, data + state (CLAUDE.md §6–§7). Write types/index.ts exactly as specified. Build data/ (cuisines, areas, flavours, restaurants, dishes, reviews, users) following the roster, volumes and demo users in §7 — realistic, spread-out ratings, specific review text, invented names, photos from images.ts. Build the five contexts (localStorage, keys oota:v1:*), utils/recommend.ts (pure, with unit tests via vitest for: diet hard-filter, cold start, decay of old searches, rating boost/penalty, reasons text) and utils/filter.ts. No fetch, no fake latency.
Prove it: a test that the three demo users get different top-5 restaurants. Commit.
```

## Prompt 3 — Auth + onboarding
```
Build Login, Signup (cross-fade between them), and the 3-step Onboarding exactly as in CLAUDE.md §6A, plus PreferencesPage. Use /impeccable onboard and /impeccable critique on each page, implement the fixes, screenshot at 3 widths. Commit.
```

## Prompt 4 — Dashboard
```
Build DashboardPage per CLAUDE.md §6B with the six tiers, ReasonPlate popovers that show the real signals, and varied shapes (not a uniform card grid). Log in as each demo user and confirm the dashboards look clearly different. /impeccable critique + layout + polish, implement fixes, screenshots. Commit.
```

## Prompt 5 — Discover
```
Build DiscoverPage per CLAUDE.md §6C: search + suggestions, Restaurants/Dishes tabs, all five filters, sort, instant filtering with in-place reorder, active-filter chips, Clear all, rich empty state, search history recording. Every filter combination must work. /impeccable critique + adapt (mobile filters as a sheet, not a modal), implement fixes, screenshots. Commit.
```

## Prompt 6 — Restaurant page
```
Build RestaurantPage per CLAUDE.md §6D: cover, meta, Open/Closed, Save, sticky menu nav with scroll-spy, dish rows, Veg-only toggle, review summary + list + sort, and the Review modal (focus trap, Esc, validation). Submitting a review must update the average and change recommendations. Also SavedPage. /impeccable critique + polish, implement fixes, screenshots. Commit.
```

## Prompt 7 — Phase 1 quality gate
```
Run the full CLAUDE.md §8 checklist across every page: build, tsc, eslint, keyboard-only walkthrough, contrast (fix the known gaps in §5), reduced motion, 1440/834/390 screenshots, `npx impeccable detect src/` and against the running dev server. Fix everything you find, then run /impeccable document to write DESIGN.md. Give me a short honest report of what passed and what you couldn't verify.
```

---
## — Phase 2 (only after Phase 1 is approved) —

## Prompt 8 — Databases
```
Phase 2 (CLAUDE.md §9). Create docker-compose.yml (postgres:16 mounting db/postgres/schema.sql into docker-entrypoint-initdb.d, mongo:7) and .env.example if missing; start them. Confirm schema.sql loads cleanly. Then in frontend/ add `npm run export:seed` -> db/seed/*.json. Create backend/ (Express 5 + TS + tsx + zod + pg + mongodb), config/env, db/pg.ts, db/mongo.ts, Mongo index creation, scripts/migrate.ts and scripts/seed.ts (idempotent). Run migrate + seed and show me row/document counts in both databases.
```

## Prompt 9 — API
```
Build the API in CLAUDE.md §9 module by module (auth, cuisines, restaurants, dishes, reviews + reviewSync, preferences, favourites, activity, recommendations, orders). Raw SQL with parameterised queries only. vitest + supertest tests for: signup/login/cookie, filtered restaurant query, dish full-text search, review upsert → Postgres avg_rating updates, recommendations differ per demo user, order transaction rollback. Run them and show results.
```

## Prompt 10 — Integrate
```
Phase 3. Replace the mock sources in the five contexts with a typed API client (frontend/src/api/), add the Vite /api proxy, keep component props unchanged, add real loading/error states. Walk through: sign up → onboard → dashboard → search → open restaurant → review → see the dashboard change. Fix what breaks. Use Playwright to prove it end to end.
```

## Prompt 11 — Report
```
Write docs/REPORT.md per CLAUDE.md §11 using the real schema and real queries from the running system (run EXPLAIN ANALYZE for real, don't invent numbers). Include Mermaid ER diagram, normalisation, 12+ queries with output, triggers/views/transaction demos, Mongo pipelines, and the why-two-databases table. Add a short viva Q&A.
```
