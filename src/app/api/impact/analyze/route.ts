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
    const { limited, message: limitMessage } = await checkRateLimit(`grs-analyze:${ip}`);
    if (limited) {
      return NextResponse.json({ error: limitMessage }, { status: 429 });
    }

    // Auth
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse body
    const body = await req.json();
    const { rawData } = body as { rawData: string };
    if (!rawData?.trim()) {
      return NextResponse.json({ error: "rawData is required" }, { status: 400 });
    }

    // Call Claude
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system:
        "You are an AI analyst for a nonprofit reporting tool. Extract all data points from the following raw data and return structured JSON only. No preamble. Format: { \"dataPoints\": [{\"id\": \"string\", \"label\": \"string\", \"value\": \"string\", \"category\": \"outcomes\"|\"volume\"|\"demographics\"|\"sector\"|\"benchmarks\"}], \"insights\": [\"string\"] }. Generate 3-5 actionable insights.",
      messages: [{ role: "user", content: rawData }],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      return NextResponse.json({ error: "Unexpected response" }, { status: 500 });
    }

    let parsed: unknown;
    try {
      let rawText = content.text.trim();
      const fenceMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (fenceMatch) rawText = fenceMatch[1].trim();
      parsed = JSON.parse(rawText);
    } catch {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Analyze route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
