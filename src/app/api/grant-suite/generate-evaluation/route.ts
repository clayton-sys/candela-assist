import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { checkRateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    // ── Rate limiting ──────────────────────────────────────────────────────
    const forwarded = req.headers.get("x-forwarded-for");
    const ip =
      (forwarded
        ? forwarded.split(",")[0].trim()
        : req.headers.get("x-real-ip")) ?? "unknown";

    const { limited, message: limitMessage } = await checkRateLimit(
      `gs-eval:${ip}`
    );
    if (limited) {
      return NextResponse.json({ error: limitMessage }, { status: 429 });
    }

    // ── Auth ────────────────────────────────────────────────────────────────
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
    const {
      logicModelId,
      cardColumn,
      cardIndex,
      cardData,
      programContext,
    } = body as {
      logicModelId: string;
      cardColumn: string;
      cardIndex: number;
      cardData: { title: string; metric?: string; target?: string; detail?: string; indicator?: string; timeframe?: string };
      programContext: {
        programName: string;
        vertical: string;
        population: string;
        theoryOfChange: string;
      };
    };

    if (!logicModelId || !cardColumn || cardIndex == null || !cardData?.title) {
      return NextResponse.json(
        { error: "logicModelId, cardColumn, cardIndex, and cardData.title are required" },
        { status: 400 }
      );
    }

    // Verify the logic model belongs to user's org
    const { data: model } = await supabase
      .from("logic_models")
      .select("id, org_id")
      .eq("id", logicModelId)
      .eq("org_id", orgUser.org_id)
      .single();

    if (!model) {
      return NextResponse.json(
        { error: "Logic model not found or access denied" },
        { status: 404 }
      );
    }

    // ── Build the detail string from card data ─────────────────────────────
    const cardDetail = cardData.metric
      || cardData.detail
      || cardData.indicator
      || "";

    // ── Build prompts ──────────────────────────────────────────────────────
    const vertical = programContext.vertical || "general nonprofit services";

    const systemPrompt = `You are an expert nonprofit program evaluator with deep experience in outcome measurement, grant reporting, and data collection strategy. You specialize in ${vertical}. Generate a specific, actionable evaluation plan for one element of a nonprofit logic model. Use funder-ready language appropriate for government and foundation reporting. Return ONLY valid JSON — no markdown, no backticks, no explanation.`;

    const userPrompt = `Program: ${programContext.programName}
Population: ${programContext.population}
Vertical: ${vertical}
Logic model element type: ${cardColumn}
Element: ${cardData.title}
Detail/metric: ${cardDetail}

Generate an evaluation plan for this element in this exact JSON structure:
{
  "indicator": "",
  "frequency": "",
  "dataSource": "",
  "responsibleParty": "",
  "collectionMethods": [
    { "name": "", "description": "", "icon": "" }
  ],
  "funderLanguage": "",
  "reportingNotes": ""
}

Rules:
- indicator: Specific, measurable indicator for this element (1-2 sentences)
- frequency: How often data is collected (e.g. "Monthly", "At 30/90/180-day follow-up")
- dataSource: Where the data comes from (e.g. "Case management system", "CDLE wage records")
- responsibleParty: Who on staff collects this (e.g. "Data & Evaluation Manager")
- collectionMethods: 2-4 methods. name (short label), description (1 sentence), icon (single emoji)
- funderLanguage: 2-3 sentences of polished, funder-ready narrative. Should read like a grant report.
- reportingNotes: 1 sentence of practical guidance for staff collecting this data.
- Use sector-specific language. Workforce: reference WIOA, wage records, CDLE. Housing: AMI, HUD.`;

    // ── Call Claude ─────────────────────────────────────────────────────────
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
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

    let evaluationPlan: Record<string, unknown>;
    try {
      evaluationPlan = JSON.parse(rawText);
    } catch {
      console.error("Claude returned non-JSON:", content.text.slice(0, 200));
      return NextResponse.json(
        { error: "Failed to parse evaluation plan. Please try again." },
        { status: 500 }
      );
    }

    // Add generation timestamp
    evaluationPlan.generatedAt = new Date().toISOString();

    // ── Save to Supabase — JSONB merge ─────────────────────────────────────
    const planKey = `${cardColumn}_${cardIndex}`;

    // Read current evaluation_plans, merge, write back
    const { data: currentModel } = await supabase
      .from("logic_models")
      .select("evaluation_plans")
      .eq("id", logicModelId)
      .single();

    const currentPlans = (currentModel?.evaluation_plans as Record<string, unknown>) ?? {};
    const updatedPlans = { ...currentPlans, [planKey]: evaluationPlan };

    const { error: updateError } = await supabase
      .from("logic_models")
      .update({ evaluation_plans: updatedPlans, updated_at: new Date().toISOString() })
      .eq("id", logicModelId)
      .eq("org_id", orgUser.org_id);

    if (updateError) {
      console.error("Failed to cache evaluation plan:", updateError);
      // Still return the plan even if caching fails
    }

    return NextResponse.json(evaluationPlan);
  } catch (error) {
    console.error("Evaluation plan generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate evaluation plan. Please try again." },
      { status: 500 }
    );
  }
}
