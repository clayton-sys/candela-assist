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
      `gs-analyze:${ip}`
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
    const { rawData, orgId } = body as { rawData: string; orgId: string };

    if (!rawData || !orgId) {
      return NextResponse.json(
        { error: "rawData and orgId are required" },
        { status: 400 }
      );
    }

    // ── Anthropic call ─────────────────────────────────────────────────────
    const response = await client.messages.create({
      model: "claude-opus-4-20250514",
      max_tokens: 2000,
      system: `You are a nonprofit program data analyst. Extract all quantitative and qualitative data points from the provided program data. Organize them into exactly these 5 categories: core_outcomes, volume_enrollment, demographics, benchmarks, trends. Also generate exactly 3 key insights as concise sentences. Return ONLY valid JSON matching this exact schema — no text outside the JSON:
{
  "categories": {
    "core_outcomes":     [{ "id": "string", "label": "string", "value": "string", "category": "core_outcomes",     "selected": true }],
    "volume_enrollment": [{ "id": "string", "label": "string", "value": "string", "category": "volume_enrollment", "selected": true }],
    "demographics":      [{ "id": "string", "label": "string", "value": "string", "category": "demographics",      "selected": true }],
    "benchmarks":        [{ "id": "string", "label": "string", "value": "string", "category": "benchmarks",        "selected": true }],
    "trends":            [{ "id": "string", "label": "string", "value": "string", "category": "trends",            "selected": true }]
  },
  "insights": ["string", "string", "string"]
}`,
      messages: [{ role: "user", content: rawData }],
    });

    // ── Parse response ─────────────────────────────────────────────────────
    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "No text response from AI" },
        { status: 500 }
      );
    }

    let text = textBlock.text.trim();
    // Strip code fences if present
    if (text.startsWith("```")) {
      text = text.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
    }

    try {
      const parsed = JSON.parse(text);
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json(
        { error: "parse_failed", raw: text },
        { status: 400 }
      );
    }
  } catch (err) {
    console.error("analyze-data error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
