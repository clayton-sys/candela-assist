-- Session 9: Workspace & Navigation Rebuild
-- New table: programs
-- New fields on projects, brand_kits, orgs

-- Programs table
create table if not exists programs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  name text not null,
  description text,
  metrics jsonb default '[]'::jsonb,
  created_at timestamptz not null default now(),
  archived boolean not null default false
);

alter table programs enable row level security;

create policy "Users can view own org programs"
  on programs for select
  using (org_id in (select org_id from org_users where user_id = auth.uid()));

create policy "Users can insert own org programs"
  on programs for insert
  with check (org_id in (select org_id from org_users where user_id = auth.uid()));

create policy "Users can update own org programs"
  on programs for update
  using (org_id in (select org_id from org_users where user_id = auth.uid()));

create index if not exists idx_programs_org_id on programs(org_id);

-- New fields on projects
alter table projects add column if not exists program_id uuid references programs(id) on delete set null;
alter table projects add column if not exists project_type text not null default 'output_generator'
  check (project_type in ('output_generator', 'funder_format'));
alter table projects add column if not exists status text not null default 'in_progress'
  check (status in ('in_progress', 'waiting', 'ready', 'complete'));
alter table projects add column if not exists blocking_message text;
alter table projects add column if not exists created_by uuid;

create index if not exists idx_projects_program_id on projects(program_id);
create index if not exists idx_projects_status on projects(status);

-- New field on brand_kits
alter table brand_kits add column if not exists custom_center_text text;

-- Mission statement on orgs
alter table orgs add column if not exists mission_statement text;

-- Org profile fields
alter table orgs add column if not exists website text;
alter table orgs add column if not exists org_type text;
alter table orgs add column if not exists legal_name text;

-- Team invites table
create table if not exists team_invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  email text not null,
  role text not null default 'member' check (role in ('admin', 'member')),
  invited_by uuid,
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

alter table team_invites enable row level security;

create policy "Admins can manage invites"
  on team_invites for all
  using (org_id in (select org_id from org_users where user_id = auth.uid()));

-- Add role to org_users if not exists
alter table org_users add column if not exists role text not null default 'member'
  check (role in ('admin', 'member'));

-- Voice & Style on orgs
alter table orgs add column if not exists voice_tone text default 'professional'
  check (voice_tone in ('professional', 'warm', 'plain'));
alter table orgs add column if not exists voice_custom_instructions text;
