-- Create program_data table (existed in Supabase but was never version-controlled)
CREATE TABLE IF NOT EXISTS program_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  program_id UUID REFERENCES programs(id) ON DELETE SET NULL,
  period_label TEXT,
  data_type TEXT,
  outcomes TEXT,
  quantitative_data TEXT,
  barriers TEXT,
  client_voice TEXT,
  change_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE program_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org program_data"
  ON program_data FOR SELECT
  USING (org_id IN (SELECT org_id FROM org_users WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own org program_data"
  ON program_data FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM org_users WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own org program_data"
  ON program_data FOR UPDATE
  USING (org_id IN (SELECT org_id FROM org_users WHERE user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_program_data_org_id ON program_data(org_id);
CREATE INDEX IF NOT EXISTS idx_program_data_program_id ON program_data(program_id);

-- Add is_featured to program_metrics (added in Supabase, now version-controlled)
ALTER TABLE program_metrics
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Create org_testimonials table (added in Supabase, now version-controlled)
CREATE TABLE IF NOT EXISTS org_testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  quote_text TEXT NOT NULL,
  client_identifier TEXT,
  programs_referenced UUID[],
  entered_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE org_testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org testimonials"
  ON org_testimonials FOR SELECT
  USING (org_id IN (SELECT org_id FROM org_users WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own org testimonials"
  ON org_testimonials FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM org_users WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own org testimonials"
  ON org_testimonials FOR UPDATE
  USING (org_id IN (SELECT org_id FROM org_users WHERE user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_org_testimonials_org_id ON org_testimonials(org_id);

-- Create program_data_points table (metric values per data entry)
CREATE TABLE IF NOT EXISTS program_data_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_entry_id UUID NOT NULL REFERENCES program_data(id) ON DELETE CASCADE,
  metric_id UUID NOT NULL REFERENCES program_metrics(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_program_data_points_data_entry_id
  ON program_data_points(data_entry_id);

CREATE INDEX IF NOT EXISTS idx_program_data_points_metric_id
  ON program_data_points(metric_id);
