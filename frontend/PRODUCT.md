# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React + Vite + TypeScript, Tailwind CSS, Framer Motion (subtle transitions only), Lucide React icons. Specified by the user in the brief. Phase 1 is frontend-only: realistic mock data and client-side state, no backend, no fake API calls. A later phase adds PostgreSQL (users, restaurants, menus, orders) and MongoDB (preferences, reviews, search history) for a PES University DBMS mini-project.

## Users

Diners in Bengaluru who use the app to decide where and what to eat: they come in hungry or planning, scan options quickly, and want suggestions that already reflect their tastes instead of the same list everyone sees. Secondary audience: the course evaluators reviewing the project demo.

## Product Purpose

Oota (Kannada for "meal") is a personalised food discovery platform. Users create an account, state favourite cuisines and dietary preferences, explore restaurants and menus, search dishes, rate and review food, and save favourites. Success: each user's home screen differs meaningfully from another user's, and the reasons are legible.

## Positioning

Recommendations come from three visible signals: what the user said they like (preferences), what they searched for, and what they rated. The interface shows why something is recommended, not just that it is.

## Operating Context

Bengaluru neighbourhoods (Indiranagar, Koramangala, Jayanagar, HSR Layout, Malleshwaram, Whitefield, etc.), Indian regional and global cuisines, prices in ₹ (cost for two, per-dish price). Ratings out of 5. Veg / non-veg / egg / vegan distinctions matter culturally and must be clear.

## Capabilities and Constraints

- Auth: login, signup, onboarding (cuisines, dietary preference, food interests / flavour profile).
- Personalised dashboard: welcome, recent-search recommendations, top-rated matching preferences, trending restaurants and dishes, recently viewed, favourite cuisines.
- Search & discovery: restaurants and dishes; filters for cuisine, diet, price, rating, flavour profile; instant filtering; empty states; clear filters.
- Restaurant page: cover image, name, cuisines, rating, price, location, menu category navigation, dish cards, save/favourite, review and rating modal, reviews list.
- All visible interactive elements must work against mock data.

## Evidence on Hand

No real restaurants, reviews or users. All restaurants, dishes, reviews and ratings are synthetic demo data and must not imitate real businesses by name. Food photography is hotlinked from Unsplash (free licence); every URL must be verified to resolve.

## Product Principles

1. Personal before popular: the user's own signals lead; popularity is a fallback.
2. Show the reason: every recommendation can say why it is there.
3. Decide fast: scanning, filtering and comparing take seconds, not scrolling marathons.
4. Food leads, chrome recedes: photography carries richness; the interface stays quiet.
5. Every control works: nothing decorative pretends to be interactive.

## Accessibility & Inclusion

WCAG 2.1 AA contrast; keyboard navigable; diet markers never rely on colour alone (veg/non-veg needs a shape or label too).
