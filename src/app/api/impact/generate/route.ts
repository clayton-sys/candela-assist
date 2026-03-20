import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/ratelimit";
import { getThemeInstructions } from "@/lib/themes";

export const dynamic = "force-dynamic";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface DataPoint {
  id: string;
  label: string;
  value: string;
  category: string;
}

interface BrandKit {
  org_display_name: string | null;
  custom_center_text: string | null;
  logo_url: string | null;
  brand_primary: string;
  brand_accent: string;
  brand_success: string;
  brand_text: string;
  remove_candela_footer: boolean;
}

const DEFAULT_BRAND: BrandKit = {
  org_display_name: null,
  custom_center_text: null,
  logo_url: null,
  brand_primary: "#1B2B3A",
  brand_accent: "#E9C03A",
  brand_success: "#3A6B8A",
  brand_text: "#EDE8DE",
  remove_candela_footer: false,
};

function buildColorDirective(
  primary: string,
  accent: string,
  b: BrandKit
): string {
  const lines = [
    `COLOR PALETTE — use these colors for all styling. The theme above defines HOW they are applied:`,
    `- Primary / background: ${primary}`,
    `- Accent / highlight: ${accent}`,
    `- Success / on-track: ${b.brand_success}`,
    `- Text on primary: ${b.brand_text}`,
  ];
  return lines.join("\n");
}

function buildIdentityDirective(b: BrandKit): string {
  const lines: string[] = [];
  if (b.org_display_name) {
    lines.push(`- Organization name (use ONLY in footer or attribution, never as a view title): ${b.org_display_name}`);
  }
  if (b.logo_url) {
    lines.push(`- Logo URL (use in footer or small header badge): <img src="${b.logo_url}" alt="org logo" style="max-height:36px">`);
  }
  if (b.custom_center_text) {
    lines.push(`- Custom center text (for Command Center hub node only): ${b.custom_center_text}`);
  }
  if (b.remove_candela_footer) {
    lines.push(`- Do NOT include any "Powered by Candela" footer or branding.`);
  } else {
    lines.push(`- Include 'Powered by Candela · candela.education' in the footer.`);
  }
  lines.push(`- View title must describe the content, never the org name.`);
  return lines.join("\n");
}

function viewPrompts(): Record<string, string> {
  return {
    impact_snapshot: `Generate a single-viewport impact summary page. Required sections: header with org logo badge and report title, hero stat with bold typography, program card grid showing outcomes per program, client voice quote, closing agency narrative. Audience: board members, community stakeholders, quick-read funders. Font: Cormorant Garamond for headings, DM Sans for body.`,

    funder_narrative: `Generate a longform funder report. Required sections: header with org logo badge and descriptive report title, agency narrative introduction, per-program sections each containing outcome narrative, quantitative metrics display, client voice quote, barriers and context, what changed and forward-looking notes, closing statement, footer with attribution. Audience: funders and community stakeholders. Font: Cormorant Garamond for headings, DM Sans for body.`,

    website_embed: `Generate an embeddable widget. Required sections: 3 featured stat cards, rotating client quote cycling every 6 seconds, small footer with org attribution. Must fit a standard website sidebar at 400px width. No header. Audience: website visitors. Font: Cormorant Garamond for headings, DM Sans for body.`,

    program_profile: `Generate a single-program profile card. Required sections: program name, one large centered headline stat, short AI-drafted narrative paragraph (2-3 sentences), client voice quote, small footer with org attribution. Portrait orientation. Audience: donors, social media, event materials. Font: Cormorant Garamond for headings, DM Sans for body.`,

    impact_command_center: `Generate an interactive impact dashboard. Required sections: agency header with logo, program navigation showing all programs by name, per-program detail panel with metrics, outcomes narrative, and client voice quote, period label. Include a toggle to view all programs side by side. Full dark canvas layout. Audience: leadership, board, sophisticated funders. Font: Cormorant Garamond for headings, DM Sans for body.`,

    story_view: `Generate a scrollytelling impact narrative. Required sections: full-viewport opening with agency name and period, per-program sequence sections each with program name, description, key metrics with count-up animation, and client voice quote, closing agency outcomes section. Each section should be 100vh. Audience: donors, community, gala attendees. Font: Cormorant Garamond for headings, DM Sans for body.`,
  };
}

