-- Add funder_name to projects table (displayed on project cards)
alter table projects add column if not exists funder_name text;
