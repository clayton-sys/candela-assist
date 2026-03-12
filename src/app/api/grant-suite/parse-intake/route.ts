import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const forwarded = req.headers.get("x-forwarded-for");
    const ip =
      (forwarded
        ? forwarded.split(",")[0].trim()
        : req.headers.get("x-real-ip")) ?? "unknown";

    const { limited, message: limitMessage } = await checkRateLimit(
      `parse:${ip}`
    );
    if (limited) {
      return NextResponse.json({ error: limitMessage }, { status: 429 });
    }

    const { pastedText } = await req.json();

    if (!pastedText?.trim()) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    if (pastedText.length > 10000) {
      return NextResponse.json(
        { error: "Pasted text must be under 10,000 characters." },
        { status: 400 }
      );
    }

    const systemPrompt =
      "You are a program intake specialist. Extract structured information from the text provided. Return ONLY valid JSON, no other text.";

    const userPrompt = `Extract these fields from the program description below. Return empty string if not found. For "vertical", match exactly one of: Workforce development, Affordable housing, Mental health & substance use, Early childhood education, Food security, Domestic violence services, Youth development, Immigrant & refugee services, General nonprofit services. Return empty string if none match.

{
  "programName": "",
  "orgName": "",
  "population": "",
  "vertical": "",
  "activities": "",
  "inputs": "",
  "outcomes": ""
}

Text: ${pastedText}`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
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

    // Strip markdown code fences if present
    let rawText = content.text.trim();
    const fenceMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      rawText = fenceMatch[1].trim();
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse extraction response" },
        { status: 500 }
      );
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Parse-intake error:", error);
    return NextResponse.json(
      { error: "Failed to parse text. Please try again." },
      { status: 500 }
    );
  }
}
