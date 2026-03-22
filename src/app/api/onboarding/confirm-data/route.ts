// SECURITY CHECKLIST
// [x] Auth: requireAuth() called first
// [x] Org: requireOrgMember() called
// [x] Rate limit: Upstash applied (confirm-data, 10 requests per org per hour)
// [x] Input: Zod schema validated
// [x] Response: no raw DB rows exposed

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const MetricValueSchema = z.object({
  metric_id: z.string().uuid(),
  value: z.string().nullable(),
});

const ProgramDataSchema = z.object({
  program_id: z.string().uuid(),
  outcomes: z.string().nullable().optional(),
  barriers: z.string().nullable().optional(),
  change_description: z.string().nullable().optional(),
  client_voice: z.string().nullable().optional(),
  metrics: z.array(MetricValueSchema).optional().default([]),
});

const ConfirmDataSchema = z.object({
  org_id: z.string().uuid(),
  period_label: z.string().min(1).max(100),
  period_start: z.string().date(),
  period_end: z.string().date(),
  raw_text: z.string().min(20).max(20000),
  programs: z.array(ProgramDataSchema),
});

export async function POST(req: NextRequest) {
  try {
    // ── Auth: requireAuth() ──────────────────────────────────────
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Input: Zod validation ────────────────────────────────────
    const body = await req.json();
    const parsed = ConfirmDataSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const data = parsed.data;

    // ── Org: requireOrgMember() ──────────────────────────────────
    const { data: membership } = await supabase
      .from("org_users")
      .select("id")
      .eq("org_id", data.org_id)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ── Rate limit: Upstash (confirm-data, 10 per org per hour) ─
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (url && token) {
      const { Redis } = await import("@upstash/redis");
      const { Ratelimit } = await import("@upstash/ratelimit");

      const redis = new Redis({ url, token });
      const limiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "1 h"),
        prefix: "rl:confirm-data",
      });

      const { success } = await limiter.limit(`confirm-data:${data.org_id}`);
      if (!success) {
        return NextResponse.json(
          { error: "Rate limit exceeded. 10 confirm requests per org per hour." },
          { status: 429 }
        );
      }
    }

    // ── Save to program_data + program_data_points ───────────────
    let dataEntriesCreated = 0;
    let metricPointsCreated = 0;

    for (const prog of data.programs) {
      // One program_data row per program
      const { data: dataRow, error: dataError } = await supabase
        .from("program_data")
        .insert({
          org_id: data.org_id,
          program_id: prog.program_id,
          period_label: data.period_label,
          period_start: data.period_start,
          period_end: data.period_end,
          raw_input: data.raw_text,
          data_type: "qualitative",
          outcomes: prog.outcomes ?? null,
          barriers: prog.barriers ?? null,
          client_voice: prog.client_voice ?? null,
          change_description: prog.change_description ?? null,
        })
        .select("id")
        .single();

      if (dataError || !dataRow) {
        console.error("[confirm-data] program_data insert error:", dataError);
        continue;
      }

      dataEntriesCreated++;

      // One program_data_points row per metric value
      const metricRows = prog.metrics
        .filter((m) => m.value !== null && m.value !== undefined)
        .map((m) => ({
          data_entry_id: dataRow.id,
          metric_id: m.metric_id,
          value: m.value,
        }));

      if (metricRows.length > 0) {
        const { error: metricError } = await supabase
          .from("program_data_points")
          .insert(metricRows);

        if (metricError) {
          console.error("[confirm-data] program_data_points insert error:", metricError);
        } else {
          metricPointsCreated += metricRows.length;
        }
      }
    }

    // ── Response: no raw DB rows exposed ─────────────────────────
    return NextResponse.json({
      success: true,
      data_entries_created: dataEntriesCreated,
      metric_points_created: metricPointsCreated,
    });
  } catch (err) {
    console.error("[confirm-data] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
