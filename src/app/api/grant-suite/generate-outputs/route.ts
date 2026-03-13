import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { checkRateLimit } from "@/lib/ratelimit";
import type { DataPoint } from "@/lib/grant-suite/types";
import type { BrandTokens } from "@/lib/brand-kit/types";

export const dynamic = "force-dynamic";

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function randomId(len = 4): string {
  return Math.random().toString(36).substring(2, 2 + len);
}

export async function POST(req: NextRequest) {
  try {
    // ── Rate limiting ──────────────────────────────────────────────────────
    const forwarded = req.headers.get("x-forwarded-for");
    const ip =
      (forwarded
        ? forwarded.split(",")[0].trim()
        : req.headers.get("x-real-ip")) ?? "unknown";

    const { limited, message: limitMessage } = await checkRateLimit(
      `gs-gen-out:${ip}`
    );
    if (limited) {
      return NextResponse.json({ error: limitMessage }, { status: 429 });
    }

    // ── Auth ───────────────────────────────────────────────────────────────
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch {}
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Parse body ─────────────────────────────────────────────────────────
    const body = await req.json();
    const { selectedDataPoints, selectedViews, brandTokens, orgId } = body as {
      selectedDataPoints: DataPoint[];
      selectedViews: string[];
      brandTokens: BrandTokens;
      orgId: string;
    };

    if (!selectedDataPoints?.length || !selectedViews?.length || !orgId) {
      return NextResponse.json(
        { error: "selectedDataPoints, selectedViews, and orgId are required" },
        { status: 400 }
      );
    }

    // ── Derive program name ────────────────────────────────────────────────
    const programNamePoint = selectedDataPoints.find(
      (p) =>
        p.label.toLowerCase().includes("program") ||
        p.label.toLowerCase().includes("name")
    );
    const programName = programNamePoint?.value ?? "Your Program";

    // ── Create slug and logic_models row ──────────────────────────────────
    const slug = `${slugify(programName)}-${randomId(4)}`;

    const { data: model, error: insertError } = await supabase
      .from("logic_models")
      .insert({
        org_id: orgId,
        slug,
        program_name: programName,
        data: {
          selectedDataPoints,
          selectedViews,
          brandTokens,
          status: "generating",
        },
      })
      .select()
      .single();

    if (insertError || !model) {
      console.error("Failed to insert logic model:", insertError);
      return NextResponse.json(
        { error: insertError?.message ?? "Failed to create program record" },
        { status: 500 }
      );
    }

    // ── Generate or stub each selected view ───────────────────────────────
    const STUB_VIEWS = [
      "command_center",
      "staff_dashboard",
      "board_deck",
      "funder_public",
      "website_embed",
      "impact_one_pager",
    ];

    const viewStatuses: Record<string, string> = {};

    for (const viewId of selectedViews) {
      if (STUB_VIEWS.includes(viewId)) {
        viewStatuses[viewId] = "coming_soon";
      } else {
        // logic_model, grant_report, eval_plan — mark as ready
        // (actual generation happens via existing routes when user navigates to the detail page)
        viewStatuses[viewId] = "ready";
      }
    }

    // Update the model data with view statuses
    await supabase
      .from("logic_models")
      .update({
        data: {
          selectedDataPoints,
          selectedViews,
          brandTokens,
          status: "complete",
          viewStatuses,
        },
      })
      .eq("id", model.id);

    return NextResponse.json({ slug, modelId: model.id });
  } catch (err) {
    console.error("generate-outputs error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
