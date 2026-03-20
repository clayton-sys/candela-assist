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
          `You are the lead designer at a boutique studio that charges $85,000 for a nonprofit annual report. Your clients are community foundations, national advocacy organizations, and social justice nonprofits. Your work has been featured in Communication Arts, shortlisted for D&AD, and cited in the Information is Beautiful Awards. You have spent 15 years perfecting the craft of making data feel human.
Your design philosophy: restraint is power, whitespace is an argument, and every typographic decision either earns its place or gets cut. You do not use templates. You do not produce generic output. Every pixel is a decision.
You are generating a visual artifact for a real nonprofit. The data inside represents real people whose lives were changed. The design must honor that weight while being visually stunning enough to open doors, secure funding, and make a board member lean forward in their seat.
You think in systems: grid, typographic hierarchy, color temperature, spatial rhythm. You know that the difference between amateur and professional design is usually spacing, contrast, and restraint — not complexity.`,
          ``,
          `VISUAL THEME — this governs all layout, typography, section transitions, and visual density. It is not a suggestion. Every structural and aesthetic decision must express this theme:\n${themeInstructions}`,
          ``,
          `DESIGN RULES — these are the craft standards of a $85k studio, not suggestions:

GOOGLE FONTS: ALWAYS include this exact import inside the <head> tag:
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">

TYPOGRAPHIC HIERARCHY — the single most important design decision:
Create violent scale contrast. If your hero stat is 160px, your next largest element should be no larger than 32px. The jump must feel intentional and dramatic.
Use Cormorant Garamond exclusively for: hero stats, section headers, pull quotes, program names. Never for body copy or labels.
Use DM Sans exclusively for: body copy, labels, captions, navigation, metadata. Never for display text.
Numeric figures in Cormorant Garamond must use font-variant-numeric: tabular-nums lining-nums for alignment.
Letter-spacing on uppercase DM Sans labels: 0.12em minimum. Never use uppercase text without letter-spacing.
Line height: 1.2 for display text (Cormorant Garamond headers), 1.65 for body text (DM Sans paragraphs). Never deviate.

SPATIAL SYSTEM — professional layouts are built on a grid, not intuition:
Use an 8px base unit for all spacing. Every padding, margin, and gap must be a multiple of 8px (8, 16, 24, 32, 40, 48, 64, 80, 96, 128).
Section padding: minimum 96px top and bottom. Never less.
Content max-width: 1200px for full layouts, 800px for document/narrative layouts. Always centered.
Establish one dominant horizontal rhythm and hold it. Inconsistent column widths signal amateur work.

COLOR APPLICATION — four colors, infinite depth:
Never use a color at full opacity for backgrounds. Primary backgrounds: use at 92–100% opacity. Secondary sections: use at 6–12% opacity as a tint. This creates depth without adding colors.
Solar Gold (#E9C03A) is earned — it marks the single most important element per section. One use per visual zone. If everything is gold, nothing is.
Temperature contrast: pair cool Cerulean sections with warm Warm Stone sections. Alternate deliberately, never randomly.
Text on dark backgrounds: Warm Stone (#EDE8DE) at 100% opacity for primary, 60% opacity for secondary/metadata. Never pure white — it vibrates against dark backgrounds.
Never place Solar Gold text on Warm Stone background — insufficient contrast.

LAYOUT CRAFT — what separates gallery quality from template quality:
Asymmetry is a tool. At least one section must break the grid intentionally — an oversized number bleeding past its container, a quote that starts in one column and ends in another, a color block that doesn't respect the margin.
Full-bleed color transitions between sections create visual rhythm. Never use decorative dividers — use spatial contrast and color changes instead.
The Z-pattern and F-pattern are real: place the highest-value content (hero stat, key quote) where the eye naturally lands first. Top-left for western audiences. Design with eye movement in mind.
Empty space is an active design element. A section with generous whitespace signals confidence and sophistication. Cramped layouts signal fear.
Overlap is power: a large typographic element that slightly overlaps the section below creates continuity and movement. Use deliberately, maximum once per layout.

CARD AND COMPONENT DESIGN:
Cards must never be the same height. Use CSS Grid auto rows, let content breathe.
Card backgrounds on dark canvas: rgba(255,255,255,0.04) with no border. On light canvas: rgba(0,0,0,0.04) with no border. Borders on cards signal amateur work.
Metric displays: the number is everything. Strip away decoration. Large number, small label beneath. That's it. No icons, no progress bars unless the data explicitly calls for them, no boxes.
Pull quotes: the opening quotation mark is a design element — render it at 6rem+ in the accent color, positioned absolutely behind the first line of text. The quote text sits over it.

MICRO-DETAILS that separate $85k work from $5k work:
CSS text-rendering: optimizeLegibility on all body text
-webkit-font-smoothing: antialiased on all text
Use CSS custom properties for all colors — defined once in :root, never hardcoded twice
Transitions on interactive elements: 200ms ease for hover states. Never instant, never slow.
Section headings with a decorative element: a 2px × 40px Solar Gold vertical rule to the left, or a 1px × 60px horizontal rule beneath, or nothing. Choose one system and hold it across the entire document.
Numbers that represent people deserve weight: bold or semi-bold, never light weight.

NEVER DO THESE — each one is a signal that a template was used, not a designer:
- position: absolute on text inside a container without explicitly bounded width AND height on the parent
- Fixed pixel heights (height: Npx) on any container holding text — use min-height always
- overflow: hidden on text containers
- Equal-height card grids — use CSS Grid auto rows
- Horizontal rule dividers (<hr> or border-bottom) between sections
- Borders around stat cards or data cards
- Centered body copy (centered headings only, and even then sparingly)
- More than 3 font sizes in any single card or component
- Line height below 1.5 on paragraph text
- Generic box shadows (box-shadow: 0 2px 4px rgba(0,0,0,0.1)) — these look like Bootstrap. Use either no shadow, or a deliberate colored shadow that matches the component's context
- Lorem ipsum, placeholder text, or fabricated data for any field — use the ⚠ flag system
- Flat single-color full-page backgrounds — always introduce depth through gradient, texture (via CSS noise), or tonal variation
- Any layout that could have been produced by a drag-and-drop website builder`,
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
