# To Do List — project context

Personal to-do app for one user (Michael). Three **fixed categories** (Work, Business, Other) →
user-created **sub-categories** (e.g. "Screening V2 config") → **activities** that get ticked off.
Ticked activities are struck through; when *every* activity in a sub-category is ticked, the
sub-category is struck through too (derived, not stored — an empty sub-category is never "complete").

## Stack
| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript, Vite 8, Tailwind CSS v4, Wouter, Lucide icons |
| API | Cloudflare Worker (TypeScript), `api/src/index.ts` |
| Database | Neon Postgres via `@neondatabase/serverless` (HTTP, tagged-template queries only) |
| Hosting | `wrangler deploy` from `frontend/` (static assets) and `api/` (Worker) |
| Tests | Vitest — unit tests (pure logic) + API integration tests against `wrangler dev` |
| CI | `.github/workflows/test.yml`, Node 24, both suites on every push/PR |

## Layout
```
frontend/
  src/App.tsx              router (Wouter)
  src/pages/Home.tsx       the whole board (one page)
  src/pages/NotFound.tsx
  src/components/          AddForm, EditableText, CategoryTabs (All / Work / Business / Other), ConfirmDelete (+ .test.tsx), CompletedSection
  src/lib/api.ts           fetch client; API_BASE from VITE_API_URL (default localhost:8787)
  src/lib/progress.ts      pure logic: completion rules, optimistic board update, tab filtering, completed split, reorder (`moveId`, sub-categories and activities) (+ .test.ts)
  src/lib/storage.ts       loadChoice/saveChoice for remembered UI choices (localStorage, never throws)
  src/lib/categoryStyles.ts per-category Tailwind class names
  src/version.ts           bumped by bump-version.mjs on every deploy, shown as a badge
  wrangler.jsonc           static assets, SPA fallback
api/
  src/index.ts             router, CORS, handlers
  src/validate.ts          pure input validation (+ .test.ts)
  src/board.ts             pure row → nested board shaping (+ .test.ts)
  src/redact.ts            strips connection strings from logged errors (+ .test.ts)
  schema.sql               reference schema (source of truth)
  mig-001-init.mjs         creates tables; reads DATABASE_URL from .dev.vars
  check-dev-vars.mjs       validates DATABASE_URL shape in .dev.vars without printing it (run in CI)
  integration.test.ts      live tests against wrangler dev
  wrangler.toml            NO secrets; ALLOWED_ORIGINS lives here
  .dev.vars.example        copy to .dev.vars (gitignored)
.claude/launch.json        api on 8787, frontend on 5174
```

