import { createClient } from "@supabase/supabase-js";

export type ProgramStatus = "on_track" | "at_risk" | "alert";

export type PeriodMetric = {
  label: string;
  value: string;
  target: string | null;
};

export type PeriodSnapshot = {
  period_label: string;
  barriers_summary: string | null;
  metrics: PeriodMetric[];
};

export type ImpactRoomInternalPayload = {
  org: { name: string; slug: string };
  as_of: string;
  period_label: string;
  prior_period_label: string | null;
  overall_status: ProgramStatus;
  summary: {
    total_participants: number | null;
    prior_participants: number | null;
    participants_delta: number | null;
  };
  programs: Array<{
    id: string;
    name: string;
    status: ProgramStatus;
    metrics: Array<{
      label: string;
      value: string;
      target: string | null;
      prior_value: string | null;
      delta: string | null;
      trend: "up" | "down" | "flat" | null;
    }>;
    barriers_summary: string | null;
    periods: PeriodSnapshot[];
  }>;
  ticker_items: string[];
};

function computeStatus(
  value: string | null,
  target: string | null
): ProgramStatus {
  if (!target || !value) return "on_track";
  const v = parseFloat(value.replace(/[^0-9.-]/g, ""));
  const t = parseFloat(target.replace(/[^0-9.-]/g, ""));
  if (isNaN(v) || isNaN(t) || t === 0) return "on_track";
  const ratio = v / t;
  if (ratio >= 1) return "on_track";
  if (ratio >= 0.9) return "at_risk";
  return "alert";
}

function worstStatus(statuses: ProgramStatus[]): ProgramStatus {
  if (statuses.includes("alert")) return "alert";
  if (statuses.includes("at_risk")) return "at_risk";
  return "on_track";
}

function computeDelta(
  current: string | null,
  prior: string | null
): { delta: string | null; trend: "up" | "down" | "flat" | null } {
  if (!current || !prior) return { delta: null, trend: null };
  const c = parseFloat(current.replace(/[^0-9.-]/g, ""));
  const p = parseFloat(prior.replace(/[^0-9.-]/g, ""));
  if (isNaN(c) || isNaN(p)) return { delta: null, trend: null };
  const diff = c - p;
  if (diff === 0) return { delta: "0", trend: "flat" };
  const sign = diff > 0 ? "+" : "";
  return {
    delta: `${sign}${diff % 1 === 0 ? diff.toString() : diff.toFixed(1)}`,
    trend: diff > 0 ? "up" : "down",
  };
}

