# Release Notes

## v1.3.0 — user_id gated POST via Supabase allowlist (2026-07-19)

### What's New

**POST is gated by a Supabase `post_access` allowlist.** The user enters a `user_id` in the UI. If that id is allowlisted, POST is enabled and each POST is logged to `request_logs`. The allowlist **is** the feature flag — no temp-id, no `NEXT_PUBLIC_ENABLE_POST`.

#### Core behavior
- **User ID input** — always visible below the URL bar; blur/Enter checks `/api/access`
- **GET always on** — unchanged; LocalStorage history kept
- **POST UX** — greys out unless `postEnabled`; server is the authoritative gate
- **Server proxy gate** — `ENABLE_POST_METHOD` kill switch + `isValidUserId` + `canUsePost`
- **Audit log** — `logRequest` inserts into `request_logs` with sanitized headers

#### New / changed files
- `src/lib/validate.ts` — `isValidUserId`
- `src/lib/supabase-server.ts` — `pg.Pool`, `canUsePost`, `logRequest`, `sanitizeHeaders`
- `src/app/api/access/route.ts` — `GET ?user_id=` → `{ postEnabled }`
- `src/app/api/proxy/route.ts` — POST allowlist + logging
- `src/app/page.tsx` — user_id field + access indicator
- `migrations/001_post_access.sql` — schema
- `tests/validate.test.ts`, `tests/access.test.ts`, `tests/sanitize-headers.test.ts`
- `.env.example` — placeholders only (no secrets)

#### Migration SQL (run once in Supabase SQL editor)

```sql
-- Allowlist: owner inserts user_ids that are allowed to use POST
create table if not exists public.post_access (
  user_id      text primary key,
  note         text,
  created_at   timestamptz not null default now()
);
alter table public.post_access enable row level security;
-- No policies = anon/authenticated cannot touch it. Only server (postgres) access.

-- Audit log of POST requests
create table if not exists public.request_logs (
  id              uuid primary key default gen_random_uuid(),
  user_id         text not null,
  method          text not null default 'POST',
  url             text not null,
  headers         jsonb not null default '{}'::jsonb,
  body            jsonb not null default '{}'::jsonb,
  status          int,
  response_time_ms int,
  created_at      timestamptz not null default now()
);
create index if not exists request_logs_user_id_idx on public.request_logs(user_id);
create index if not exists request_logs_created_at_idx on public.request_logs(created_at desc);
alter table public.request_logs enable row level security;
-- Server-only writes (postgres connection bypasses RLS)
```

Seed example:

```sql
INSERT INTO post_access (user_id, note) VALUES ('some-id', 'Abi');
```

#### Env
- `SUPABASE_DB_URL` — server-only Postgres URL
- `ENABLE_POST_METHOD=true` — master kill switch (server-only)
- **Do not** set `NEXT_PUBLIC_ENABLE_POST`

#### Hard scope (what this is NOT)
- No PUT/PATCH/DELETE
- No Supabase Auth / JWT / login
- No auto temp-id / browser-id
- No admin UI for the allowlist (use Supabase dashboard)

---

## v1.2.0 — Restore Simple GET + POST MVP (2026-07-19)

### What's New

**Revert to simple MVP** — the entire feature-flag system has been removed. GET and POST are always visible to everyone. No Supabase client, no flag API, no localStorage user IDs.

#### Changes
- **GET & POST always available** — simple method selector, no flag gating
- **Removed all feature flag logic** — no `getUserId()`, `loadFlags()`, `alwaysVisible` / `flagControlled`
- **Deleted `src/app/api/feature-flags/route.ts`** — no server-side flag API
- **Deleted `src/lib/supabase.ts`** — Supabase client removed
- **Removed `@supabase/supabase-js` dependency** — cleaner dependency tree
- **Cleaned `.env.local`** — Supabase environment variables removed
- **Updated README** — feature flags section removed; documents simple GET+POST MVP

#### Notes
- The `feature_flags` table may still exist in Supabase; the app no longer connects to it
- Smaller build, zero external calls on page load

#### Commits
```
9f3a4f0 v1.2.0: restore simple GET+POST dropdown MVP, remove feature flag system
0150f62 v1.2.0: remove feature flags, simplify to GET-only
```

---

## v1.1.0 — Post-Method Feature Flag (2026-07-19)

### What's New

**POST behind feature flag** — POST method is now controlled by a Supabase-backed flag. Only users with the `post_method` flag enabled can see POST. GET remains available to everyone.

#### Core Features
- **Selective POST access** — POST method visibility controlled by `post_method` feature flag
- **GET always available** — no flag required for GET requests
- **Feature flag API** — `/api/feature-flags` for fetching flags by user

#### Infrastructure
- **Supabase integration** — `feature_flags` table with RLS, anon read policy
- **API route** — `/api/feature-flags` with GET (fetch flags) and POST (upsert flag)
- **Supabase client** — `src/lib/supabase.ts` initialized with env vars
- **Flag-controlled UI** — method selector dynamically shows/hides POST based on flag

#### Commits
```
c06354c feat: install @supabase/supabase-js and create client
c22c391 feat: add feature-flags API route and update proxy for all HTTP methods
28420f4 feat: add PUT/PATCH/DELETE methods with Supabase feature flag gating
4c3a8b0 docs: update README and release notes for features
46992a4 docs: update RELEASE_NOTES.md with v1.1.0 commit references
4a2eeaf feat: switch POST to post_method feature flag control
e75cbf8 docs: update README and RELEASE_NOTES for post_method feature flag
```

---

## v1.0.0 — Initial Release (2026-07-19)

### What's New

**API Tester MVP** — a lightweight API testing tool for developers.

#### Core Features
- **GET & POST requests** — test any API endpoint with a single click
- **Custom headers** — add Authorization, Content-Type, or any key-value pair
- **JSON body editor** — Monaco Editor with syntax highlighting, formatting, and validation
- **Server-side proxy** — all requests routed through Next.js API route to avoid CORS
- **Response viewer** — status code, response time (ms), and formatted JSON output
- **Request history** — last 20 requests saved in LocalStorage, collapsible sidebar

#### Tech Stack
- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- shadcn/ui components
- Monaco Editor (VS Code's editor)
- Sonner (toast notifications)
- Lucide React (icons)

#### UI/UX
- Clean, dark-themed interface
- Responsive layout
- Method selector (GET/POST dropdown)
- Tabbed interface for Headers and Body
- Collapsible history panel
- Loading states and error handling

### Architecture
- **Proxy pattern:** All API requests go through `/api/proxy` server route
- **Auto Content-Type:** POST requests automatically get `Content-Type: application/json` if not set
- **Zero CORS:** Server-side fetch eliminates browser CORS restrictions
- **LocalStorage persistence:** Request history survives page refreshes

### Deployment
- Deployed to Vercel (production)
- GitHub: [Abi-de-jo/api-tester](https://github.com/Abi-de-jo/api-tester)
- Live: [api-tester-beryl.vercel.app](https://api-tester-beryl.vercel.app)

### Commits
```
c3898d9 feat: add main API tester page with send logic and response display
46cdf46 feat: add response viewer, history panel, and LocalStorage helpers
cd35dd7 feat: add proxy API route and shared TypeScript types
cf60be9 feat: add tailwind theme and layout styling
e1c8234 feat: add shadcn/ui, monaco editor, sonner, lucide dependencies
fab4954 Initial commit from Create Next App
```