## Look and feel
- Branding: "Lotz Solutions" eyebrow above the "To Do List" title in a slate-teal header band; tab title "To Do List · Lotz Solutions".
- Palette lives in `frontend/src/index.css` (`@theme`): cool-grey page, one muted hue per category (Work blue-grey, Business sage, Other sand). `CATEGORY_STYLES` in `src/lib/categoryStyles.ts` maps categories to full class names so Tailwind generates them.
- Tabs: All, Work, Business, Other, each with a done/total sub-category count. The selected tab is remembered in localStorage (`todo-tab`, try/catch, defaults to All). Arrow/Home/End keys move between tabs. On phones the count sits under the label so all four fit.
- Deleting asks inline ("Delete? Yes / No", No focused, Escape cancels) via `ConfirmDelete`, for both activities and sub-categories. No browser `confirm()`: it is blocked in embedded previews.
- Reorder: ▲▼ buttons on in-progress sub-categories move them within their category (optimistic, then `PUT /api/subcategories/order` with the category's full id order). Completed ones keep their relative order at the end. Activities have the same ▲▼ buttons (shown when a sub-category has 2+ activities) and save via `PUT /api/subcategories/:id/activities/order`.
- Completed section: fully ticked sub-categories leave their category and appear in one "Completed" section at the bottom of the current tab (tagged with their category, collapsed by default). It can be open, minimised or hidden (`todo-completed-view` in localStorage). Unticking moves a card back.
- Text colours and fonts are deliberately unchanged; colour is used for dots, count pills, tick boxes and the per-sub-category progress bar.

## Data model
- `subcategories(id, category ∈ {work,business,other}, name, position, created_at)`
- `activities(id, subcategory_id → subcategories ON DELETE CASCADE, title, done, done_at, position, created_at)`
- Categories are a CHECK constraint, not a table — they are fixed by design.

## API
| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/api/health` | – | runs `SELECT 1` (CI waits on this) |
| GET | `/api/board` | – | all 3 categories, always, with nested sub-categories/activities |
| POST | `/api/subcategories` | `{category, name}` | 201 |
| PATCH | `/api/subcategories/:id` | `{name}` | full update (name is the only field) |
| PUT | `/api/subcategories/order` | `{category, ids}` | sets `position` = index; ids from other categories ignored |
| DELETE | `/api/subcategories/:id` | – | cascades to activities |
| POST | `/api/subcategories/:id/activities` | `{title}` | 404 if sub-category missing |
| PUT | `/api/subcategories/:id/activities/order` | `{ids}` | sets activity `position` = index; ids from other sub-categories ignored |
| PATCH | `/api/activities/:id` | `{title?, done?}` | **partial** — omitted fields kept via `COALESCE`; `done_at` maintained |
| DELETE | `/api/activities/:id` | – | |

Errors: 400 `{error}` for bad input, 404 unknown id/route, 405 wrong method, 500 `{error:"internal error"}` (message logged, never the connection string).

## Setup checklist (Michael — one-off, needs your accounts)
1. **Neon**: create a *new* project just for this app. Recommended: use the default `production` branch (Neon's name for main in new projects) for real data and create a `dev` branch for local + CI so tests never touch real data.
2. **Local**: `cp api/.dev.vars.example api/.dev.vars`, paste the `dev` branch connection string, then `cd api && npm ci && node mig-001-init.mjs`.
3. **GitHub secret** `DEV_VARS` (repo → Settings → Secrets → Actions): either the full contents of `api/.dev.vars` or just the bare `dev` branch connection string. CI's API job fails with a clear error until this exists.
4. **First API deploy**: `cd api && npx wrangler deploy` (the Worker doesn't exist yet, so there is nothing to wipe). Note the `https://todo-api.<you>.workers.dev` URL.
5. **Cloudflare dashboard** → Workers → `todo-api` → Settings → Variables and Secrets → add `DATABASE_URL` as type **Secret** (the `production` branch URL). Create the tables on `production` once by pasting `api/schema.sql` into the Neon SQL Editor with `production` selected.
6. **Frontend**: create `frontend/.env.production` (gitignored) with `VITE_API_URL=https://todo-api.<you>.workers.dev`, then `cd frontend && npm ci && npm run deploy`. Note the frontend URL.
7. Put the frontend URL in `api/wrangler.toml` → `ALLOWED_ORIGINS`, then redeploy the API (with the secret check below).

## Deploy rules
- **Before every `npx wrangler deploy` in `api/`: run `npx wrangler secret list` and confirm `DATABASE_URL` is listed. If `[]`, STOP.** (Exception: step 4 above, the very first deploy.)
- `ALLOWED_ORIGINS` is defined in `wrangler.toml`, so any value edited in the dashboard is overwritten on deploy — edit the toml.
- Frontend: `npm run deploy` = `tsc --noEmit && bump-version && build && wrangler deploy`. Commit the bumped `src/version.ts`.
- Ask before deploying anything that changes the schema.

## Development
- `cd api && npm run dev` (8787) and `cd frontend && npm run dev` (5174).
- Unit tests: `npm test` in each folder. Integration: start the API, then `cd api && npm run test:integration`.
- Integration tests create a sub-category tagged `__itest_<timestamp>`, delete it in `afterAll` (cascade), and assert no leftovers.

## Security
- Secrets: `.dev.vars`, `.env*`, `.wrangler/` are gitignored (`.gitignore` is UTF-8; verified with `git check-ignore -v api/.dev.vars`).
- `DATABASE_URL` is only ever a Cloudflare Secret or in local `.dev.vars` — never in `wrangler.toml`, logs or chat.
- All SQL uses Neon tagged templates (parameterised). Neon rejects `undefined` params — validators return `null` for omitted fields.
- CORS: localhost (any port) + `ALLOWED_ORIGINS` only.
- **No authentication yet (by Michael's choice).** Anyone who finds the URLs can read/edit the list. Recommended fix when wanted: Cloudflare Access (free, email one-time code) in front of both Workers — no app code needed.

## Gotchas
- Neon driver typing: use `neon<false, false>(...)` so results type as row arrays.
- Activity tick is optimistic (`updateActivityInBoard`) — a controlled checkbox otherwise doesn't change until the API round-trip finishes, which feels laggy. The board reloads after every change, so a failed save corrects itself.
- Sub-category completion is derived on the client (`activityProgress`); there is no `done` column on sub-categories.

## Open items
- Complete the setup checklist and first deploy (needs Michael's Neon/Cloudflare/GitHub access).
- Authentication (see Security).

## Change log
- **2026-10-21** — Reorder activities within a sub-category (▲▼, new `PUT /api/subcategories/:id/activities/order`, no schema change).
- **2026-10-21** — Reorder sub-categories (▲▼, new `PUT /api/subcategories/order`, no schema change); completed sub-categories move to a Completed section that can be minimised or hidden. Fixed: API now parses PUT bodies.
- **2026-10-21** — Inline "are you sure?" before deleting activities and sub-categories.
- **2026-10-21** — Categories split into tabs with an All tab first.
- **2026-10-21** — Added colour (neutral palette, per-category accents, progress bars) and Lotz Solutions branding.
- **2026-10-21** — API error logs now pass through `redactSecrets` (the Neon driver puts the full connection string in some error messages). `check-dev-vars.mjs` parses URLs the way the driver does and names common paste mistakes.
- **2026-10-21** — Initial scaffold: schema, API (8 routes at the time), single-page board UI, 30 unit tests, 5 integration tests, CI. Verified locally: integration tests against `wrangler dev` + Postgres 16 via a local Neon-HTTP shim (not committed), and a headless-Chromium run of create → tick → strike-through → rename → reload → delete with no orphan rows. Not yet deployed.
