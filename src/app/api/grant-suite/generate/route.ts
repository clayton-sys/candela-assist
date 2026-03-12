import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { checkRateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function generateSlug(programName: string): string {
  const base = programName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const random = Math.random().toString(36).substring(2, 6);
  return `${base}-${random}`;
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
      `gs:${ip}`
    );
    if (limited) {
      return NextResponse.json({ error: limitMessage }, { status: 429 });
    }

    // ── Auth — get user via Supabase session ───────────────────────────────
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

    // Get user's org
    const { data: orgUser } = await supabase
      .from("org_users")
      .select("org_id")
      .eq("user_id", user.id)
      .single();

    if (!orgUser?.org_id) {
      return NextResponse.json(
        { error: "No organization found for this user" },
        { status: 403 }
      );
    }

    // ── Parse body ─────────────────────────────────────────────────────────
    const body = await req.json();
    const { programName, orgName, population, vertical, activities, inputs, outcomes, editId } =
      body as {
        programName: string;
        orgName?: string;
        population: string;
        vertical?: string;
        activities: string;
        inputs?: string;
        outcomes?: string;
        editId?: string;
      };

    if (!programName?.trim() || !population?.trim() || !activities?.trim()) {
      return NextResponse.json(
        { error: "programName, population, and activities are required" },
        { status: 400 }
      );
    }

    // Input length guard
    const fields = [programName, orgName, population, vertical, activities, inputs, outcomes];
    if (fields.some((f) => f && f.length > 3000)) {
      return NextResponse.json(
        { error: "One or more fields exceeds the 3,000 character limit." },
        { status: 400 }
      );
    }

    // ── Build prompts ──────────────────────────────────────────────────────
    const systemPrompt = `You are an expert nonprofit program evaluator and logic model specialist with deep experience in grant writing, program design, and outcome measurement across the nonprofit sector. You specialize in ${vertical || "general nonprofit services"}. Return ONLY valid JSON. No markdown, no backticks, no explanation.`;

    const userPrompt = `Program Name: ${programName}
Organization: ${orgName || "Not specified"}
Target Population: ${population}
Service Vertical: ${vertical || "General nonprofit services"}
Core Activities: ${activities}
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
- Use sector-specific language. Workforce development → reference WIOA, wage outcomes, employer engagement. Housing → AMI, housing stability. Mental health → trauma-informed, evidence-based modalities.
- Be specific. "150 adults per year" not "participants". "$19/hr average starting wage" not "living wage".`;

    // ── Call Claude ────────────────────────────────────────────────────────
    const message = await client.messages.create({
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

    // Parse JSON response — strip markdown code fences if present
    let rawText = content.text.trim();
    const fenceMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      rawText = fenceMatch[1].trim();
    }

    let logicModelData: unknown;
    try {
      logicModelData = JSON.parse(rawText);
    } catch {
      console.error("Claude returned non-JSON:", content.text.slice(0, 200));
      return NextResponse.json(
        { error: "Failed to parse logic model response. Please try again." },
        { status: 500 }
      );
    }

    // ── Save to Supabase ───────────────────────────────────────────────────
    const modelPayload = {
      program_name: programName,
      org_name: orgName || null,
      vertical: vertical || null,
      data: {
        programName,
        orgName: orgName || "",
        population,
        vertical: vertical || "",
        activities,
        inputs: inputs || "",
        outcomes: outcomes || "",
        ...(logicModelData as object),
      },
      updated_at: new Date().toISOString(),
    };

    let record: { id: string; slug: string } | null = null;
    let dbError: unknown = null;

    if (editId) {
      // Update existing record
      const { data, error } = await supabase
        .from("logic_models")
        .update(modelPayload)
        .eq("id", editId)
        .eq("org_id", orgUser.org_id) // security: ensure ownership
        .select("id, slug")
        .single();
      record = data;
      dbError = error;
    } else {
      // Insert new record
      const slug = generateSlug(programName);
      const { data, error } = await supabase
        .from("logic_models")
        .insert({ org_id: orgUser.org_id, slug, ...modelPayload })
        .select("id, slug")
        .single();
      record = data;
      dbError = error;
    }

    if (dbError || !record) {
      console.error("DB error:", dbError);
      return NextResponse.json(
        { error: "Failed to save logic model" },
        { status: 500 }
      );
    }

    return NextResponse.json({ id: record.id, slug: record.slug });
  } catch (error) {
    console.error("Grant Suite generate error:", error);
    return NextResponse.json(
      { error: "Failed to generate logic model. Please try again." },
      { status: 500 }
    );
  }
}
