import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getDocumentType, DocumentTypeId } from "@/lib/documentTypes";
import {
  checkRateLimit,
  MAX_RAW_INPUT_CHARS,
  MAX_FIELD_CHARS,
} from "@/lib/ratelimit";

// Always dynamic — reads request headers (IP) and calls external APIs
export const dynamic = "force-dynamic";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    // ── Rate limiting ──────────────────────────────────────────────────────
    const forwarded = req.headers.get("x-forwarded-for");
    const ip =
      (forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip")) ??
      "unknown";

    const { limited, message: limitMessage } = await checkRateLimit(ip);
    if (limited) {
      return NextResponse.json({ error: limitMessage }, { status: 429 });
    }

    // ── Parse body ─────────────────────────────────────────────────────────
    const body = await req.json();
    const {
      mode = "structured",
      documentTypeId,
      values,
      rawInput,
    } = body as {
      mode?: "structured" | "raw";
      documentTypeId: DocumentTypeId;
      values?: Record<string, string>;
      rawInput?: string;
    };

    if (!documentTypeId) {
      return NextResponse.json(
        { error: "Missing documentTypeId" },
        { status: 400 }
      );
    }

    if (mode === "raw" && !rawInput?.trim()) {
      return NextResponse.json(
        { error: "Missing rawInput for raw mode" },
        { status: 400 }
      );
    }

    if (mode === "structured" && !values) {
      return NextResponse.json(
        { error: "Missing values for structured mode" },
        { status: 400 }
      );
    }

    // ── Input length validation ────────────────────────────────────────────
    if (mode === "raw" && rawInput && rawInput.length > MAX_RAW_INPUT_CHARS) {
      return NextResponse.json(
        {
          error: `Input is too long. Please keep dictation or pasted notes under ${MAX_RAW_INPUT_CHARS.toLocaleString()} characters.`,
        },
        { status: 400 }
      );
    }

    if (mode === "structured" && values) {
      const overLimit = Object.values(values).some(
        (v) => typeof v === "string" && v.length > MAX_FIELD_CHARS
      );
      if (overLimit) {
        return NextResponse.json(
          {
            error: `Each field is limited to ${MAX_FIELD_CHARS.toLocaleString()} characters. Please shorten your responses and try again.`,
          },
          { status: 400 }
        );
      }
    }

    // ── Look up document type ──────────────────────────────────────────────
    const docType = getDocumentType(documentTypeId);
    if (!docType) {
      return NextResponse.json(
        { error: "Unknown document type" },
        { status: 400 }
      );
    }

    // ── Build prompt and call Claude ───────────────────────────────────────
    const userMessage =
      mode === "raw"
        ? `The following are a case manager's raw notes from a client interaction. Extract the key information and produce a professional ${docType.title}.\n\nRaw notes:\n${rawInput}`
        : docType.userPromptTemplate(values!);

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: docType.systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      return NextResponse.json(
        { error: "Unexpected response type from Claude" },
        { status: 500 }
      );
    }

    return NextResponse.json({ draft: content.text });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Generate API error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
