-- Add content_map JSONB column to generated_views for inline text edits
alter table generated_views add column if not exists content_map jsonb;
