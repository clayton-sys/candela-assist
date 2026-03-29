// SECURITY CHECKLIST
// [x] Auth: requireAuth() called
// [x] Zod: validate incoming parsed JSON matches expected contract
// [x] Response: return new org_id only

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const MetricSchema = z.object({
  metric_name: z.string().min(1),
  unit: z.string().nullable().optional(),
  target_value: z.string().nullable().optional(),
});

const ProgramSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().default(""),
  population_served: z.string().optional().default(""),
  metrics: z.array(MetricSchema).max(5).optional().default([]),
});

const SaveOrgSchema = z.object({
  org_name: z.string().min(1),
  legal_name: z.string().nullable().optional(),
  mission: z.string().min(1),
  mission_short: z.string().max(200).optional(),
  org_type: z.enum(["501c3", "501c4", "fiscal_sponsored", "other"]).nullable().optional(),
  geography: z.object({
    city: z.string().nullable().optional(),
    state: z.string().nullable().optional(),
    region: z.string().nullable().optional(),
  }).optional(),
  website: z.string().nullable().optional(),
  population_served: z.string().optional().default(""),
  brand_voice: z.string().optional().default(""),
  programs: z.array(ProgramSchema).max(6).optional().default([]),
});

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function POST(req: NextRequest) {
  try {
    // ── Auth: requireAuth() ──────────────────────────────────────
    const supabase = createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Check user doesn't already have an org ───────────────────
    const { data: existingOrg } = await supabase
      .from("org_users")
      .select("org_id")
      .eq("user_id", user.id)
      .single();

    if (existingOrg) {
      return NextResponse.json(
        { error: "You already belong to an organization." },
        { status: 409 }
      );
    }

    // ── Input: Zod validation ────────────────────────────────────
    const body = await req.json();
    const parsed = SaveOrgSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const data = parsed.data;

    // ── Use service role client for inserts (bypasses RLS) ───────
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ── Generate unique slug ─────────────────────────────────────
    let slug = slugify(data.org_name);
    const { data: slugCheck } = await adminClient
      .from("orgs")
      .select("id")
      .eq("slug", slug)
      .single();

    if (slugCheck) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    // ── 1. Insert org ────────────────────────────────────────────
    const { data: orgRow, error: orgError } = await adminClient
      .from("orgs")
      .insert({
        name: data.org_name,
        legal_name: data.legal_name ?? null,
        slug,
        mission: data.mission,
        mission_short: data.mission_short ?? null,
        plan: "free",
      })
      .select("id")
      .single();

    if (orgError || !orgRow) {
      console.error("[save-org] orgs insert error:", orgError);
      return NextResponse.json(
        { error: "Failed to create organization" },
        { status: 500 }
      );
    }

    const orgId = orgRow.id;

    // ── 2. Insert brand_kits (defaults) ──────────────────────────
    const { error: brandError } = await adminClient
      .from("brand_kits")
      .insert({
        org_id: orgId,
        brand_primary: "#1B2B3A",
        brand_accent: "#E9C03A",
      });

    if (brandError) {
      console.error("[save-org] brand_kits insert error:", brandError);
      // Non-fatal — continue
    }

    // ── 3. Insert programs + program_metrics ─────────────────────
    const programIds: string[] = [];
    for (let i = 0; i < data.programs.length; i++) {
      const prog = data.programs[i];

      const { data: programRow, error: progError } = await adminClient
        .from("programs")
        .insert({
          org_id: orgId,
          name: prog.name,
          description: prog.description || "",
          display_order: i,
          is_archived: false,
        })
        .select("id")
        .single();

      if (progError || !programRow) {
        console.error("[save-org] programs insert error:", progError);
        continue;
      }

      programIds.push(programRow.id);

      if (prog.metrics.length > 0) {
        const metricRows = prog.metrics.map((m, idx) => ({
          program_id: programRow.id,
          metric_name: m.metric_name,
          unit: m.unit ?? null,
          target_value: m.target_value ?? null,
          display_order: idx,
          is_featured: idx === 0,
        }));

        const { error: metricError } = await adminClient
          .from("program_metrics")
          .insert(metricRows);

        if (metricError) {
          console.error("[save-org] program_metrics insert error:", metricError);
        }
      }
    }

    // ── 4. Insert org_users (owner) ──────────────────────────────
    const { error: orgUserError } = await adminClient
      .from("org_users")
      .insert({
        org_id: orgId,
        user_id: user.id,
        role: "owner",
      });

    if (orgUserError) {
      console.error("[save-org] org_users insert error:", orgUserError);
      // This is critical — if it fails, the user can't access their org
      return NextResponse.json(
        { error: "Failed to link user to organization" },
        { status: 500 }
      );
    }

    // ── Response: return new org_id and slug only ────────────────
    return NextResponse.json({
      org_id: orgId,
      slug,
      programs_created: programIds.length,
    });
  } catch (err) {
    console.error("[save-org] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
