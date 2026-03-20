import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/ratelimit";
import { getThemeInstructions } from "@/lib/themes";
import { assembleImpactPayload } from "@/lib/impact/assemblePayload";
import type { ImpactPayload } from "@/lib/types/impact-payload";

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
    impact_snapshot: `AUDIENCE: Funders, donors, board members. Context: email attachment, printed leave-behind, quick share link. Job: communicate what the org accomplished in under 90 seconds.

REQUIRED STRUCTURE — render these sections in this order, nothing else:
1. HEADER — org logo (if present) top-left. Period label top-right. No large title.
2. HERO STAT — the featured metric (first metric where is_featured=true, else programs[0].metrics[0]). Number at 140px–180px Cormorant Garamond. Label in 11px uppercase DM Sans below. No box or border around it.
3. HERO QUOTE — programs[0].client_voice[0] if present. Full-bleed left-border treatment. Solar Gold (#E9C03A) left border 4px. Quote at 1.6rem italic Cormorant Garamond. Attribution 11px uppercase DM Sans.
4. PROGRAM GRID — one card per program in programs[]. Each card: program name (Cormorant Garamond 22px), one outcome sentence (DM Sans 14px, from outcomes[0]), one metric value + label. Cards must vary in size — use CSS Grid, mix one 2-column-span feature card with single-column supporting cards. Never equal heights — use min-height, let content expand.
5. FOOTER — org mission small DM Sans. "Powered by Candela · candela.education" unless suppressed.

RULES: Single viewport — no scrolling. Everything visible at once. PDF export intent — no JavaScript. CSS Grid with named template areas. Background: Midnight Ink (#1B2B3A). Text: Warm Stone (#EDE8DE). Accent: Solar Gold (#E9C03A).`,

    funder_narrative: `AUDIENCE: Grant funders. Context: formal document, sent as PDF or shared as a link. Job: tell the full program story in funder language — outcomes, barriers, what changed.

REQUIRED STRUCTURE — render these sections in this order:
1. COVER — org name in Cormorant Garamond display size. Report period. Logo if present. One-line mission statement. Cerulean (#3A6B8A) accent line beneath org name.
2. AGENCY NARRATIVE — 2–3 paragraphs AI-generated from org.mission + program descriptions. Theory of change, population served, overall approach. Prose only — no bullet points.
3. PER-PROGRAM SECTIONS — one section per item in programs[]. Each contains in this order: program name as section header (Cormorant Garamond 32px), outcomes narrative paragraph (prose synthesized from outcomes array — not a bulleted list), 2–3 metric callout cards inline (value large, label small, background color variation only — no borders), barriers paragraph (from barriers array), client voice pull quote (Solar Gold left border 4px, full bleed treatment, quote at 1.6rem), what changed paragraph (from change_description). Cerulean horizontal rule between program sections.
4. CLOSING — aggregate outcomes summary sentence. One forward-looking sentence. Org logo small.
5. FOOTER — "Powered by Candela · candela.education" unless suppressed.

RULES: Scrollable long-form document. Warm Stone (#EDE8DE) background for print-friendliness. Max-width 800px centered. Line height 1.8 for all body text. No JavaScript.`,

    website_embed: `AUDIENCE: General public, website visitors. Context: iframe embed on org's own website, always visible. Job: show measurable work to anyone landing on the site.

REQUIRED STRUCTURE:
1. STAT BAR — exactly 3 metrics from programs[0].metrics (featured first, then by display_order). Each stat: large number (Cormorant Garamond 64px), label (DM Sans 12px uppercase), subtle progress bar toward target if target is not null.
2. ROTATING QUOTE — one client quote displayed at a time from programs[0].client_voice, cycling every 6 seconds via JavaScript setInterval. CSS opacity fade transition between quotes. Show first quote immediately on load.
3. FOOTER — org logo small left if present. "Powered by Candela · candela.education" right. 11px DM Sans.

RULES: Fixed width 400px. No header. Uses org.brand_colors from payload — NOT Candela brand colors. If brand_colors fields are null, fall back to Midnight Ink (#1B2B3A) background and Solar Gold (#E9C03A) accent. Must function as a standalone iframe. JavaScript allowed for quote rotation only.`,

    program_profile: `AUDIENCE: Funders, donors, general public. Context: shareable link, PDF, printed handout. Job: one program, one number that stops you, then you keep reading.

REQUIRED STRUCTURE — portrait orientation, single program (use programs[0]):
1. PROGRAM NAME — Cormorant Garamond large. Top of page. Not full-bleed.
2. HERO STAT — featured metric value. Enormous, centered. 160px–200px Cormorant Garamond. The number dominates the top third of the page. Short label beneath in 12px uppercase DM Sans.
3. NARRATIVE — 3–5 sentence paragraph AI-generated from programs[0].description + programs[0].outcomes. What the number means in human terms. DM Sans 16px, line height 1.8. Never fabricate — if outcomes is empty array, show ⚠ flag instead of narrative.
4. CLIENT QUOTE — if programs[0].client_voice is not empty. Large opening quote mark (4rem+ Cormorant Garamond in accent color). Quote text 1.6rem. Attribution 11px uppercase.
5. FOOTER — org logo. Period label. "Powered by Candela · candela.education" unless suppressed.

RULES: Clean, minimal, print-ready. Light background. No JavaScript. Should look designed, not generated.`,

    impact_command_center: `AUDIENCE: Funders, board members. Context: live meeting, pulled up on a laptop during a conversation. Job: walk a funder through the full program landscape without a deck.

REQUIRED STRUCTURE — three interactive levels:
LEVEL 1 (default view): D3.js force simulation constellation on a dark canvas. Each program node is an SVG <circle> (60px radius) displaying program name as an SVG <text> element centered with dominant-baseline: middle and text-anchor: middle. Nodes connect to a central hub circle with lines. Hover on a node: expand radius to 72px, show one-line description from programs[n].description in a tooltip div. Period selector dropdown top-right corner.
LEVEL 2 (click a node): Clicked node populates a detail panel covering most of the screen. Other nodes dim to 30% opacity. Detail panel contains: program name header, metrics grid (value large + label small + target if present — min-height on cards, never fixed height), outcomes paragraph, client voice pull quote. "← Back to all programs" button top-left. Clicking back restores Level 1.
LEVEL 3 (toggle): "See all programs" button switches to side-by-side card grid showing all programs for selected period. Same ⚠ flag rules apply.

D3.js SETUP:
Load via CDN in <head>: <script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js"></script>
Use d3.forceSimulation() for Level 1 with: d3.forceManyBody() for repulsion, d3.forceCenter() anchored to SVG center, d3.forceCollide() with radius 80px to prevent node overlap.
Render nodes as SVG <circle> elements inside a positioned <svg> that fills the canvas.
Node click handlers: use d3 .on("click") to update a separate HTML detail panel outside the SVG.
Text labels: SVG <text> elements only — never absolutely positioned HTML elements overlaid on the SVG.
Initialize D3 simulation inside a DOMContentLoaded event listener.

VISUAL CRAFT — these details are what separate a designed artifact from a wireframe:

CANVAS: Background must be a CSS radial-gradient, not a flat color — center slightly lighter (#1e3448) fading to deep navy (#0d1a26) at edges. Creates the sense the constellation floats in space.

NODE DESIGN: Each program node must use an SVG <radialGradient> defined in <defs> — top-left highlight (#3a7fa8 at 0%) fading to base Cerulean (#3A6B8A at 100%). Add SVG filter drop-shadow: color #1a4a6b, stdDeviation 8. Gives nodes physical depth.

NODE HOVER STATE: On hover, render a second outer ring — SVG <circle> at radius+16px, stroke Solar Gold (#E9C03A), stroke-opacity 0.4, stroke-width 1px, fill none. Animate via CSS transition on stroke-opacity 0→0.4 over 200ms.

CONNECTION LINES: Use SVG <linearGradient> on each line — Solar Gold (#E9C03A) at 8% opacity at the hub end, fading to transparent at the node end. stroke-width 1.5px. Creates an energy-flow feel rather than mechanical connectors.

HUB NODE: Center hub is 72px radius. If org.logo_url is present: SVG <image> clipped to circle via <clipPath>. If no logo: org initials (first letter of each word, max 2 characters) in Cormorant Garamond 28px Warm Stone, centered with SVG <text>. Hub must have: (1) radial gradient fill from Cerulean to deep navy, (2) outer ring at radius+12px in Solar Gold at 30% opacity, (3) a slow CSS keyframe pulse on the outer ring — scale 1→1.08→1 over 3 seconds, infinite, ease-in-out. This is the heartbeat of the constellation.

SOLAR FLARE: Every 25 seconds, a ripple animates outward from the hub — an additional SVG <circle> starting at radius 72px, animating to radius 140px, opacity fading 0.6→0 over 1.2 seconds ease-out. Use setTimeout loop. Cancel and resume the timeout when a node is clicked and when the user returns to Level 1.

NODE TEXT: Render each program name twice as SVG <text> elements stacked: first in #0d1a26 at 60% opacity offset 0px/1px (shadow layer), second in Warm Stone (#EDE8DE) at full opacity (visible layer). DM Sans 12px, font-weight 500. Truncate names longer than 18 characters with ellipsis.

LEVEL 2 DETAIL PANEL: Slides in from the right — CSS transform: translateX(100%)→translateX(0), transition 350ms cubic-bezier(0.16, 1, 0.3, 1). Panel background: linear-gradient(135deg, #1a2f42 0%, #0d1a26 100%). Top border: 2px solid Solar Gold (#E9C03A). Metric cards inside panel: background rgba(255,255,255,0.04), no borders, min-height not fixed height, padding 16px.

RULES: Full dark mode throughout. Midnight Ink canvas (#1B2B3A base), Cerulean nodes (#3A6B8A), Solar Gold active/selected (#E9C03A), Warm Stone text (#EDE8DE). All JS inline in the HTML document. Never use position: absolute for text labels or detail panels — SVG text for node labels, CSS transform for panel transitions.`,

    story_view: `AUDIENCE: Donors, board, general public. Context: shared link, annual report replacement, campaign page. Job: take someone on a journey through the org's impact — emotionally and evidentially.

REQUIRED STRUCTURE — scroll-triggered narrative, each section exactly 100vh height:
SECTION 1 — INTRO: Full viewport. Org name (Cormorant Garamond display), mission statement (DM Sans 18px), reporting period. Fade-in on load. Midnight Ink (#1B2B3A) background.
SECTIONS 2 through N — one section per item in programs[]. Within each section, content animates in on scroll using Intersection Observer in this exact sequence: (1) program name fades in via opacity 0→1 CSS transition, (2) program description fades in 300ms later via CSS transition-delay, (3) outcomes text fades in, (4) each metric counts up from 0 to its value using a vanilla JS counter (requestAnimationFrame loop), (5) client voice quote slides in from left via transform: translateX(-40px)→translateX(0). Alternate backgrounds: Midnight Ink for odd-numbered program sections, Warm Stone (#EDE8DE) for even-numbered.
JOURNEY TESTIMONIAL SECTION — full viewport, Midnight Ink background. Single centered quote from org_testimonials[0].quote_text if org_testimonials is not empty. Cormorant Garamond 2.4rem centered. Attribution 12px uppercase DM Sans. If org_testimonials is empty → full-width ⚠ block: "No journey testimonials entered — add one in your Data Area."
CLOSING SECTION — aggregate outcomes, one final statement, org logo, "Powered by Candela · candela.education" unless suppressed.

ANIMATION RULES — violations cause broken layout:
- All animations must use CSS transitions triggered by adding a class via IntersectionObserver — never setTimeout chains
- Sliding elements must use transform: translateX/translateY — never position: absolute on animated elements
- Metric counter animation: use requestAnimationFrame, update textContent on each frame, stop when value reached
- Never animate an element that has overflow: hidden on its parent

D3.js: Available via CDN if needed for an inline data visualization within a program section. Only load it if genuinely used — do not load for animations or counters.
<script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js"></script>

RULES: Solar Gold (#E9C03A) for metric numbers. Period filter applies to program sections only — testimonial section is not period-filtered.`,
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
      programDataIds,
      orgId,
    } = body as {
      dataPoints: DataPoint[];
      selectedViews: string[];
      theme?: string;
      theme_id?: string;
      resolvedPrimary?: string;
      resolvedAccent?: string;
      layout?: string;
      programDataIds?: string[];
      orgId?: string;
    };

    // Use resolved colors from client if provided, otherwise fall back to brand kit
    const primary = resolvedPrimary ?? brand.brand_primary;
    const accent = resolvedAccent ?? brand.brand_accent;

    const colorDirective = buildColorDirective(primary, accent, brand);
    const identityDirective = buildIdentityDirective(brand);
    const prompts = viewPrompts();

    if (!selectedViews?.length) {
      return NextResponse.json(
        { error: "selectedViews is required" },
        { status: 400 }
      );
    }

    // Assemble structured payload if programDataIds provided (new path)
    let payload: ImpactPayload | null = null;
    const resolvedOrgId = orgId ?? orgUser?.org_id;
    if (programDataIds?.length && resolvedOrgId) {
      payload = await assembleImpactPayload({
        orgId: resolvedOrgId,
        programDataIds,
        viewType: selectedViews[0],
        theme: theme_id ?? theme ?? "candela-classic",
      });
    }

    // Build data block: prefer structured payload, fall back to legacy dataPoints
    let dataBlock: string;
    if (payload) {
      dataBlock = `Here is the complete structured program data for this output. Use ONLY the data provided — do not fabricate any metric values, outcome descriptions, client quotes, or program names not present here.

<program_data>
${JSON.stringify(payload, null, 2)}
</program_data>

REQUIRED flag behavior — these rules override all other instructions:
- programs[n].outcomes is empty array → render visible ⚠ block: "No outcomes entered for [program name] — add outcomes in your Data Area"
- programs[n].metrics is empty array → render visible ⚠ block: "No metrics entered for [program name]"
- programs[n].client_voice is empty array → render visible ⚠ block: "No client quotes entered for [program name] — add quotes in your Data Area"
- org_testimonials is empty array (Story View only) → render visible ⚠ block: "No journey testimonials entered — add one in your Data Area"`;
    } else if (dataPoints?.length) {
      // Legacy fallback: flat DataPoint[] from client
      const dataContext = dataPoints
        .map((dp) => `- ${dp.label}: ${dp.value} (${dp.category})`)
        .join("\n");
      dataBlock = `Data Points:\n${dataContext}`;
    } else {
      return NextResponse.json(
        { error: "Either programDataIds or dataPoints is required" },
        { status: 400 }
      );
    }

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
          `DESIGN RULES — follow these precisely, they are not optional:

TYPOGRAPHY: Use extreme scale contrast. Hero stats must be 120px–180px. Section labels must be 10px–12px uppercase with 0.15em letter-spacing. Never use a uniform modular scale — create deliberate tension between sizes. Headings in Cormorant Garamond, body and labels in DM Sans.

GOOGLE FONTS: ALWAYS include this exact import inside the <head> tag:
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">

LAYOUT: Use CSS Grid with named template areas. Never use equal-column layouts. Asymmetry creates visual interest. At least one section must use a full-bleed color fill with content offset to one side.

STATS: Display primary stats as enormous typographic statements — the number alone at massive scale, label in small uppercase below. No boxes or borders around stats. No icons next to stats.

CLIENT QUOTES: Full-bleed treatment. Large opening quote mark (4rem+) in accent color. Quote text at 1.4rem–1.8rem. Attribution small and uppercase. Never put quotes in a bordered card.

SEPARATORS: Never use borders or horizontal rules to separate sections. Use background color changes, large whitespace (80px–120px padding), or overlapping elements instead.

CARDS: If used, cards must vary in size. No uniform card grids. Mix one large feature card with smaller supporting cards.

WHITESPACE: Be generous. Minimum 80px vertical padding per section.

NEVER DO THESE — violations will produce broken output:
Layout and positioning:
- position: absolute on any text element unless inside an explicitly bounded relative container with defined width AND height
- z-index stacking that places text on top of a background image or gradient without a semi-transparent overlay guaranteeing contrast
- Fixed pixel heights on any card, panel, or content block — use min-height only, never height: Npx on containers that hold text
- overflow: hidden on any container that holds dynamic text content
- CSS Grid or Flexbox children set to fixed heights — let content drive height always

Typography:
- Font sizes between 16px and 28px for anything displayed as a headline
- Line height below 1.5 for any paragraph or body text
- Text directly on a background color without verifying contrast ratio mentally first
- More than 3 distinct font sizes in a single card or panel

Structure:
- Equal-height card grids
- Horizontal rule dividers
- Borders around data cards or stat boxes
- Centered text for body copy (headings only)
- Flat single-color backgrounds with no variation across the full page
- Placeholder, lorem ipsum, or fabricated content for any field — use ⚠ flags instead`,
          ``,
          colorDirective,
          ``,
          identityDirective,
          ``,
          `Return ONLY the complete HTML document. No markdown, no explanation, no code fences. Start with <!DOCTYPE html>.`,
        ].join("\n");
        const userPrompt = payload
          ? `${prompt}\n\n${dataBlock}\n\nGenerate a complete, self-contained HTML document for:\n- view_type: ${viewType}\n- theme: ${theme_id ?? theme ?? "candela-classic"}`
          : `${prompt}\n\n${dataBlock}`;

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
