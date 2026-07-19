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
