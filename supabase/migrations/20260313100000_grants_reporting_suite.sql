-- Grants & Reporting Suite tables

-- Projects
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table projects enable row level security;

create policy "Users can view own org projects"
  on projects for select
  using (org_id in (select org_id from org_users where user_id = auth.uid()));

create policy "Users can insert own org projects"
  on projects for insert
  with check (org_id in (select org_id from org_users where user_id = auth.uid()));

create policy "Users can update own org projects"
  on projects for update
  using (org_id in (select org_id from org_users where user_id = auth.uid()));

create policy "Users can delete own org projects"
  on projects for delete
  using (org_id in (select org_id from org_users where user_id = auth.uid()));

-- Project runs (version history)
create table if not exists project_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  version_number integer not null default 1,
  period_label text,
  raw_data text,
  selected_data_points jsonb default '[]'::jsonb,
  edited_data_points jsonb default '[]'::jsonb,
  brand_kit_id uuid,
  created_at timestamptz not null default now(),
  is_latest boolean not null default true
);

alter table project_runs enable row level security;

create policy "Users can view own org runs"
  on project_runs for select
  using (project_id in (
    select id from projects where org_id in (
      select org_id from org_users where user_id = auth.uid()
    )
  ));

create policy "Users can insert own org runs"
  on project_runs for insert
  with check (project_id in (
    select id from projects where org_id in (
      select org_id from org_users where user_id = auth.uid()
    )
  ));

create policy "Users can update own org runs"
  on project_runs for update
  using (project_id in (
    select id from projects where org_id in (
      select org_id from org_users where user_id = auth.uid()
    )
  ));

-- Generated views
create table if not exists generated_views (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references project_runs(id) on delete cascade,
  view_type text not null,
  output_html text not null,
  created_at timestamptz not null default now()
);

alter table generated_views enable row level security;

create policy "Users can view own org generated views"
  on generated_views for select
  using (run_id in (
    select pr.id from project_runs pr
    join projects p on p.id = pr.project_id
    where p.org_id in (select org_id from org_users where user_id = auth.uid())
  ));

create policy "Users can insert own org generated views"
  on generated_views for insert
  with check (run_id in (
    select pr.id from project_runs pr
    join projects p on p.id = pr.project_id
    where p.org_id in (select org_id from org_users where user_id = auth.uid())
  ));

create policy "Users can update own org generated views"
  on generated_views for update
  using (run_id in (
    select pr.id from project_runs pr
    join projects p on p.id = pr.project_id
    where p.org_id in (select org_id from org_users where user_id = auth.uid())
  ));

-- Brand kits
create table if not exists brand_kits (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  brand_primary text not null default '#1B2B3A',
  brand_accent text not null default '#E9C03A',
  brand_success text not null default '#3A6B8A',
  brand_text text not null default '#EDE8DE',
  logo_url text,
  org_display_name text,
  remove_candela_footer boolean not null default false,
  created_at timestamptz not null default now()
);

alter table brand_kits enable row level security;

create policy "Users can view own org brand kits"
  on brand_kits for select
  using (org_id in (select org_id from org_users where user_id = auth.uid()));

create policy "Users can insert own org brand kits"
  on brand_kits for insert
  with check (org_id in (select org_id from org_users where user_id = auth.uid()));

create policy "Users can update own org brand kits"
  on brand_kits for update
  using (org_id in (select org_id from org_users where user_id = auth.uid()));

-- Add foreign key from project_runs to brand_kits
alter table project_runs
  add constraint project_runs_brand_kit_id_fkey
  foreign key (brand_kit_id) references brand_kits(id) on delete set null;

-- Index for fast lookups
create index if not exists idx_projects_org_id on projects(org_id);
create index if not exists idx_project_runs_project_id on project_runs(project_id);
create index if not exists idx_project_runs_is_latest on project_runs(project_id, is_latest) where is_latest = true;
create index if not exists idx_generated_views_run_id on generated_views(run_id);
create index if not exists idx_brand_kits_org_id on brand_kits(org_id);
