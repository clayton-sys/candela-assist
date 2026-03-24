-- Migration: Add CEO message fields and hero_photo_url to orgs table
-- Also ensure org_photos table exists

-- ── CEO columns on orgs ────────────────────────────────────────────
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS ceo_message text;
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS ceo_name text;
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS ceo_title text;
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS ceo_photo_url text;
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS hero_photo_url text;

-- ── org_photos table ───────────────────────────────────────────────
-- Schema reference (from schema.sql):
--   id uuid PRIMARY KEY
--   org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE
--   storage_url text NOT NULL
--   alt_text text
--   tags text[]
--   display_order integer DEFAULT 0
--   is_active boolean DEFAULT true
--   uploaded_at timestamptz DEFAULT now()
--
-- If org_photos already exists in your Supabase project, this CREATE
-- will be skipped by IF NOT EXISTS. Column structure confirmed above.

CREATE TABLE IF NOT EXISTS org_photos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  storage_url text NOT NULL,
  alt_text text,
  tags text[],
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  uploaded_at timestamptz DEFAULT now()
);

-- RLS (safe to re-run — will no-op if already enabled/exists)
ALTER TABLE org_photos ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'org_photos' AND policyname = 'org_isolation'
  ) THEN
    CREATE POLICY "org_isolation" ON org_photos
      FOR ALL USING (org_id = get_user_org_id());
  END IF;
END
$$;
