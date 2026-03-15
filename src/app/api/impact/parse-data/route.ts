import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    // Rate limit
    const forwarded = req.headers.get("x-forwarded-for");
    const ip =
      (forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip")) ?? "unknown";
    const { limited, message: limitMessage } = await checkRateLimit(`parse-data:${ip}`);
    if (limited) {
      return NextResponse.json({ error: limitMessage }, { status: 429 });
    }

    // Auth
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { text } = body as { text: string };

    if (!text?.trim()) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: `You are a data tagging assistant for nonprofit program reporting. Parse the pasted text and extract content into these exact categories:
- outcomes: measurable results and achievements
- quantitative_data: numbers, percentages, counts
- barriers: challenges, obstacles, unmet needs
- client_voice: quotes or stories from clients
- change_description: descriptions of change over time

Return ONLY a valid JSON object with these exact keys. If a category has no content, set its value to null. Do not add commentary, explanation, or markdown formatting.`,
      messages: [
        {
          role: "user",
          content: text,
        },
      ],
    });

    const content = message.content[0];
    const raw = content.type === "text" ? content.text.trim() : "{}";

    // Strip code fences if present
    const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = fenceMatch ? fenceMatch[1].trim() : raw;

    const parsed = JSON.parse(jsonStr) as {
      outcomes: string | null;
      quantitative_data: string | null;
      barriers: string | null;
      client_voice: string | null;
      change_description: string | null;
    };

    return NextResponse.json({
      outcomes: parsed.outcomes ?? null,
      quantitative_data: parsed.quantitative_data ?? null,
      barriers: parsed.barriers ?? null,
      client_voice: parsed.client_voice ?? null,
      change_description: parsed.change_description ?? null,
    });
  } catch (error) {
    console.error("Parse data route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
