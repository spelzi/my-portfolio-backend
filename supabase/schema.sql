-- ============================================================================
-- Portfolio content schema — run this once in the Supabase SQL Editor
-- (Project → SQL Editor → New query → paste this whole file → Run)
-- ============================================================================
--
-- Design notes:
--   - `row_id` is a bigserial surrogate primary key on every table. It exists
--     purely so the backend can reliably "delete all rows" with a single
--     simple filter (`row_id >= 0`) when replacing a whole collection — the
--     natural keys (slug / id) are still enforced unique below.
--   - `sort_order` preserves the exact array order the frontend cares about
--     (blog post list order, prev/next navigation, project/video display
--     order). The backend always writes it and always reads ordered by it.
--   - Row Level Security is enabled with NO policies defined. This means the
--     anon/public API key (if it ever leaked) could not read or write ANYTHING
--     via Supabase's own REST API. Only the service_role key — used
--     exclusively by this Express backend, never sent to the browser — can
--     bypass RLS and access these tables. The backend is the only door in.

-- ─── Posts ───────────────────────────────────────────────────────────────────
create table if not exists posts (
  row_id      bigserial primary key,
  slug        text unique not null,
  title       text not null,
  category    text not null,
  date        text not null,
  read_time   text not null,
  excerpt     text not null default '',
  content     jsonb not null default '[]'::jsonb,
  sort_order  integer not null default 0
);

alter table posts enable row level security;

-- ─── Projects ────────────────────────────────────────────────────────────────
create table if not exists projects (
  row_id      bigserial primary key,
  id          text unique not null,
  title       text not null,
  category    text default '',
  stack       text[] not null default '{}',
  description text default '',
  status      text default '',
  link        text default '',
  link1       text default '',
  sort_order  integer not null default 0
);

alter table projects enable row level security;

-- ─── Videos ──────────────────────────────────────────────────────────────────
create table if not exists videos (
  row_id       bigserial primary key,
  id           text unique not null,
  youtube_id   text default '',
  title        text not null,
  category     text default '',
  description  text default '',
  date         text default '',
  sort_order   integer not null default 0
);

alter table videos enable row level security;