import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface DataPoint {
  id: string;
  label: string;
  value: string;
  category: string;
}

const VIEW_PROMPTS: Record<string, string> = {
  staff_dashboard: `Generate a complete HTML document for a Staff Dashboard. Use a dense operational layout with:
- Solar Gold (#E9C03A) progress bars
- KPI cards in a grid layout with large numbers
- An AI insight panel at the bottom with key takeaways
- Use Midnight Ink (#1B2B3A) for headers, Warm Stone (#EDE8DE) for backgrounds
- Font: DM Sans for body text, Cormorant Garamond for headings
Make it data-rich and operational. Include all provided data points.`,

  funder_public: `Generate a complete HTML document for a Funder Public View. Use:
- Dark Midnight Ink (#1B2B3A) background throughout
- Outcome cards with Warm Stone (#EDE8DE) text
- A theory of change narrative section
- Editorial, magazine-style feel with generous whitespace
- Solar Gold (#E9C03A) accents for highlights and dividers
- Font: Cormorant Garamond for headings, DM Sans for body
Make it compelling for funders and stakeholders.`,

  embed_widget: `Generate a complete HTML document for a compact Website Embed Widget. Requirements:
- Max width 400px, self-contained
- Show top 3 metrics prominently
- Include a Solar Gold (#E9C03A) progress bar
- Branded footer with Cerulean (#3A6B8A) accent
- Midnight Ink (#1B2B3A) header area
- Font: DM Sans throughout
- Clean, minimal design suitable for embedding in any website`,

  board_deck: `Generate a complete HTML document for a Board Deck Slide. Requirements:
- Single-page, print-ready layout (landscape feel)
- Key metrics in large, scannable format
- AI-generated talking points panel on the right side
- Clean grid layout with Midnight Ink (#1B2B3A) headers
- Solar Gold (#E9C03A) accent elements
- Font: Cormorant Garamond for headings, DM Sans for body
- Professional and executive-appropriate`,

  command_center: `You are generating a self-contained, single HTML file for the Funder Command Center view. This is the flagship interactive presentation view for live funder meetings. It must be visually stunning and fully interactive.

DESIGN REQUIREMENTS - follow exactly:

LAYOUT:
- Full dark canvas background: #1B2B3A (Midnight Ink)
- Header bar: org name (left), program name (center), green pulsing LIVE dot + period selector dropdown (right), Story Mode button (top right)
- Main area: SVG constellation web centered on screen
- Footer: 'Click any node to explore · Story Mode for guided presentation' (left), 'Powered by Candela Grants & Reporting Suite · candela.education' (right)

CONSTELLATION WEB:
- 1 large central hub node (120px diameter) in Solar Gold (#E9C03A) showing the most impactful cumulative number (total participants, lives changed, etc.) with label 'LIVES CHANGED' or equivalent
- 8 outer metric nodes (80px diameter) arranged in a circle around the hub, evenly spaced
- Each outer node shows: metric value (large, bold, DM Sans), metric label (small, Cormorant Garamond)
- Animated dashed lines connecting each outer node to the center hub - use CSS animation to make them pulse
- Node ring: each node has a circular progress arc (SVG stroke-dasharray) showing progress toward target. Full ring = at/above target.
- Node colors: #3A6B8A (Cerulean) = on track, #E9C03A (Solar Gold) = watch/monitor, #E05A2B = at risk
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
- Node values: 28px bold white
- Node labels: 11px uppercase letter-spaced, #EDE8DE (Warm Stone)

COLORS - use ONLY these:
- #1B2B3A Midnight Ink (background)
- #E9C03A Solar Gold (hub, highlights, Story Mode button)
- #EDE8DE Warm Stone (secondary text)
- #3A6B8A Cerulean (on-track nodes, lines)
- #E05A2B (at-risk nodes)
- White (#FFFFFF) for primary values

Generate the complete HTML file with all CSS in a <style> block and all JavaScript in a single <script> block at the end. Every onclick/onchange handler referenced in the HTML MUST have a corresponding function defined in the script block.`,

  logic_model: `Generate a complete HTML document for a Logic Model table. Requirements:
- Standard 5-column table: Inputs → Activities → Outputs → Outcomes → Impact
- Derive content from the data points provided, mapping them to appropriate columns
- Use Midnight Ink (#1B2B3A) column headers
- Alternating subtle row backgrounds using Warm Stone (#EDE8DE)
- Solar Gold (#E9C03A) arrow connectors between columns
- Font: DM Sans throughout
- Clean, professional, suitable for grant applications`,
};

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

    // Parse body
    const body = await req.json();
    const { dataPoints, selectedViews, theme, layout } = body as {
      dataPoints: DataPoint[];
      selectedViews: string[];
      theme?: string;
      layout?: string;
    };

    if (!dataPoints?.length || !selectedViews?.length) {
      return NextResponse.json(
        { error: "dataPoints and selectedViews are required" },
        { status: 400 }
      );
    }

    const dataContext = dataPoints
      .map((dp) => `- ${dp.label}: ${dp.value} (${dp.category})`)
      .join("\n");

    // Resolve theme/layout for system prompt
    const activeTheme = theme || "candela_classic";
    const activeLayout = layout || "constellation";
    const themeDirective = `Use the '${activeTheme}' theme with '${activeLayout}' layout. Adapt the visual style accordingly.`;

    // Generate each view in parallel
    const results = await Promise.all(
      selectedViews.map(async (viewType) => {
        const prompt = VIEW_PROMPTS[viewType];
        if (!prompt) return { viewType, html: `<p>Unknown view type: ${viewType}</p>` };

        const message = await client.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: viewType === "command_center" ? 16384 : 8192,
          system:
            `You are an expert HTML/CSS designer for nonprofit reporting tools. ${themeDirective} Return ONLY the complete HTML document. No markdown, no explanation, no code fences. Start with <!DOCTYPE html> or <div>.`,
          messages: [
            {
              role: "user",
              content: `${prompt}\n\nData Points:\n${dataContext}`,
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
