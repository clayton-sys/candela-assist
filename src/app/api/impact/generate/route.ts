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

function buildBrandDirective(b: BrandKit, useBrandColors: boolean): string {
  const lines: string[] = [];

  if (useBrandColors) {
    // User explicitly chose brand-kit color scheme
    lines.push(`ORG BRAND COLORS — use these as the color palette:`);
    lines.push(`- Primary: ${b.brand_primary}`);
    lines.push(`- Accent: ${b.brand_accent}`);
    lines.push(`- Success: ${b.brand_success}`);
    lines.push(`- Text on dark: ${b.brand_text}`);
  }
  // When useBrandColors is false, no color directives — theme's own colors apply

  // Org identity — for attribution/footer only, never for view titles
  if (b.org_display_name) {
    lines.push(`- Organization name (use ONLY in footer or attribution, never as a view title or heading): ${b.org_display_name}`);
  }
  if (b.logo_url) {
    lines.push(`- Logo URL (use in footer or small header badge, not as main heading): <img src="${b.logo_url}" alt="org logo" style="max-height:36px">`);
  }
  if (b.custom_center_text) {
    lines.push(`- Custom center text (for Command Center hub node only): ${b.custom_center_text}`);
  }
  if (b.remove_candela_footer) {
    lines.push(`- Do NOT include any "Powered by Candela" footer or branding.`);
  } else {
    lines.push(`- Include 'Powered by Candela · candela.education' in the footer.`);
  }
  return lines.join("\n");
}

function viewPrompts(): Record<string, string> {
  return {
    staff_dashboard: `Generate a complete HTML document for a Staff Dashboard. Use a dense operational layout with:
- Progress bars using the accent color
- KPI cards in a grid layout with large numbers
- An AI insight panel at the bottom with key takeaways
- Use the primary color for headers, text color for contrast
- Font: DM Sans for body text, Cormorant Garamond for headings
- The view title should describe the data (e.g. "Staff Dashboard" or the program name), NOT the org name
Make it data-rich and operational. Include all provided data points.`,

    funder_public: `Generate a complete HTML document for a Funder Public View. Use:
- Dark primary-color background throughout
- Outcome cards with light text
- A theory of change narrative section
- Editorial, magazine-style feel with generous whitespace
- Accent color for highlights and dividers
- Font: Cormorant Garamond for headings, DM Sans for body
- The view title should describe the content (e.g. "Impact Report" or program name), NOT the org name
Make it compelling for funders and stakeholders.`,

    embed_widget: `Generate a complete HTML document for a compact Website Embed Widget. Requirements:
- Max width 400px, self-contained
- Show top 3 metrics prominently
- Include a progress bar using the accent color
- Branded footer with success color accent
- Primary color header area
- Font: DM Sans throughout
- Clean, minimal design suitable for embedding in any website`,

    board_deck: `Generate a complete HTML document for a Board Deck Slide. Requirements:
- Single-page, print-ready layout (landscape feel)
- Key metrics in large, scannable format
- AI-generated talking points panel on the right side
- Clean grid layout with primary color headers
- Accent color elements
- Font: Cormorant Garamond for headings, DM Sans for body
- Professional and executive-appropriate
- The view title should describe the content (e.g. "Board Report" or program name), NOT the org name`,

    command_center: `You are generating a self-contained, single HTML file for the Impact Command Center view. This is the flagship interactive presentation view for live funder meetings. It must be visually stunning and fully interactive.

DESIGN REQUIREMENTS - follow exactly:

LAYOUT:
- Full dark canvas background using primary color
- Header bar: program name (left or center), green pulsing LIVE dot + period selector dropdown (right), Story Mode button (top right)
- If org logo is provided in brand data, display it as a small badge in the header — not as main title
- Main area: SVG constellation web centered on screen
- Footer: 'Click any node to explore · Story Mode for guided presentation' (left), org attribution or Candela footer (right, per brand settings)

CONSTELLATION WEB:
- 1 large central hub node (120px diameter) in accent color showing the most impactful cumulative number (total participants, lives changed, etc.) with label from custom_center_text if provided, otherwise 'LIVES CHANGED' or equivalent
- 8 outer metric nodes (80px diameter) arranged in a circle around the hub, evenly spaced
- Each outer node shows: metric value (large, bold, DM Sans), metric label (small, Cormorant Garamond)
- Animated dashed lines connecting each outer node to the center hub - use CSS animation to make them pulse
- Node ring: each node has a circular progress arc (SVG stroke-dasharray) showing progress toward target. Full ring = at/above target.
- Node colors: success color = on track, accent color = watch/monitor, #E05A2B = at risk
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
- Node labels: 11px uppercase letter-spaced

Use the brand colors provided in the system prompt for all color values (if any). Otherwise use colors appropriate to the theme.

Generate the complete HTML file with all CSS in a <style> block and all JavaScript in a single <script> block at the end. Every onclick/onchange handler referenced in the HTML MUST have a corresponding function defined in the script block.`,

    logic_model: `Generate a complete HTML document for a Logic Model table. Requirements:
- Standard 5-column table: Inputs → Activities → Outputs → Outcomes → Impact
- Derive content from the data points provided, mapping them to appropriate columns
- Primary color for column headers
- Alternating subtle row backgrounds
- Accent color arrow connectors between columns
- Font: DM Sans throughout
- Clean, professional, suitable for grant applications`,
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
    const { dataPoints, selectedViews, theme, theme_id, colorScheme, layout } = body as {
      dataPoints: DataPoint[];
      selectedViews: string[];
      theme?: string;
      theme_id?: string;
      colorScheme?: string;
      layout?: string;
    };

    if (!dataPoints?.length || !selectedViews?.length) {
      return NextResponse.json(
        { error: "dataPoints and selectedViews are required" },
        { status: 400 }
      );
    }

    // Only use brand kit colors if user explicitly chose "brand-kit" color scheme
    const useBrandColors = colorScheme === "brand-kit";
    const brandDirective = buildBrandDirective(brand, useBrandColors);
    const prompts = viewPrompts();

    const dataContext = dataPoints
      .map((dp) => `- ${dp.label}: ${dp.value} (${dp.category})`)
      .join("\n");

    // Resolve theme instructions
    const resolvedThemeId = theme_id ?? theme ?? "candela-classic";
    const themeInstructions = getThemeInstructions(resolvedThemeId);

    // Generate each view in parallel
    const results = await Promise.all(
      selectedViews.map(async (viewType) => {
        const prompt = prompts[viewType];
        if (!prompt) return { viewType, html: `<p>Unknown view type: ${viewType}</p>` };

        const themeBlock = useBrandColors
          ? `\n\n--- VISUAL THEME ---\n${themeInstructions}\n\nApply this visual theme for layout structure, typography, and visual density. Use the brand kit colors above as the color palette.`
          : `\n\n--- VISUAL THEME ---\n${themeInstructions}\n\nApply this visual theme fully — use colors, layout, and density as the theme describes. Choose colors that match the theme's aesthetic.`;

        const message = await client.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: viewType === "command_center" ? 16384 : 8192,
          system:
            `You are an expert HTML/CSS designer for nonprofit reporting tools.\n\n${brandDirective}\n\nIMPORTANT: The view title and headings should describe the content or program — never use the organization name as the view title.\n\nReturn ONLY the complete HTML document. No markdown, no explanation, no code fences. Start with <!DOCTYPE html> or <div>.`,
          messages: [
            {
              role: "user",
              content: `${prompt}\n\nData Points:\n${dataContext}${themeBlock}`,
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
