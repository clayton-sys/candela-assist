import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getDocumentType, DocumentTypeId } from "@/lib/documentTypes";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { documentTypeId, values } = body as {
      documentTypeId: DocumentTypeId;
      values: Record<string, string>;
    };

    if (!documentTypeId || !values) {
      return NextResponse.json(
        { error: "Missing documentTypeId or values" },
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

    const userMessage = docType.userPromptTemplate(values);

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
