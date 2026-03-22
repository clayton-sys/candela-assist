// SECURITY CHECKLIST
// [x] Auth: requireAuth() called first
// [x] Org: requireOrgMember() called
// [x] Rate limit: Upstash applied (parse-org, 10 requests per org per hour)
// [x] Input: Zod schema validated
// [x] Response: no raw DB rows exposed

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { PARSE_ORG_SYSTEM, PARSE_ORG_USER } from "@/lib/prompts/parse-org";

export const dynamic = "force-dynamic";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const InputSchema = z.object({
  raw_text: z.string().min(50).max(15000),
  org_id: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    // ── Auth: requireAuth() ──────────────────────────────────────
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Input: Zod validation ────────────────────────────────────
    const body = await req.json();
    const parsed = InputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { raw_text, org_id } = parsed.data;

    // ── Org: requireOrgMember() ──────────────────────────────────
    const { data: membership } = await supabase
      .from("org_users")
      .select("id")
      .eq("org_id", org_id)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ── Rate limit: Upstash (parse-org, 10 per org per hour) ────
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (url && token) {
      const { Redis } = await import("@upstash/redis");
      const { Ratelimit } = await import("@upstash/ratelimit");

      const redis = new Redis({ url, token });
      const limiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "1 h"),
        prefix: "rl:parse-org",
      });

      const { success } = await limiter.limit(`parse-org:${org_id}`);
      if (!success) {
        return NextResponse.json(
          { error: "Rate limit exceeded. 10 parse requests per org per hour." },
          { status: 429 }
        );
      }
    }

    // ── AI extraction (single Haiku call) ────────────────────────
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      system: PARSE_ORG_SYSTEM,
      messages: [{ role: "user", content: PARSE_ORG_USER(raw_text) }],
    });

    const content = message.content[0];
    const responseText = content.type === "text" ? content.text.trim() : "";

    // Strip markdown fences if Haiku wraps them anyway
    const cleaned = responseText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    let result;
    try {
      result = JSON.parse(cleaned);
    } catch {
      console.error(
        "[parse-org] JSON parse failed. Raw output (first 500):",
        cleaned.slice(0, 500)
      );
      return NextResponse.json(
        { error: "AI returned invalid JSON. Please try again." },
        { status: 502 }
      );
    }

    // ── Response: parsed JSON for user review (no DB save) ───────
    return NextResponse.json({ parsed: result });
  } catch (err) {
    console.error("[parse-org] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
