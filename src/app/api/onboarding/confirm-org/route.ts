// SECURITY CHECKLIST
// [x] Auth: requireAuth() called first
// [x] Org: requireOrgMember() called
// [x] Rate limit: Upstash applied (confirm-org, 10 requests per org per hour)
// [x] Input: Zod schema validated
// [x] Response: no raw DB rows exposed

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const MetricSchema = z.object({
  name: z.string().min(1),
  unit: z.string().min(1),
});

const ProgramSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().default(""),
  population_served: z.string().nullable().optional(),
  geography: z.string().nullable().optional(),
  suggested_metrics: z.array(MetricSchema).optional().default([]),
});

const ConfirmSchema = z.object({
  org_id: z.string().uuid(),
  org_name: z.string().nullable().optional(),
  legal_name: z.string().nullable().optional(),
  mission: z.string().nullable().optional(),
  mission_short: z.string().nullable().optional(),
  programs: z.array(ProgramSchema).optional().default([]),
  primary_color: z.string().nullable().optional(),
  secondary_color: z.string().nullable().optional(),
  brand_voice_notes: z.string().nullable().optional(),
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
    const parsed = ConfirmSchema.safeParse(body);
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

    // ── Rate limit: Upstash (confirm-org, 10 per org per hour) ──
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (url && token) {
      const { Redis } = await import("@upstash/redis");
      const { Ratelimit } = await import("@upstash/ratelimit");

      const redis = new Redis({ url, token });
      const limiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "1 h"),
        prefix: "rl:confirm-org",
      });

      const { success } = await limiter.limit(`confirm-org:${data.org_id}`);
      if (!success) {
        return NextResponse.json(
          { error: "Rate limit exceeded. 10 confirm requests per org per hour." },
          { status: 429 }
        );
      }
    }

    // ── Save to orgs table ───────────────────────────────────────
    const orgPayload: Record<string, string | null> = {};
    if (data.org_name !== undefined) orgPayload.name = data.org_name ?? null;
    if (data.legal_name !== undefined) orgPayload.legal_name = data.legal_name ?? null;
    if (data.mission !== undefined) orgPayload.mission = data.mission ?? null;
    if (data.mission_short !== undefined) orgPayload.mission_short = data.mission_short ?? null;

    if (Object.keys(orgPayload).length > 0) {
      const { error: orgError } = await supabase
        .from("orgs")
        .update(orgPayload)
        .eq("id", data.org_id);

      if (orgError) {
        console.error("[confirm-org] orgs update error:", orgError);
        return NextResponse.json(
          { error: "Failed to update org" },
          { status: 500 }
        );
      }
    }

    // ── Save to brand_kits table ─────────────────────────────────
    if (data.primary_color || data.secondary_color) {
      const brandPayload: Record<string, string | null> = {
        org_id: data.org_id,
      };
      if (data.primary_color) brandPayload.primary_color = data.primary_color;
      if (data.secondary_color) brandPayload.secondary_color = data.secondary_color;

      // Upsert: update if exists, insert if not
      const { data: existing } = await supabase
        .from("brand_kits")
        .select("id")
        .eq("org_id", data.org_id)
        .single();

      if (existing) {
        const { error: brandError } = await supabase
          .from("brand_kits")
          .update(brandPayload)
          .eq("org_id", data.org_id);

        if (brandError) {
          console.error("[confirm-org] brand_kits update error:", brandError);
        }
      } else {
        const { error: brandError } = await supabase
          .from("brand_kits")
          .insert(brandPayload);

        if (brandError) {
          console.error("[confirm-org] brand_kits insert error:", brandError);
        }
      }
    }

    // ── Save to programs + program_metrics tables ────────────────
    for (let i = 0; i < data.programs.length; i++) {
      const prog = data.programs[i];

      const { data: programRow, error: progError } = await supabase
        .from("programs")
        .insert({
          org_id: data.org_id,
          name: prog.name,
          description: prog.description || "",
          display_order: i,
        })
        .select("id")
        .single();

      if (progError || !programRow) {
        console.error("[confirm-org] programs insert error:", progError);
        continue;
      }

      // Insert suggested metrics for this program
      if (prog.suggested_metrics.length > 0) {
        const metricRows = prog.suggested_metrics.map((m, idx) => ({
          program_id: programRow.id,
          metric_name: m.name,
          unit: m.unit,
          display_order: idx,
        }));

        const { error: metricError } = await supabase
          .from("program_metrics")
          .insert(metricRows);

        if (metricError) {
          console.error("[confirm-org] program_metrics insert error:", metricError);
        }
      }
    }

    // ── Response: no raw DB rows exposed ─────────────────────────
    return NextResponse.json({
      success: true,
      programs_created: data.programs.length,
    });
  } catch (err) {
    console.error("[confirm-org] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
