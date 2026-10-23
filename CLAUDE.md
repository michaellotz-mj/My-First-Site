# To Do List — project context

Personal to-do app for one user (Michael). Three **fixed categories** (Work, Business, Other) →
user-created **sub-categories** (e.g. "Screening V2 config") → **activities** that get ticked off.
Ticked activities are struck through; when *every* activity in a sub-category is ticked, the
sub-category is struck through too (derived, not stored — an empty sub-category is never "complete").

## Stack
| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript, Vite 8, Tailwind CSS v4, Wouter, Lucide icons, dnd-kit (drag and drop) |
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
  src/components/          AddForm, EditableText, CategoryTabs (Today / All / Work / Business / Other), ConfirmDelete (+ .test.tsx),
                           CompletedSection, Modal (shared <dialog>), NotesDialog (+ .test.tsx), Sortable (dnd-kit),
                           SubcategoryCard (+ CardActions), TodayView, AddToTodayDialog (+ .test.tsx), UrgencyBadge (+ .test.tsx)
  src/lib/api.ts           fetch client; API_BASE from VITE_API_URL (default localhost:8787)
  src/lib/progress.ts      pure logic: completion rules, optimistic board update, tab filtering, completed split, reorder (`moveIdTo`, sub-categories and activities), Today list (`todayItems`, `nextTodayPosition`, `reorderTodayInBoard`), `setUrgencyInBoard` (+ .test.ts)
  src/lib/dates.ts         startOfLocalDay / localDayKey for the morning clear-out (+ .test.ts)
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
  setup-database.sql       one-paste, idempotent setup/upgrade for a database in the Neon SQL Editor
  mig-env.mjs              shared loader: DATABASE_URL from .dev.vars for the mig-*.mjs scripts
  mig-001-init.mjs         creates tables from schema.sql
  mig-002-subcategory-notes.mjs  adds subcategories.notes (idempotent)
  mig-003-today.mjs        adds subcategories.today and today_position (idempotent)
  mig-004-urgency.mjs      adds subcategories.urgency (idempotent)
  check-dev-vars.mjs       validates DATABASE_URL shape in .dev.vars without printing it (run in CI)
  integration.test.ts      live tests against wrangler dev
  wrangler.toml            NO secrets; ALLOWED_ORIGINS lives here
  .dev.vars.example        copy to .dev.vars (gitignored)
