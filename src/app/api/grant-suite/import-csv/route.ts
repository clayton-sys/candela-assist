import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { checkRateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface CsvRow {
  card_key: string;
  card_title: string;
  reporting_period: string;
  current_value: number;
  target_value: number;
  notes: string;
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
      `gs-csv:${ip}`
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
    const { logicModelId, rows, programContext } = body as {
      logicModelId: string;
      rows: CsvRow[];
      programContext: {
        programName: string;
        vertical: string;
        population: string;
        theoryOfChange: string;
      };
    };

    if (!logicModelId || !rows?.length) {
      return NextResponse.json(
        { error: "logicModelId and rows are required" },
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

    // ── Process each row ───────────────────────────────────────────────────
    const results: Array<{ cardKey: string; period: string; status: string }> = [];
    const errors: string[] = [];
    const vertical = programContext.vertical || "general nonprofit services";

    for (const row of rows) {
      try {
        if (!row.card_key || !row.reporting_period) {
          errors.push(`Skipped row: missing card_key or reporting_period`);
          continue;
        }

        const currentValue = Number(row.current_value) || 0;
        const targetValue = Number(row.target_value) || 0;
        const percentToGoal =
          targetValue > 0
            ? Math.round((currentValue / targetValue) * 100)
            : 0;

        // Generate narrative
        const systemPrompt = `You are an expert nonprofit grant writer and program evaluator specializing in ${vertical} programs. Write clear, compelling, data-driven funder narrative updates that are professional, specific, and appropriate for foundation and government grant reports.`;

        const userPrompt = `Write a funder-ready narrative update for the following data point.

Program: ${programContext.programName}
Population: ${programContext.population}
Reporting period: ${row.reporting_period}
Metric: ${row.card_title}
Target: ${targetValue}
Current value: ${currentValue}
Progress: ${percentToGoal}% to goal
Staff notes: ${row.notes || "None provided"}

Write 2-3 sentences that:
1. State the current progress clearly and specifically — use the actual numbers
2. Provide context if staff notes were included
3. Connect the progress to the program's broader impact on ${programContext.population}
4. If behind target, acknowledge it professionally and note trajectory or next steps

Sound like a skilled grant writer. Do not use phrases like "it is worth noting" or "it is important to highlight." Be direct, confident, and specific.

Return ONLY the narrative text. No JSON, no markdown, no explanation.`;

        const message = await client.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 512,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        });

        const content = message.content[0];
        const narrative =
          content.type === "text" ? content.text.trim() : "";

        // Upsert row
        const { error: upsertError } = await supabase
          .from("reporting_data")
          .upsert(
            {
              logic_model_id: logicModelId,
              card_key: row.card_key,
              reporting_period: row.reporting_period,
              current_value: currentValue,
              target_value: targetValue,
              notes: row.notes || null,
              narrative,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "logic_model_id,card_key,reporting_period" }
          );

        if (upsertError) {
          errors.push(
            `Failed to save ${row.card_key}/${row.reporting_period}: ${upsertError.message}`
          );
        } else {
          results.push({
            cardKey: row.card_key,
            period: row.reporting_period,
            status: "imported",
          });
        }
      } catch (err) {
        errors.push(
          `Error processing ${row.card_key}: ${err instanceof Error ? err.message : "unknown"}`
        );
      }
    }

    return NextResponse.json({
      imported: results.length,
      total: rows.length,
      results,
      errors,
    });
  } catch (error) {
    console.error("CSV import error:", error);
    return NextResponse.json(
      { error: "Failed to import CSV data. Please try again." },
      { status: 500 }
    );
  }
}
