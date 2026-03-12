-- ============================================================
-- Candela Assist — Grant Suite — Supabase Setup SQL
-- Run this entire script in Supabase SQL Editor
-- ============================================================

-- ── 1. Tables ────────────────────────────────────────────────

create table if not exists orgs (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  license_status text not null default 'active'
    check (license_status in ('active', 'expired', 'suspended')),
  created_at   timestamptz not null default now()
);

create table if not exists org_users (
  id        uuid primary key default gen_random_uuid(),
  org_id    uuid not null references orgs(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  role      text not null default 'member',
  created_at timestamptz not null default now(),
  unique(org_id, user_id)
);

create table if not exists logic_models (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references orgs(id) on delete cascade,
  slug         text not null unique,
  program_name text not null,
  org_name     text,
  vertical     text,
  data         jsonb not null default '{}',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ── 2. Row Level Security ────────────────────────────────────

alter table orgs enable row level security;
alter table org_users enable row level security;
alter table logic_models enable row level security;

-- orgs: members can view their own org
create policy "Members can view their org"
  on orgs for select
  using (
    id in (
      select org_id from org_users where user_id = auth.uid()
    )
  );

-- org_users: users see only their own membership rows
create policy "Users see their own membership"
  on org_users for select
  using (user_id = auth.uid());

-- logic_models: org members can read their org's models
create policy "Org members can read logic models"
  on logic_models for select
  using (
    org_id in (
      select org_id from org_users where user_id = auth.uid()
    )
  );

-- logic_models: org members can insert
create policy "Org members can insert logic models"
  on logic_models for insert
  with check (
    org_id in (
      select org_id from org_users where user_id = auth.uid()
    )
  );

-- logic_models: org members can update
create policy "Org members can update logic models"
  on logic_models for update
  using (
    org_id in (
      select org_id from org_users where user_id = auth.uid()
    )
  );

-- logic_models: public can read by slug (for /lm/[slug] shareable view)
create policy "Public can read logic models by slug"
  on logic_models for select
  using (true);  -- Supabase anon key is used; slug is unguessable enough for sharing

-- ── 2b. Session 2: evaluation_plans column ──────────────────
-- Caches generated evaluation plans per card.
-- Key format: {column}_{index} (e.g. outputs_0, shortTermOutcomes_2)

alter table logic_models
  add column if not exists evaluation_plans jsonb not null default '{}'::jsonb;

-- ── 2c. Session 3: reporting_data table ─────────────────────
-- Stores period-level reporting data per card.

create table if not exists reporting_data (
  id               uuid primary key default gen_random_uuid(),
  logic_model_id   uuid not null references logic_models(id) on delete cascade,
  card_key         text not null,
  reporting_period text not null,
  current_value    numeric,
  target_value     numeric,
  notes            text,
  narrative        text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique(logic_model_id, card_key, reporting_period)
);

alter table reporting_data enable row level security;

create policy "Users see own org reporting data"
  on reporting_data for all
  using (
    logic_model_id in (
      select lm.id from logic_models lm
      join org_users ou on lm.org_id = ou.org_id
      where ou.user_id = auth.uid()
    )
  );

-- Public can read reporting data (for /lm/[slug] shareable view)
create policy "Public can read reporting data"
  on reporting_data for select
  using (true);

-- ── 3. Seed: Create the Candela org ─────────────────────────
-- Only run once. Skip if org already exists.

insert into orgs (id, name, license_status)
values ('00000000-0000-0000-0000-000000000001', 'Candela', 'active')
on conflict (id) do nothing;

-- ── 4. Link your user to the org ────────────────────────────
-- Replace PASTE_YOUR_USER_UUID_HERE with the UUID from
-- Supabase Dashboard → Authentication → Users

-- insert into org_users (org_id, user_id, role)
-- values (
--   '00000000-0000-0000-0000-000000000001',
--   'PASTE_YOUR_USER_UUID_HERE',
--   'admin'
-- )
-- on conflict do nothing;
