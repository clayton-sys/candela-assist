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
      `gs-narr:${ip}`
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

    const { data: orgUser } = await supabase
      .from("org_users")
      .select("org_id")
      .eq("user_id", user.id)
      .single();

    if (!orgUser?.org_id) {
      return NextResponse.json(
        { error: "No organization found" },
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
      reportingPeriod,
      currentValue,
      targetValue,
      notes,
      programContext,
    } = body as {
      logicModelId: string;
      cardColumn: string;
      cardIndex: number;
      cardData: { title: string; metric?: string; target?: string };
      reportingPeriod: string;
      currentValue: number;
      targetValue: number;
      notes?: string;
      programContext: {
        programName: string;
        vertical: string;
        population: string;
        theoryOfChange: string;
      };
    };

    if (!logicModelId || !cardColumn || cardIndex == null || !reportingPeriod) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify ownership
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

    // ── Calculate % to goal ────────────────────────────────────────────────
    const percentToGoal =
      targetValue > 0
        ? Math.round((currentValue / targetValue) * 100)
        : 0;

    // ── Build prompts ──────────────────────────────────────────────────────
    const vertical = programContext.vertical || "general nonprofit services";

    const systemPrompt = `You are an expert nonprofit grant writer and program evaluator specializing in ${vertical} programs. Write clear, compelling, data-driven funder narrative updates that are professional, specific, and appropriate for foundation and government grant reports.`;

    const userPrompt = `Write a funder-ready narrative update for the following data point.

Program: ${programContext.programName}
Population: ${programContext.population}
Reporting period: ${reportingPeriod}
Metric: ${cardData.title} (${cardData.metric || ""})
Target: ${targetValue}
Current value: ${currentValue}
Progress: ${percentToGoal}% to goal
Staff notes: ${notes || "None provided"}

Write 2-3 sentences that:
1. State the current progress clearly and specifically — use the actual numbers
2. Provide context if staff notes were included
3. Connect the progress to the program's broader impact on ${programContext.population}
4. If behind target, acknowledge it professionally and note trajectory or next steps

Sound like a skilled grant writer. Do not use phrases like "it is worth noting" or "it is important to highlight." Be direct, confident, and specific.

Return ONLY the narrative text. No JSON, no markdown, no explanation.`;

    // ── Call Claude ─────────────────────────────────────────────────────────
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      return NextResponse.json(
        { error: "Unexpected response" },
        { status: 500 }
      );
    }

    const narrative = content.text.trim();

    // ── Save to reporting_data ─────────────────────────────────────────────
    const cardKey = `${cardColumn}_${cardIndex}`;

    const { error: upsertError } = await supabase
      .from("reporting_data")
      .upsert(
        {
          logic_model_id: logicModelId,
          card_key: cardKey,
          reporting_period: reportingPeriod,
          current_value: currentValue,
          target_value: targetValue,
          notes: notes || null,
          narrative,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "logic_model_id,card_key,reporting_period" }
      );

    if (upsertError) {
      console.error("Failed to save reporting data:", upsertError);
    }

    return NextResponse.json({ narrative });
  } catch (error) {
    console.error("Narrative generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate narrative. Please try again." },
      { status: 500 }
    );
  }
}