.claude/launch.json        api on 8787, frontend on 5174
```

## Look and feel
- Branding: "Lotz Solutions" eyebrow above the "To Do List" title in a slate-teal header band; tab title "To Do List · Lotz Solutions".
- Palette lives in `frontend/src/index.css` (`@theme`): cool-grey page, one muted hue per category (Work blue-grey, Business sage, Other sand). `CATEGORY_STYLES` in `src/lib/categoryStyles.ts` maps categories to full class names so Tailwind generates them.
- Tabs: Today, All, Work, Business, Other, each with a done/total sub-category count. The selected tab is remembered in localStorage (`todo-tab`, try/catch, defaults to All). Arrow/Home/End keys move between tabs. On phones the count sits under the label (text-xs) so all five fit at 360px.
- Deleting asks inline ("Delete? Yes / No", No focused, Escape cancels) via `ConfirmDelete`, for both activities and sub-categories. No browser `confirm()`: it is blocked in embedded previews.
- Reorder: drag and drop by a grip handle (⋮⋮) on the left of each in-progress sub-category and each activity (handle shown when the list has 2+ items). Mouse, touch (handle has `touch-action: none`, so the page doesn't scroll) and keyboard (Space, arrows, Space; Escape cancels) via dnd-kit, with spoken announcements using item names. Drops apply optimistically, then save the full order: `PUT /api/subcategories/order` (completed ones keep their relative order at the end) or `PUT /api/subcategories/:id/activities/order`. Dragging between categories or sub-categories is not supported.
- Completed section: fully ticked sub-categories leave their category and appear in one "Completed" section at the bottom of the current tab (tagged with their category, collapsed by default). It can be open, minimised or hidden (`todo-completed-view` in localStorage). Unticking moves a card back.
- Notes: a note icon on each sub-category (category-coloured and filled when it has notes) opens a modal `<dialog>` with a textarea. Save (or Ctrl/Cmd+Enter) saves; Cancel, Escape or clicking outside discards. Saved optimistically via `PATCH /api/subcategories/:id {notes}`.
- Today: a shared list of sub-categories picked from any category (same records, not copies, so ticks show everywhere). Add via the ☀ toggle on any card, the "Add from your lists" picker (always lists Work, Business and Other: unfinished sub-categories with Add, ones already on Today marked "On Today", an empty-state line, and a "New … sub-category" box per category that creates straight onto Today), or "New task for today" (category select + name; `POST /api/subcategories {today: true}`). Today has its own drag order (`today_position`, `PUT /api/today/order`). Finished Today items show in Today's Completed section; "Clear finished from Today" sets `today: false` on them. Morning clear-out: on the first load of each local day (also when the app becomes visible again, and every 5 minutes, so an overnight tab clears too) the app calls `POST /api/today/clear-finished {before: local midnight}`, which takes off Today every sub-category whose activities were all ticked before that moment (latest `activities.done_at`). Unfinished items, empty ones, and ones finished today stay. Uses the device's own time zone; a failed clear-out never blocks loading. In mixed lists the category tag sits beside the progress bar.
- Urgency: each sub-category has a 1 / 2 / 3 badge before its name (1 red "Do first", 2 amber "Important, not urgent" — the default, 3 grey "Can wait"). The badge is a transparent native `<select>` over the number, so phones show their own picker. Changing *to* 1 moves the sub-category to the top of its category and of Today (server-side in the PATCH, mirrored optimistically by `setUrgencyInBoard`); after that, drag order wins. Changing to 2 or 3, or setting 1 again, does not move it. The Add-to-Today picker shows a read-only badge.
- Text colours and fonts are deliberately unchanged; colour is used for dots, count pills, tick boxes and the per-sub-category progress bar.

## Data model
- `subcategories(id, category ∈ {work,business,other}, name, notes (≤10,000 chars, default ''), position, today (bool), today_position, urgency (1|2|3, default 2), created_at)`
- `activities(id, subcategory_id → subcategories ON DELETE CASCADE, title, done, done_at, position, created_at)`
- Categories are a CHECK constraint, not a table — they are fixed by design.

## API
| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/api/health` | – | runs `SELECT 1` (CI waits on this) |
| GET | `/api/board` | – | all 3 categories, always, with nested sub-categories/activities |
| POST | `/api/subcategories` | `{category, name, today?}` | 201; `today: true` also adds it to the bottom of Today |
| PATCH | `/api/subcategories/:id` | `{name?, notes?, today?, urgency?}` | **partial** — omitted fields kept via `COALESCE`; empty notes clears them; joining Today puts it at the bottom; changing urgency *to* 1 moves it to the top of its category and of Today |
| PUT | `/api/today/order` | `{ids}` | sets `today_position` = index; ids not on Today ignored |
| POST | `/api/today/clear-finished` | `{before}` (ISO, within a week of now) | sets `today = false` on fully ticked sub-categories whose last tick is before `before`; returns `{cleared: ids}` |
| PUT | `/api/subcategories/order` | `{category, ids}` | sets `position` = index; ids from other categories ignored |
| DELETE | `/api/subcategories/:id` | – | cascades to activities |
| POST | `/api/subcategories/:id/activities` | `{title}` | 404 if sub-category missing |
| PUT | `/api/subcategories/:id/activities/order` | `{ids}` | sets activity `position` = index; ids from other sub-categories ignored |
| PATCH | `/api/activities/:id` | `{title?, done?}` | **partial** — omitted fields kept via `COALESCE`; `done_at` maintained |
| DELETE | `/api/activities/:id` | – | |

Errors: 400 `{error}` for bad input, 404 unknown id/route, 405 wrong method, 500 `{error:"internal error"}` (message logged, never the connection string).

## Setup checklist (Michael — one-off, needs your accounts)
Deploys use **Cloudflare Workers Builds** (Cloudflare connected to this GitHub repo; every merge to `main` rebuilds and redeploys both Workers). Nothing is run from a local machine.
1. **Neon**: one project for this app. `production` branch = real data; `dev` branch = local + CI (tests never touch real data).
2. **GitHub secret** `DEV_VARS` = the `dev` branch connection string (bare string or full `.dev.vars`). Update it whenever the dev password changes, or CI fails with `password authentication failed`.
3. **Production tables**: paste `api/setup-database.sql` into the Neon SQL Editor with `production` selected and Run. Safe to re-run; upgrades older tables without losing data.
4. **API Worker** (`todo-api`): Workers & Pages → Create → Import a repository → this repo. Root directory `api`, build command `npm ci`, deploy command `npx wrangler deploy`. Name must match `wrangler.toml` (`todo-api`).
5. **Secret**: `todo-api` → Settings → Variables and Secrets → `DATABASE_URL`, type **Secret**, value = `production` connection string. Check `https://todo-api.<subdomain>.workers.dev/api/health` → `{"ok":true}`.
6. **Frontend Worker** (`todo-frontend`): import the repo again. Root directory `frontend`, build command `npm ci && npm run build`, deploy command `npx wrangler deploy`, build variable `VITE_API_URL` = the API URL (no trailing slash). Name must match `wrangler.jsonc` (`todo-frontend`).
7. **CORS**: put the frontend URL in `api/wrangler.toml` → `ALLOWED_ORIGINS` (via a PR); merging it redeploys the API.

