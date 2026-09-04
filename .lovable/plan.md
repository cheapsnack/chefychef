# Private kitchens per visitor + locked-down data access

Right now the database lets anyone on the internet read, edit or delete every grocery item and every recipe. This plan gives each visitor their own private grocery list (no sign-up), and makes recipes read-only shared content.

## How it will work

- On a visitor's first load, the server issues an encrypted, http-only cookie holding a random "kitchen ID". Nothing identifying, no login.
- Every grocery item is stamped with that kitchen ID. The visitor only ever sees and edits their own items.
- The browser no longer talks to the database directly. All grocery reads and writes go through server code that derives the kitchen ID from the cookie — it can never be supplied or faked by the browser.
- Recipes stay a shared, public, read-only catalogue: everyone can read them, nobody can change them from the web.

Trade-offs of the cookie approach (as chosen): the list is per browser/device. Clearing cookies, using private browsing, or switching to another device starts a fresh empty kitchen. Adding real accounts later would fix that and can reuse everything built here.

## Database changes (one migration)

1. Add `owner_key text` to `groceries` plus an index on it. Existing rows get a legacy key so they're not visible to new visitors (they can be deleted afterwards if you don't want them).
2. Make `owner_key` required for new rows.
3. Drop the `public ALL USING(true)` policy on `groceries`. Revoke `anon`/`authenticated` privileges — the table becomes reachable only through trusted server code, which is what enforces the per-kitchen scoping.
4. Drop the `public ALL USING(true)` policy on `recipes`. Replace with a read-only policy for anonymous and signed-in readers; grant `SELECT` only. Writes remain possible only through trusted server code.

## Technical details

- New secret `SESSION_SECRET` (generated, not user-supplied) encrypts the cookie via TanStack `useSession` (`http-only`, `secure`, `sameSite: lax`, 1-year max age). Session config built inside handlers, never at module scope.
- New `src/lib/groceries.functions.ts` with `createServerFn` handlers: `listGroceries`, `insertGrocery`, `updateGrocery`, `deleteGrocery`. Each one:
  - resolves/creates the kitchen ID from the session,
  - loads `supabaseAdmin` with `await import("@/integrations/supabase/client.server")` inside the handler,
  - filters/stamps every query with `owner_key`, and ignores any `owner_key` coming from the client,
  - validates input with a zod-style `inputValidator`.
- `src/integrations/api/client.ts` keeps its exact same `api` shape, but each method delegates to the matching server function, so hooks/components are untouched. `listRecipes` moves to a public server function using the publishable-key server client (with the `sb_` apikey fetch shim), keeping recipes SSR-safe.
- Route `/` currently prefetches groceries; the session cookie is set on the first server call, so cookie issuance happens server-side before the first render.
- No auth gate, no `_authenticated` routes, no changes to the UI.

## Verification

- Run the security scan again and confirm the two "anyone can modify" findings are gone.
- Browser check: add an item in one browser context, confirm a second fresh context sees an empty list and cannot see or delete the first context's item.
