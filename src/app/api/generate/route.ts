import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getDocumentType, DocumentTypeId } from "@/lib/documentTypes";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
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

    const docType = getDocumentType(documentTypeId);
    if (!docType) {
      return NextResponse.json(
        { error: "Unknown document type" },
        { status: 400 }
      );
    }

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
    console.error("Generate API error:", error);
    return NextResponse.json(
      { error: "Failed to generate draft. Please try again." },
      { status: 500 }
    );
  }
}