export async function assembleInternalPayload(
  slug: string
): Promise<ImpactRoomInternalPayload | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // ── Org ────────────────────────────────────────────────────────
  const { data: orgRow } = await supabase
    .from("orgs")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();

  if (!orgRow) return null;
  const orgId = orgRow.id;

  // ── Programs ───────────────────────────────────────────────────
  const { data: programRows } = await supabase
    .from("programs")
    .select("id, name, display_order")
    .eq("org_id", orgId)
    .eq("is_archived", false)
    .order("display_order", { ascending: true });

  const programs: ImpactRoomInternalPayload["programs"] = [];
  const tickerItems: string[] = [];
  let periodLabel = "";
  let priorPeriodLabel: string | null = null;
  let totalParticipants: number | null = null;
  let priorParticipants: number | null = null;

  for (const prog of programRows ?? []) {
    // All program_data entries ordered newest first
    const { data: dataRows } = await supabase
      .from("program_data")
      .select("id, period_label, barriers")
      .eq("program_id", prog.id)
      .order("entered_at", { ascending: false });

    const currentData = dataRows?.[0] ?? null;
    const priorData = dataRows?.[1] ?? null;

    if (currentData?.period_label && !periodLabel) {
      periodLabel = currentData.period_label;
    }
    if (priorData?.period_label && !priorPeriodLabel) {
      priorPeriodLabel = priorData.period_label;
    }

    // ── Build periods array (all historical snapshots) ──────────
    const periods: PeriodSnapshot[] = [];
    for (const dr of dataRows ?? []) {
      const { data: periodMetrics } = await supabase
        .from("program_data_points")
        .select(
          "value, metric_id, metric:program_metrics(metric_name, target_value, display_order)"
        )
        .eq("data_entry_id", dr.id)
        .order("metric(display_order)", { ascending: true });

      const pMetrics: PeriodMetric[] = [];
      for (const pm of periodMetrics ?? []) {
        const metric = Array.isArray(pm.metric) ? pm.metric[0] : pm.metric;
        if (!metric) continue;
        pMetrics.push({
          label: metric.metric_name,
          value: pm.value ?? "—",
          target: metric.target_value ?? null,
        });
      }

      const barrierLine = dr.barriers
        ? dr.barriers.split("\n")[0]?.replace(/^[-•*]\s*/, "").trim() || null
        : null;

      periods.push({
        period_label: dr.period_label,
        barriers_summary: barrierLine,
        metrics: pMetrics,
      });
    }

    // ── Current/prior metrics (backward compat) ─────────────────
    const { data: currentMetrics } = await supabase
      .from("program_data_points")
      .select(
        "value, metric_id, metric:program_metrics(metric_name, target_value, display_order, is_featured)"
      )
      .eq("data_entry_id", currentData?.id ?? "__none__")
      .order("metric(display_order)", { ascending: true });

    const { data: priorMetrics } = await supabase
      .from("program_data_points")
      .select("value, metric_id")
      .eq("data_entry_id", priorData?.id ?? "__none__");

    const priorMap = new Map<string, string>();
    for (const pm of priorMetrics ?? []) {
      priorMap.set(pm.metric_id, pm.value);
    }

    const metricStatuses: ProgramStatus[] = [];
    const metrics: ImpactRoomInternalPayload["programs"][0]["metrics"] = [];

    for (const cm of currentMetrics ?? []) {
      const metric = Array.isArray(cm.metric) ? cm.metric[0] : cm.metric;
      if (!metric) continue;

      const priorValue = priorMap.get(cm.metric_id) ?? null;
      const { delta, trend } = computeDelta(cm.value, priorValue);
      const status = computeStatus(cm.value, metric.target_value);
      metricStatuses.push(status);

      metrics.push({
        label: metric.metric_name,
        value: cm.value ?? "—",
        target: metric.target_value ?? null,
        prior_value: priorValue,
        delta,
        trend,
      });

      // Check for participants metric for summary
      const lowerName = metric.metric_name.toLowerCase();
      if (
        lowerName.includes("participant") ||
        lowerName.includes("served") ||
        lowerName.includes("client")
      ) {
        const v = parseFloat((cm.value ?? "0").replace(/[^0-9.-]/g, ""));
        if (!isNaN(v)) {
          totalParticipants = (totalParticipants ?? 0) + v;
        }
        if (priorValue) {
          const pv = parseFloat(priorValue.replace(/[^0-9.-]/g, ""));
          if (!isNaN(pv)) {
            priorParticipants = (priorParticipants ?? 0) + pv;
          }
        }
      }
    }

    const programStatus = worstStatus(metricStatuses);

    // Barriers summary: first line
    const barriersSummary = currentData?.barriers
      ? currentData.barriers
          .split("\n")[0]
          ?.replace(/^[-•*]\s*/, "")
          .trim() || null
      : null;

    programs.push({
      id: prog.id,
      name: prog.name,
      status: programStatus,
      metrics,
      barriers_summary: barriersSummary,
      periods,
    });

    // Build ticker items from this program's metrics
    for (const m of metrics) {
      const deltaStr = m.delta ? ` ${m.delta}` : "";
      tickerItems.push(`${prog.name.toUpperCase()} · ${m.label}: ${m.value}${deltaStr}`);
    }
  }

  const participantsDelta =
    totalParticipants !== null && priorParticipants !== null
      ? totalParticipants - priorParticipants
      : null;

  const overallStatus = worstStatus(programs.map((p) => p.status));

  return {
    org: { name: orgRow.name, slug: orgRow.slug ?? slug },
    as_of: new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
    period_label: periodLabel || "Current Period",
    prior_period_label: priorPeriodLabel,
    overall_status: overallStatus,
    summary: {
      total_participants: totalParticipants,
      prior_participants: priorParticipants,
      participants_delta: participantsDelta,
    },
    programs,
    ticker_items: tickerItems.length > 0 ? tickerItems : ["No metric data available"],
  };
}
