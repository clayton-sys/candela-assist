import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { checkRateLimit } from "@/lib/ratelimit";
import Anthropic from "@anthropic-ai/sdk";
import type { DataPoint } from "@/lib/grant-suite/types";
import type { BrandTokens } from "@/lib/brand-kit/types";

export const dynamic = "force-dynamic";

const claude = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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

    // ── Derive program info from data points ────────────────────────────
    const findPoint = (keywords: string[]) =>
      selectedDataPoints.find((p) =>
        keywords.some((kw) => p.label.toLowerCase().includes(kw))
      )?.value ?? "";

    const programName = findPoint(["program", "name"]) || "Your Program";
    const orgName = findPoint(["organization", "org", "agency"]);
    const population = findPoint(["population", "target", "served", "demographic"]);
    const vertical = findPoint(["vertical", "sector", "service area", "focus"]);
    const activities = findPoint(["activities", "services", "programming"]);
    const inputs = findPoint(["inputs", "resources", "funding", "staff"]);
    const outcomes = findPoint(["outcomes", "goals", "impact", "results"]);

    // Build a summary of all data points for Claude
    const dataPointsSummary = selectedDataPoints
      .map((dp) => `${dp.label}: ${dp.value}`)
      .join("\n");

    // ── Call Claude to generate logic model ──────────────────────────────
    const systemPrompt = `You are an expert nonprofit program evaluator and logic model specialist with deep experience in grant writing, program design, and outcome measurement across the nonprofit sector. You specialize in ${vertical || "general nonprofit services"}. Return ONLY valid JSON. No markdown, no backticks, no explanation.`;

    const userPrompt = `Using the following program data, generate a complete logic model:

${dataPointsSummary}

Program Name: ${programName}
Organization: ${orgName || "Not specified"}
Target Population: ${population || "Not specified"}
Service Vertical: ${vertical || "General nonprofit services"}
Core Activities: ${activities || "Not specified"}
Key Resources/Inputs: ${inputs || "Not specified"}
Desired Outcomes: ${outcomes || "Not specified"}

Generate a complete logic model in exactly this JSON structure:
{
  "inputs": [{ "title": "", "detail": "" }],
  "activities": [{ "title": "", "detail": "" }],
  "outputs": [{ "title": "", "metric": "", "target": "" }],
  "shortTermOutcomes": [{ "title": "", "indicator": "", "timeframe": "" }],
  "longTermOutcomes": [{ "title": "", "indicator": "", "timeframe": "" }],
  "theoryOfChange": ""
}

Rules:
- inputs: 4 items. Title (2-4 words) + detail (1 specific sentence)
- activities: 4 items. Same format. What the program actually does.
- outputs: 4 items. Title + metric (what is counted) + target (specific number + unit e.g. "150 adults per year")
- shortTermOutcomes: 3 items. Knowledge/skill/attitude changes at 0-12 months. Specific measurable indicator + timeframe.
- longTermOutcomes: 3 items. Behavior/life condition changes at 1-5 years. Indicator + timeframe (e.g. "2-year follow-up").
- theoryOfChange: 2-3 sentences. Funder-ready narrative: population → activities → ultimate vision.
- Use sector-specific language. Be specific with numbers and metrics.`;

    const message = await claude.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      return NextResponse.json(
        { error: "Unexpected response from Claude" },
        { status: 500 }
      );
    }

    // Parse JSON — strip markdown code fences if present
    let rawText = content.text.trim();
    const fenceMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      rawText = fenceMatch[1].trim();
    }

    let logicModelData: Record<string, unknown>;
    try {
      logicModelData = JSON.parse(rawText);
    } catch {
      console.error("Claude returned non-JSON:", content.text.slice(0, 200));
      return NextResponse.json(
        { error: "Failed to parse logic model response. Please try again." },
        { status: 500 }
      );
    }

    // ── Create slug and save to Supabase ─────────────────────────────────
    const slug = `${slugify(programName)}-${randomId(4)}`;

    // Build view statuses
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
      viewStatuses[viewId] = STUB_VIEWS.includes(viewId) ? "coming_soon" : "ready";
    }

    const { data: model, error: insertError } = await supabase
      .from("logic_models")
      .insert({
        org_id: orgId,
        slug,
        program_name: programName,
        org_name: orgName || null,
        vertical: vertical || null,
        data: {
          programName,
          orgName: orgName || "",
          population: population || "",
          vertical: vertical || "",
          activities: activities || "",
          inputs: inputs || "",
          outcomes: outcomes || "",
          selectedDataPoints,
          selectedViews,
          brandTokens,
          viewStatuses,
          ...logicModelData,
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

    return NextResponse.json({ slug, modelId: model.id });
  } catch (err) {
    console.error("generate-outputs error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