export async function POST(req: NextRequest) {
  try {
    // Rate limit
    const forwarded = req.headers.get("x-forwarded-for");
    const ip =
      (forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip")) ?? "unknown";
    const { limited, message: limitMessage } = await checkRateLimit(`grs-generate:${ip}`);
    if (limited) {
      return NextResponse.json({ error: limitMessage }, { status: 429 });
    }

    // Auth
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch brand kit for the user's org
    const { data: orgUser } = await supabase
      .from("org_users")
      .select("org_id")
      .eq("user_id", user.id)
      .single();

    let brand: BrandKit = { ...DEFAULT_BRAND };
    if (orgUser?.org_id) {
      const { data: brandKit } = await supabase
        .from("brand_kits")
        .select("org_display_name, custom_center_text, logo_url, brand_primary, brand_accent, brand_success, brand_text, remove_candela_footer")
        .eq("org_id", orgUser.org_id)
        .single();

      if (brandKit) {
        brand = {
          org_display_name: brandKit.org_display_name ?? DEFAULT_BRAND.org_display_name,
          custom_center_text: brandKit.custom_center_text ?? DEFAULT_BRAND.custom_center_text,
          logo_url: brandKit.logo_url ?? DEFAULT_BRAND.logo_url,
          brand_primary: brandKit.brand_primary ?? DEFAULT_BRAND.brand_primary,
          brand_accent: brandKit.brand_accent ?? DEFAULT_BRAND.brand_accent,
          brand_success: brandKit.brand_success ?? DEFAULT_BRAND.brand_success,
          brand_text: brandKit.brand_text ?? DEFAULT_BRAND.brand_text,
          remove_candela_footer: brandKit.remove_candela_footer ?? DEFAULT_BRAND.remove_candela_footer,
        };
      }
    }

    // Parse body
    const body = await req.json();
    const {
      dataPoints,
      selectedViews,
      theme,
      theme_id,
      resolvedPrimary,
      resolvedAccent,
      layout,
    } = body as {
      dataPoints: DataPoint[];
      selectedViews: string[];
      theme?: string;
      theme_id?: string;
      resolvedPrimary?: string;
      resolvedAccent?: string;
      layout?: string;
    };

    // Use resolved colors from client if provided, otherwise fall back to brand kit
    const primary = resolvedPrimary ?? brand.brand_primary;
    const accent = resolvedAccent ?? brand.brand_accent;

    const colorDirective = buildColorDirective(primary, accent, brand);
    const identityDirective = buildIdentityDirective(brand);
    const prompts = viewPrompts();

    if (!dataPoints?.length || !selectedViews?.length) {
      return NextResponse.json(
        { error: "dataPoints and selectedViews are required" },
        { status: 400 }
      );
    }

    const dataContext = dataPoints
      .map((dp) => `- ${dp.label}: ${dp.value} (${dp.category})`)
      .join("\n");

    // Resolve theme instructions
    const themeInstructions = getThemeInstructions(theme_id ?? theme ?? "candela-classic");

    // Generate each view in parallel
    const results = await Promise.all(
      selectedViews.map(async (viewType) => {
        const prompt = prompts[viewType];
        if (!prompt) return { viewType, html: `<p>Unknown view type: ${viewType}</p>` };

        const systemPrompt = [
          `You are a senior visual designer and creative director at an award-winning data storytelling studio. Your work has been recognized by the Information is Beautiful Awards. You think in systems — every typographic choice, every use of whitespace, every color decision is intentional and serves the narrative. You know that restraint is a design tool. You treat each output as a gallery-quality artifact, not a template. Your HTML and CSS is clean, semantic, and precise. You are generating a visual output for a nonprofit — the data inside is real, the people it represents matter, and the design should honor that weight.`,
          ``,
          `VISUAL THEME — this governs all layout, typography, section transitions, and visual density. It is not a suggestion. Every structural and aesthetic decision must express this theme:\n${themeInstructions}`,
          ``,
          colorDirective,
          ``,
          identityDirective,
          ``,
          `Return ONLY the complete HTML document. No markdown, no explanation, no code fences. Start with <!DOCTYPE html>.`,
        ].join("\n");
        const userPrompt = `${prompt}\n\nData Points:\n${dataContext}`;

        const message = await client.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: (viewType === "impact_command_center" || viewType === "story_view") ? 16384 : 8192,
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content: userPrompt,
            },
          ],
        });

        const content = message.content[0];
        let html = content.type === "text" ? content.text.trim() : "";
        // Strip code fences if present
        const fenceMatch = html.match(/```(?:html)?\s*([\s\S]*?)```/);
        if (fenceMatch) html = fenceMatch[1].trim();

        return { viewType, html };
      })
    );

    const outputs: Record<string, string> = {};
    for (const r of results) {
      outputs[r.viewType] = r.html;
    }

    return NextResponse.json({ outputs });
  } catch (error) {
    console.error("Generate route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
