// SECURITY CHECKLIST
// [x] Auth: requireAuth()
// [x] Org: requireOrgMember()
// [x] Zod: validate incoming data
// [x] Response: return new data_entry_ids only

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const MetricValueSchema = z.object({
  metric_id: z.string().uuid(),
  value: z.string().nullable(),
});

const ProgramDataSchema = z.object({
  program_id: z.string().uuid(),
  program_name: z.string().optional(),
  matched: z.boolean().optional(),
  outcomes: z.string().nullable().optional(),
  barriers: z.string().nullable().optional(),
  change_description: z.string().nullable().optional(),
  client_voice: z.string().nullable().optional(),
  metrics: z.array(MetricValueSchema).optional().default([]),
});

const SaveDataSchema = z.object({
  org_id: z.string().uuid(),
  period_label: z.string().min(1).max(100),
  period_start: z.string().nullable().optional(),
  period_end: z.string().nullable().optional(),
  raw_text: z.string().min(20).max(10000),
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
    const parsed = SaveDataSchema.safeParse(body);
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

    // ── Use service role client for inserts ──────────────────────
    const adminClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ── Save to program_data + program_data_points ───────────────
    const dataEntryIds: string[] = [];

    for (const prog of data.programs) {
      // Skip programs that weren't matched
      if (prog.matched === false) continue;

      // One program_data row per program
      const { data: dataRow, error: dataError } = await adminClient
        .from("program_data")
        .insert({
          org_id: data.org_id,
          program_id: prog.program_id,
          period_label: data.period_label,
          period_start: data.period_start ?? null,
          period_end: data.period_end ?? null,
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
        console.error("[save-data] program_data insert error:", dataError);
        continue;
      }

      dataEntryIds.push(dataRow.id);

      // One program_data_points row per metric value
      const metricRows = prog.metrics
        .filter((m) => m.value !== null && m.value !== undefined)
        .map((m) => ({
          data_entry_id: dataRow.id,
          metric_id: m.metric_id,
          value: m.value,
        }));

      if (metricRows.length > 0) {
        const { error: metricError } = await adminClient
          .from("program_data_points")
          .insert(metricRows);

        if (metricError) {
          console.error("[save-data] program_data_points insert error:", metricError);
        }
      }
    }

    // ── Response: return new data_entry_ids only ─────────────────
    return NextResponse.json({
      success: true,
      data_entry_ids: dataEntryIds,
    });
  } catch (err) {
    console.error("[save-data] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
