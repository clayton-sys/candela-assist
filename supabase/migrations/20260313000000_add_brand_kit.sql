ALTER TABLE orgs ADD COLUMN IF NOT EXISTS brand_primary text DEFAULT '#1B2B3A';
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS brand_accent text DEFAULT '#E9C03A';
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS brand_success text DEFAULT '#1D9E75';
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS brand_text_on_primary text DEFAULT '#EDE8DE';
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS brand_logo_url text;
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS org_display_name text;
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS white_label_enabled boolean DEFAULT false;
