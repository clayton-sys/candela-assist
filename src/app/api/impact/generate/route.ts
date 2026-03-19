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
    staff_dashboard: `Generate a complete HTML document for a Staff Dashboard.

Required sections:
- KPI cards in a grid layout with large numbers
- Progress bars for key metrics
- An AI insight panel at the bottom with key takeaways
- Header with org logo badge and a descriptive dashboard title (not the org name)
- Footer with org logo and 'Powered by Candela · candela.education'

Audience: program staff and managers. Make it data-rich and operational.
Font: Cormorant Garamond for headings, DM Sans for body.
Include all provided data points.`,

    funder_public: `Generate a complete HTML document for a Funder Narrative Report.

Required sections:
- Header with org logo badge and a descriptive report title (not the org name)
- Program outcome narrative section
- Quantitative metrics display
- Client voice / employer/partner quotes section
- Barriers and context section
- What changed / forward-looking section
- Footer with org logo and 'Powered by Candela · candela.education'

Audience: funders and community stakeholders. Make it compelling and credible.
Font: Cormorant Garamond for headings, DM Sans for body.`,

    embed_widget: `Generate a complete HTML document for a compact Website Embed Widget.

Required sections:
- Max width 400px, self-contained
- Top 3 metrics displayed prominently
- Progress bar for a key metric
- Branded footer

Audience: website visitors. Clean and minimal, suitable for embedding in any website.
Font: DM Sans throughout.`,

    board_deck: `Generate a complete HTML document for a Board Deck Slide.

Required sections:
- Single-page, print-ready layout (landscape feel)
- Key metrics in large, scannable format
- AI-generated talking points panel on the right side
- Header with org logo badge and a descriptive title (not the org name)
- Footer with org logo and 'Powered by Candela · candela.education'

Audience: board members and executives. Professional and executive-appropriate.
Font: Cormorant Garamond for headings, DM Sans for body.`,

    command_center: `You are generating a self-contained, single HTML file for the Impact Command Center view. This is the flagship interactive presentation view for live funder meetings. It must be fully interactive.

LAYOUT:
- Full dark canvas background
- Header bar: program name (left or center), green pulsing LIVE dot + period selector dropdown (right), Story Mode button (top right)
- If org logo is provided, display as a small badge in the header
- Main area: SVG constellation web centered on screen
- Footer: 'Click any node to explore · Story Mode for guided presentation' (left), 'Powered by Candela · candela.education' (right)

CONSTELLATION WEB:
- 1 large central hub node (120px diameter) showing the most impactful cumulative number (total participants, lives changed, etc.) with label
- 8 outer metric nodes (80px diameter) arranged in a circle around the hub, evenly spaced
- Each outer node shows: metric value (large, bold) and metric label (small)
- Animated dashed lines connecting each outer node to the center hub - use CSS animation to make them pulse
- Node ring: each node has a circular progress arc (SVG stroke-dasharray) showing progress toward target. Full ring = at/above target.
- Status-based node coloring: on track, watch/monitor, at risk
- All nodes pulse with a subtle glow animation on load

INTERACTIONS - every function MUST be defined in the script block:
- Clicking any outer node opens a detail card panel on the right side
- Detail card contains: metric name, current value vs target, status badge (On Track/Watch/At Risk), a mini sparkline chart (use inline SVG bars for 5 quarters of trend data), 4-metric breakdown list, and an AI talking point paragraph generated from the data
- Detail card has a close button
- Central hub click shows overall program summary card
- All click handlers (toggleNode, closeDetail, toggleStoryMode, changePeriod) MUST be defined as JavaScript functions in the <script> block

STORY MODE:
- Story Mode button in top right toggles Story Mode on/off
- In Story Mode: a bottom bar appears with Back/Next buttons, dot scrubbers (one per node), and a step counter
- Each step highlights one node with a bright ring and opens its detail card automatically
- User can exit Story Mode at any time by clicking the button again or clicking any node directly

PERIOD SELECTOR:
- Dropdown shows Q1, Q2, Q3, Q4, Annual
- Changing period updates all node values with a smooth CSS transition

TYPOGRAPHY:
- Headings and node labels: Cormorant Garamond (import from Google Fonts)
- Values, body, UI elements: DM Sans (import from Google Fonts)

Generate the complete HTML file with all CSS in a <style> block and all JavaScript in a single <script> block at the end. Every onclick/onchange handler referenced in the HTML MUST have a corresponding function defined in the script block.`,

    logic_model: `Generate a complete HTML document for a Logic Model table.

Required sections:
- Standard 5-column table: Inputs → Activities → Outputs → Outcomes → Impact
- Derive content from the data points provided, mapping them to appropriate columns
- Arrow connectors between columns
- Footer with 'Powered by Candela · candela.education'

Audience: grant reviewers. Clean, professional, suitable for grant applications.
Font: DM Sans throughout.`,
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
          `You are an expert HTML/CSS designer for nonprofit impact reporting.`,
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
          max_tokens: viewType === "command_center" ? 16384 : 8192,
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
