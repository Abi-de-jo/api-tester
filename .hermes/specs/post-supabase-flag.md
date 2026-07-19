# FEATURE SPEC v3 (final) — user_id gated POST via Supabase allowlist
Source: User final clarification, 2026-07-19.
Supersedes v1 (too many things) and v2 (temp-id pivot was wrong).

## One-line statement
User enters a **user_id** in the UI → Supabase checks if that id is in `post_access` allowlist → if yes, POST is enabled → each POST is logged to `request_logs` with that user_id.

## How the owner uses it
1. Open the site → see the user_id input field
2. Enter a user_id and press Enter or Tab
3. If that user_id is in Supabase `post_access` table → POST dropdown option appears + Send works
4. Owner manually seeds the `post_access` table via Supabase SQL editor:
   `INSERT INTO post_access (user_id, note) VALUES ('some-id', 'Abi');`
5. Owner tells the user their id; user enters it and gets POST access

## Hard scope lock — NOTHING extra
- NO PUT/PATCH/DELETE
- NO Supabase Auth / login / JWT
- NO auto-generated temp-id / browser-id / device-id
- NO admin UI to manage allowlist (owner uses Supabase dashboard)
- NO NEXT_PUBLIC_ENABLE_POST env var (the allowlist IS the flag)
- DO NOT break GET. DO NOT remove LocalStorage history.
- The server proxy is the AUTHORITATIVE gate. Client-side show/hide is UX only.

## Required changes (do this order)

### 0) Database — `post_access` + `request_logs` tables
Run once via psql or Supabase SQL editor:

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

### 1) Lib — `src/lib/supabase-server.ts`
One shared `pg.Pool` from `SUPABASE_DB_URL`. Export:
- `canUsePost(userId: string): Promise<boolean>` — runs `SELECT 1 FROM post_access WHERE user_id = $1 LIMIT 1`. Returns `!!row`. Try/catch → false + console.error.
- `logRequest(row)` — INSERT into `request_logs` with user_id, method, url, headers (sanitized — drop Authorization/Cookie/Set-Cookie/x-api-key), body, status, response_time_ms. Try/catch swallow — never throw.
- `sanitizeHeaders(headers)` — drops the 4 sensitive keys (case-insensitive).
- Both use parameterized queries ($1). Never string-concat.

### 2) Lib — `src/lib/validate.ts`
- `isValidUserId(s: string): boolean` — regex `^[A-Za-z0-9_\-:]+$`, length 1–64 chars.
- Export for both client (UI validation) and server (proxy gate).

### 3) API route — `src/app/api/access/route.ts` (NEW)
GET handler:
- Reads `user_id` from URL search param
- Validates via `isValidUserId`. Invalid → 400 `{ error: 'Invalid user_id' }`.
- Calls `canUsePost(user_id)` → returns `{ postEnabled: boolean }`.
- Fast, no side effects. Used on mount by the client to decide whether to show POST.

### 4) API route — `src/app/api/proxy/route.ts` (modify)
Extend proxy body schema to accept `{ url, method, headers, body, user_id? }`.
On POST:
1. If `ENABLE_POST_METHOD !== 'true'` → 403 `{ error: 'POST disabled' }`. Don't forward.
2. Validate `user_id` (present, isValidUserId) → fail: 400 `{ error: 'Invalid user_id' }`.
3. `canUsePost(user_id)` → false: 403 `{ error: 'Access not granted' }`. Don't forward.
4. Forward as today. After response, best-effort `logRequest(...)`. Swallow throws.
GET unchanged.

### 5) UI — `src/app/page.tsx`
- Remove `NEXT_PUBLIC_ENABLE_POST` flag usage (if v1 remnants). The flag is the DB.
- Add a user_id Input below the URL bar, visible always. Label: "User ID". Placeholder: "Enter your user id".
- On mount: `useEffect` → if a user_id is already entered, call `GET /api/access?user_id=...` to check POST access. Cache result.
- On user_id change (blur or Enter): re-check access. Show a status indicator next to the input.
- `AVAILABLE_METHODS`: always `['GET', 'POST']` but POST is disabled (greyed out, tooltip "POST not available") unless `postEnabled === true`.
- Pass `user_id` in the proxy fetch body.

### 6) API route — clean up old `NEXT_PUBLIC_ENABLE_POST`
Do NOT add it to .env.local or .env.example. Remove any references.

### 7) Tests — write BEFORE implementation (TDD rule)
Add vitest + `tests/validate.test.ts`:
- `isValidUserId('abc') === true`
- `isValidUserId('') === false`
- `isValidUserId('abc:def-123_456') === true`
- `isValidUserId('<script>') === false`
- `isValidUserId("' OR 1=1--") === false`
- `isValidUserId('😀') === false`
- `isValidUserId('a'.repeat(65)) === false`
- `isValidUserId('a'.repeat(64)) === true`

Add `tests/access.test.ts`:
- Mock `canUsePost` or use a test DB — at minimum test the validation handler layer.

### 8) Docs
- README: v1.3.0, POST access section, how-to for owner.
- RELEASE_NOTES: full migration SQL.
- `.env.example`: clean example with placeholders.

## Non-negotiable rules
- TDD first (test → fail → implement → pass)
- Atomic commits per slice
- Never foreground a build/install/test
- Build-to-PRD — zero scope creep
- After final commit: `git diff` summary, full test run, confirm GET still works