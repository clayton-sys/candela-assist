-- Admin Panel: add plan_tier to orgs, disabled to org_users

-- Plan tier on orgs (starter/growth/pro)
alter table orgs add column if not exists plan_tier text not null default 'starter'
  check (plan_tier in ('starter', 'growth', 'pro'));

-- Disabled flag on org_users (per-user, checked on login)
alter table org_users add column if not exists disabled boolean not null default false;