## Migrations
- `schema.sql` is the full current schema (used by `mig-001` for a brand-new database). Each later change gets an idempotent `mig-NNN-*.mjs`.
- CI runs every `mig-[0-9]*.mjs` in order against the `dev` branch before the integration tests, so dev stays current automatically.
- **Production is never migrated automatically.** Ask Michael first, then run the new SQL in the Neon SQL Editor with `production` selected *before* merging the PR that needs it (merging to `main` deploys). `api/setup-database.sql` always holds the full idempotent setup — add each new migration's ALTER to it.
- Pending for production (only if its tables were created from an older `schema.sql`; all are safe to re-run):
  - `mig-002`: `ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS notes TEXT NOT NULL DEFAULT '' CHECK (length(notes) <= 10000);`
  - `mig-003`: `ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS today BOOLEAN NOT NULL DEFAULT false;` and `ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS today_position INTEGER NOT NULL DEFAULT 0;`
  - `mig-004`: `ALTER TABLE subcategories ADD COLUMN IF NOT EXISTS urgency SMALLINT NOT NULL DEFAULT 2 CHECK (urgency IN (1, 2, 3));`

## Deploy rules
- Deploys happen automatically on every merge to `main` (Workers Builds). Secrets set in the dashboard survive deploys; plain-text dashboard variables do not.
- **If ever deploying by hand** (`npx wrangler deploy` in `api/`): run `npx wrangler secret list` first and confirm `DATABASE_URL` is listed. If `[]`, STOP.
- `ALLOWED_ORIGINS` is defined in `wrangler.toml`, so any value edited in the dashboard is overwritten on deploy — edit the toml.
- The version badge only changes when `src/version.ts` is bumped (`node bump-version.mjs` in `frontend/`, committed); Workers Builds does not bump it.
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
- **2026-10-23** — Deploy prep: `api/setup-database.sql` (tested on a fresh DB and on one created from the original schema, and re-run); setup checklist rewritten for Cloudflare Workers Builds.
- **2026-10-23** — Today clears finished items automatically each morning (first open of the local day; `POST /api/today/clear-finished`, based on existing `done_at`, no schema change).
- **2026-10-22** — Fixed: the Add-to-Today picker hid categories with nothing to add, so Business and Other could vanish. It now always shows all three, marks items already on Today, and can create new ones per category.
- **2026-10-22** — Urgency 1/2/3 on sub-categories (badge picker, default 2; setting 1 jumps to the top, drag order wins after). **Schema change:** `subcategories.urgency` via `mig-004`.
- **2026-10-22** — Today tab: pick sub-categories from any category (☀ toggle, picker, or new task), own drag order, clear finished. **Schema change:** `subcategories.today`, `today_position` via `mig-003`. Card extracted to `SubcategoryCard` with a `CardActions` bundle; shared `Modal`.
- **2026-10-22** — Reordering is now drag and drop (dnd-kit, grip handles; mouse, touch and keyboard) instead of ▲▼ buttons. Same API, no schema change.
- **2026-10-22** — Notes on sub-categories (note icon + pop-up). **Schema change:** `subcategories.notes` via `mig-002`; CI now applies migrations to dev. PATCH sub-category is now partial (`name?`, `notes?`).
- **2026-10-21** — Reorder activities within a sub-category (▲▼, new `PUT /api/subcategories/:id/activities/order`, no schema change).
- **2026-10-21** — Reorder sub-categories (▲▼, new `PUT /api/subcategories/order`, no schema change); completed sub-categories move to a Completed section that can be minimised or hidden. Fixed: API now parses PUT bodies.
- **2026-10-21** — Inline "are you sure?" before deleting activities and sub-categories.
- **2026-10-21** — Categories split into tabs with an All tab first.
- **2026-10-21** — Added colour (neutral palette, per-category accents, progress bars) and Lotz Solutions branding.
- **2026-10-21** — API error logs now pass through `redactSecrets` (the Neon driver puts the full connection string in some error messages). `check-dev-vars.mjs` parses URLs the way the driver does and names common paste mistakes.
- **2026-10-21** — Initial scaffold: schema, API (8 routes at the time), single-page board UI, 30 unit tests, 5 integration tests, CI. Verified locally: integration tests against `wrangler dev` + Postgres 16 via a local Neon-HTTP shim (not committed), and a headless-Chromium run of create → tick → strike-through → rename → reload → delete with no orphan rows. Not yet deployed.
