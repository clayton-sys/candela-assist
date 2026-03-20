export type MetricItem = {
  id: string;
  label: string;
  value: string;
  unit: string | null;
  is_featured: boolean;
  display_order: number;
  target: string | null;
};

export type ProgramPayload = {
  id: string;
  name: string;
  description: string | null;
  period_label: string | null;
  outcomes: string[];
  metrics: MetricItem[];
  barriers: string[];
  client_voice: string[];
  change_description: string | null;
};

export type OrgContext = {
  id: string;
  name: string;
  mission: string | null;
  brand_colors: {
    primary: string | null;
    secondary: string | null;
    background: string | null;
    text: string | null;
  };
  logo_url: string | null;
};

export type OrgTestimonial = {
  id: string;
  quote_text: string;
  client_identifier: string | null;
  programs_referenced: string[] | null;
};

export type ImpactPayload = {
  org: OrgContext;
  programs: ProgramPayload[];
  org_testimonials: OrgTestimonial[];
  report_metadata: {
    view_type: string;
    theme: string;
    generated_at: string;
    period_label: string | null;
  };
};
