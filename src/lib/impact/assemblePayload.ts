import { createClient } from "@/lib/supabase/server";
import type {
  ImpactPayload,
  ProgramPayload,
  MetricItem,
  OrgContext,
  OrgTestimonial,
} from "@/lib/types/impact-payload";

function parseTextToArray(text: string | null): string[] {
  if (!text || text.trim() === "") return [];
  return text
    .split("\n")
    .map((line) => line.replace(/^[-•*]\s*/, "").trim())
    .filter((line) => line.length > 0);
}

// TEMPORARY: bridges quantitative_data until Add Data page writes to program_data_points
function parseQuantitativeData(text: string | null): MetricItem[] {
  if (!text || text.trim() === "") return [];
  return text
    .split("\n")
    .map((line) => line.replace(/^[-•*]\s*/, "").trim())
    .filter((line) => line.length > 0)
    .map((line, index) => {
      // Try to split "Label: Value" or "Value Label" patterns
      const colonMatch = line.match(/^(.+?):\s*(.+)$/);
      const label = colonMatch ? colonMatch[1].trim() : `Metric ${index + 1}`;
      const value = colonMatch ? colonMatch[2].trim() : line;
      return {
        id: `fallback-${index}`,
        label,
        value,
        unit: null,
        is_featured: index === 0,
        display_order: index,
        target: null,
      };
    });
}

export async function assembleImpactPayload({
  orgId,
  programDataIds,
  viewType,
  theme,
}: {
  orgId: string;
  programDataIds: string[];
  viewType: string;
  theme: string;
}): Promise<ImpactPayload> {
  const supabase = createClient();

  // Query 1 — Org + brand kit
  const { data: orgRow, error: orgError } = await supabase
    .from("orgs")
    .select("id, name, mission_statement, brand_kits(brand_primary, brand_accent, brand_success, brand_text, logo_url)")
    .eq("id", orgId)
    .single();

  if (orgError || !orgRow) {
    throw new Error(`Failed to fetch org: ${orgError?.message ?? "not found"}`);
  }

  const brandKit = Array.isArray(orgRow.brand_kits)
    ? orgRow.brand_kits[0]
    : orgRow.brand_kits;

  const org: OrgContext = {
    id: orgRow.id,
    name: orgRow.name,
    mission: orgRow.mission_statement ?? null,
    brand_colors: {
      primary: brandKit?.brand_primary ?? null,
      secondary: brandKit?.brand_accent ?? null,
      background: brandKit?.brand_success ?? null,
      text: brandKit?.brand_text ?? null,
    },
    logo_url: brandKit?.logo_url ?? null,
  };

  // Query 2 — Program data entries with program info
  const { data: dataRows, error: dataError } = await supabase
    .from("program_data")
    .select("id, program_id, period_label, outcomes, quantitative_data, barriers, client_voice, change_description, program:programs(name, description)")
    .in("id", programDataIds.length > 0 ? programDataIds : ["__none__"])
    .eq("org_id", orgId);

  if (dataError) {
    throw new Error(`Failed to fetch program data: ${dataError.message}`);
  }

  if (!dataRows || dataRows.length === 0) {
    throw new Error("No program data entries found for the provided IDs");
  }

  // Query 3 — Metrics for selected data entries (non-fatal if empty)
  const metricsMap = new Map<string, MetricItem[]>();
  try {
    const { data: metricRows, error: metricsError } = await supabase
      .from("program_data_points")
      .select("id, data_entry_id, metric_id, value, metric:program_metrics(metric_name, target, display_order, is_featured)")
      .in("data_entry_id", programDataIds.length > 0 ? programDataIds : ["__none__"])
      .order("metric(display_order)", { ascending: true });

    if (metricsError) {
      throw new Error(`Failed to fetch metrics: ${metricsError.message}`);
    }

    for (const row of metricRows ?? []) {
      const metric = Array.isArray(row.metric) ? row.metric[0] : row.metric;
      if (!metric) continue;

      const entryId = row.data_entry_id;
      if (!metricsMap.has(entryId)) metricsMap.set(entryId, []);

      metricsMap.get(entryId)!.push({
        id: row.id,
        label: metric.metric_name,
        value: row.value,
        unit: null,
        is_featured: metric.is_featured ?? false,
        display_order: metric.display_order ?? 0,
        target: metric.target ?? null,
      });
    }
  } catch {
    // Table may not exist yet or no rows — programs will have metrics: []
  }

  // Assemble program payloads
  const programs: ProgramPayload[] = dataRows.map((row) => {
    const program = Array.isArray(row.program) ? row.program[0] : row.program;

    // TEMPORARY: fall back to parsing quantitative_data text when no program_data_points rows exist
    const structuredMetrics = metricsMap.get(row.id) ?? [];
    const metrics = structuredMetrics.length > 0
      ? structuredMetrics
      : parseQuantitativeData(row.quantitative_data);

    return {
      id: row.id,
      name: program?.name ?? "Unknown Program",
      description: program?.description ?? null,
      period_label: row.period_label ?? null,
      outcomes: parseTextToArray(row.outcomes),
      metrics,
      barriers: parseTextToArray(row.barriers),
      client_voice: parseTextToArray(row.client_voice),
      change_description: row.change_description?.trim() || null,
    };
  });

  // Query 4 — Org testimonials (non-fatal if missing)
  let orgTestimonials: OrgTestimonial[] = [];
  try {
    const { data: testimonialRows } = await supabase
      .from("org_testimonials")
      .select("id, quote_text, client_identifier, programs_referenced")
      .eq("org_id", orgId);

    orgTestimonials = (testimonialRows ?? []).map((t) => ({
      id: t.id,
      quote_text: t.quote_text,
      client_identifier: t.client_identifier ?? null,
      programs_referenced: t.programs_referenced ?? null,
    }));
  } catch {
    // Table may not exist yet — return empty array
  }

  return {
    org,
    programs,
    org_testimonials: orgTestimonials,
    report_metadata: {
      view_type: viewType,
      theme,
      generated_at: new Date().toISOString(),
      period_label: dataRows[0]?.period_label ?? null,
    },
  };
}
