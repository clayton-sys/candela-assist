// SECURITY CHECKLIST
// [x] Auth: requireAuth() called
// [x] Org: requireOrgMember() called
// [x] Rate limit: Upstash applied — per org per hour
// [x] Input: Zod schema (max 10,000 chars, plus org_id UUID)
// [x] Response: no raw DB rows

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { PARSE_DATA_SYSTEM, PARSE_DATA_USER } from "@/lib/prompts/parse-data";

export const dynamic = "force-dynamic";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const InputSchema = z.object({
  raw_text: z.string().min(20, "Paste at least 20 characters").max(10000, "Maximum 10,000 characters"),
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

    // ── Rate limit: Upstash (per org, 10 per hour) ──────────────
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (url && token) {
      const { Redis } = await import("@upstash/redis");
      const { Ratelimit } = await import("@upstash/ratelimit");

      const redis = new Redis({ url, token });
      const limiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "1 h"),
        prefix: "rl:onboard-parse-data",
      });

      const { success } = await limiter.limit(`onboard-parse-data:${org_id}`);
      if (!success) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Try again in a little while." },
          { status: 429 }
        );
      }
    }

    // ── Fetch existing programs + metrics from DB ────────────────
    const { data: programs } = await supabase
      .from("programs")
      .select("id, name, program_metrics(id, metric_name, unit)")
      .eq("org_id", org_id)
      .eq("is_archived", false)
      .order("display_order", { ascending: true });

    if (!programs || programs.length === 0) {
      return NextResponse.json(
        { error: "No programs found. Complete org setup first." },
        { status: 400 }
      );
    }

    // Build the programs context for the AI
    const programsJson = JSON.stringify(
      programs.map((p) => ({
        program_id: p.id,
        name: p.name,
        metrics: (p.program_metrics ?? []).map((m: { id: string; metric_name: string; unit: string | null }) => ({
          metric_id: m.id,
          metric_name: m.metric_name,
          unit: m.unit,
        })),
      })),
      null,
      2
    );

    // ── AI extraction (single Haiku call) ────────────────────────
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      system: PARSE_DATA_SYSTEM,
      messages: [{ role: "user", content: PARSE_DATA_USER(programsJson, raw_text) }],
    });

    const content = message.content[0];
    const responseText = content.type === "text" ? content.text.trim() : "";

    // Strip markdown fences if present
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
        "[parse-data] JSON parse failed. Raw output (first 500):",
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
    console.error("[parse-data] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
