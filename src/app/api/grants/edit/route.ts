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
    const { limited, message: limitMessage } = await checkRateLimit(`grs-edit:${ip}`);
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
    const { viewHtml, instruction, viewType } = body as {
      viewHtml: string;
      instruction: string;
      viewType: string;
    };

    if (!viewHtml || !instruction?.trim()) {
      return NextResponse.json(
        { error: "viewHtml and instruction are required" },
        { status: 400 }
      );
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      system:
        "Make only the following change and return the complete updated HTML. No explanation, no markdown, no code fences. Return only the HTML.",
      messages: [
        {
          role: "user",
          content: `View type: ${viewType}\n\nInstruction: ${instruction}\n\nCurrent HTML:\n${viewHtml}`,
        },
      ],
    });

    const content = message.content[0];
    let html = content.type === "text" ? content.text.trim() : "";
    const fenceMatch = html.match(/```(?:html)?\s*([\s\S]*?)```/);
    if (fenceMatch) html = fenceMatch[1].trim();

    return NextResponse.json({ html });
  } catch (error) {
    console.error("Edit route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
