# Chefychef — Smart Meal Planner

Log your groceries, track what's about to expire, and get recipe suggestions ranked by how well they use up ingredients before they go bad. Built to cut food waste, not just to list recipes.

Live app: https://chefychef.imranmn.life

## Features

- **Log groceries** — name, category, quantity, unit, purchase date, and an optional expiry date.
- **Automatic expiry estimation** — if you leave the expiry date blank, it's estimated from typical shelf life by category:

  | Category | Shelf life |
  | --- | --- |
  | Produce | 7 days |
  | Dairy | 10 days |
  | Meat | 4 days |
  | Seafood | 2 days |
  | Bakery | 5 days |
  | Frozen | 90 days |
  | Pantry | 180 days |
  | Other | 14 days |

- **Color-coded grocery list** — red (expired), orange (0–2 days left), yellow (3–5 days), green (5+ days). Mark items used or delete them without losing your history.
- **Recipe suggestions that re-rank live** — the suggestion list recomputes automatically as your grocery list changes; it's a scoring algorithm, not a static filter.
- **79 seed recipes**, with a strong focus on regional Indian cooking (Punjabi, South Indian, Bengali, Gujarati, Maharashtrian, Rajasthani, Hyderabadi, Kerala, Goan, Indo-Chinese, and street food, spanning breakfast through dessert), plus American, Italian, other Asian, Mediterranean, Mexican, Chinese, Thai, and Middle Eastern dishes. Every recipe has a meal type, diet (vegetarian / vegan / non-vegetarian / eggetarian / jain), and spice level; the 40 newer regional-Indian recipes additionally carry a region and difficulty rating (the original 39 don't have those two set yet).

## How the suggestion algorithm works

Every grocery item you haven't marked "used" gets an urgency score: `urgency = max(1, 10 − days_until_expiry)`. Items expiring sooner weigh more; there's a floor of 1 so nothing is ignored entirely, and expired items don't blow the scale out.

Recipe ingredients are matched against your grocery names two ways: a case-insensitive substring match first, then a Dice's-coefficient similarity check (threshold 0.8) as a fallback, to catch things like plurals or minor wording differences.

```
score = Σ urgency(matched required ingredients)
       + 0.5 × Σ urgency(matched optional ingredients)
       − 1.5 × (# missing required ingredients)
```

Worked example: spinach expires in 1 day (urgency 9), milk in 2 days (urgency 8). A recipe needs spinach (required) and egg (required, not on hand), with milk optional and cheese required-but-missing:

```
score = 9 (spinach) + 0.5 × 8 (milk, optional) − 1.5 (missing cheese)
      = 11.5
```

The app also generates a plain-language reason, e.g. "Uses 2 items expiring within 3 days: spinach, milk."

## Architecture

**Groceries are private per visitor, with no login required.** On first load, the server issues an encrypted, http-only session cookie holding a random "kitchen id." Every grocery row is stamped with that id, and all reads/writes are scoped to it server-side — the browser never talks to the groceries table directly (row-level security is on with no client grants; only trusted server code, using the service-role key, can reach it). Clearing cookies, using private browsing, or switching devices starts a fresh, empty kitchen — there's no account to log back into.

**Recipes are the opposite:** a shared, public, read-only catalog. Anyone can read them; nobody can write to them from the client.

## Tech stack

- TanStack Start + TanStack Router (React 19, Vite, SSR + server functions)
- TypeScript
- Tailwind CSS v4
- shadcn/ui components (Radix primitives)
- react-hook-form + zod for form handling/validation
- Supabase (Postgres) for storage

## Data model

- `groceries` — id, name, category (produce / dairy / meat / seafood / bakery / frozen / pantry / other), quantity, unit, purchase_date, expiry_date, used, notes, owner_key (the per-visitor kitchen id, set only by server code).
- `recipes` — id, name (unique), cuisine, prep_time_minutes, servings, instructions, ingredients (jsonb array of `{ name, quantity_text, optional }`), meal_type, diet, region, difficulty, spice_level.

Ingredient names are intentionally plain, lowercase, everyday grocery wording (e.g. "paneer", not "250g cubed paneer") so the matching algorithm above works well against whatever you actually typed into your grocery log.

`region` and `difficulty` are currently NULL on the original 39 recipes (they predate those columns) — worth a follow-up backfill if the UI ever filters or sorts on either field.

## Local development

You'll need Node.js and a `.env` with Supabase credentials (`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_PROJECT_ID`, plus their `VITE_`-prefixed equivalents for the client bundle) and a `SESSION_SECRET` for the kitchen-cookie encryption.

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Known limitations

- No accounts — a "kitchen" is tied to a browser/device via cookie, not a person. Clearing cookies or switching devices starts fresh. Adding real authentication later would fix this and can reuse the existing server-function structure.
- Shelf-life estimates are rough averages for typical home storage, not food-safety guidance.
- Recipes are shared across all visitors (read-only), not per-kitchen.

## Possible next steps

- Real accounts, so a kitchen persists across devices.
- An "auto-consume" action that marks matched groceries as used when a suggested recipe is cooked.
- A running "waste reduced" stat.
- Exporting missing ingredients as a shopping list.
- Filtering/searching recipes by cuisine, region, diet, or meal type in the UI (the data already supports it).
