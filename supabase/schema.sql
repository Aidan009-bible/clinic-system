-- Demo persistence for the existing ClinicSnapshot data model.
-- Run this once in the Supabase SQL Editor before deploying to Vercel.
create table if not exists public.clinic_state (
  id text primary key,
  snapshot jsonb not null,
  revision bigint not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.clinic_state add column if not exists revision bigint not null default 0;

alter table public.clinic_state enable row level security;

-- There are intentionally no browser policies. The app accesses this table only
-- from Next.js server code with SUPABASE_SECRET_KEY.
revoke all on table public.clinic_state from anon, authenticated;
