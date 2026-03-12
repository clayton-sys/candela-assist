import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const logicModelId = req.nextUrl.searchParams.get("logicModelId");
    if (!logicModelId) {
      return NextResponse.json({ error: "logicModelId required" }, { status: 400 });
    }

    // ── Auth ──────────────────────────────────────────────────────────────
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
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

    // ── Fetch reporting data ─────────────────────────────────────────────
    const { data: rows, error } = await supabase
      .from("reporting_data")
      .select("*")
      .eq("logic_model_id", logicModelId)
      .order("updated_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(rows ?? []);
  } catch (err) {
    console.error("reporting-data GET error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
