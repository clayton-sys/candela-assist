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
    impact_snapshot: `AUDIENCE: Funders, donors, board members. Context: email attachment, printed leave-behind, 30-second scan. Job: communicate what this org achieved this period before the reader moves on.

DESIGN INTENTION: This is the piece a program director hands a funder at the end of a site visit. It must stop them. One number so large it needs no explanation. One quote that makes the data human. Program cards that communicate clearly without demanding time. Everything on one screen — nothing hidden below the fold.

REQUIRED STRUCTURE — in this exact order:
1. HEADER STRIP — full-width, Midnight Ink background, 48px vertical padding. Org logo top-left as small badge (max 32px height). Period label top-right in 11px uppercase DM Sans with 0.15em tracking, Warm Stone 55% opacity. No org name as a headline — the logo IS the identity.
2. HERO SECTION — two-column asymmetric layout. Left column (~55%): the featured metric (first metric where is_featured=true, else programs[0].metrics[0]). Number at 140px–180px Cormorant Garamond 300 weight, Solar Gold color, line-height 0.9. Metric label at 11px uppercase DM Sans below, Warm Stone 60% opacity, letter-spacing 0.15em. The number bleeds slightly into the right column via a negative margin — this is intentional. Right column (~45%): org mission statement in Cormorant Garamond italic 22px, Warm Stone, line-height 1.6. Below the mission: a 2px × 48px Solar Gold vertical rule, then a short AI-generated agency summary sentence in DM Sans 14px.
3. CLIENT VOICE — full-width section, Warm Stone background, 96px vertical padding. Large opening quote mark (7rem Cormorant Garamond, Solar Gold, positioned so quote text overlaps its lower portion). Quote text at 1.8rem Cormorant Garamond italic, Midnight Ink, line-height 1.5, max-width 720px centered. Attribution below in 10px uppercase DM Sans, letter-spacing 0.2em, Midnight Ink 60% opacity. Use programs[0].client_voice[0]. If empty: ⚠ flag styled as a bordered amber block.
4. PROGRAM GRID — Midnight Ink background, 96px vertical padding. CSS Grid with asymmetric columns. First program gets a 2-column-span feature card with larger program name (Cormorant Garamond 28px) and two outcome sentences. Remaining programs get single-column cards. Card backgrounds: rgba(255,255,255,0.05), no borders, border-radius 2px, padding 32px. Each card: Solar Gold 2px × 32px vertical rule left of program name, program name in Cormorant Garamond, one outcome from outcomes[0] in DM Sans 14px line-height 1.65, one metric value (large, Solar Gold) + label (11px uppercase DM Sans). Cards use min-height — never fixed height.
5. FOOTER — Warm Stone background, 40px vertical padding. Mission statement 12px DM Sans left. "Powered by Candela · candela.education" 11px DM Sans right, Midnight Ink 40% opacity (unless suppressed).

RULES: Single viewport, no scroll. PDF export intent — no JavaScript. Google Fonts import required. All CSS custom properties in :root. Background depth on dark sections via gradient, never flat.`,

    funder_narrative: `AUDIENCE: Grant funders. Context: formal document submitted as PDF or shared as a link. Job: tell the complete program story in funder language — demonstrate outcomes, contextualize barriers, show what changed.

DESIGN INTENTION: This is the document a development director sends instead of a 20-page Word report. It should feel like a foundation's own publications — editorial, authoritative, beautifully typeset. Wide margins. Generous line height. Data woven into prose, not pasted beneath it. A funder should feel they are reading something that was made with care for their time.

REQUIRED STRUCTURE — in this exact order:
1. COVER PAGE — full-viewport-height section. Midnight Ink background with radial-gradient(ellipse at 25% 40%, #1e3448 0%, #0d1a26 80%). Left column (60%): org name in Cormorant Garamond 72px weight 300, Warm Stone, line-height 1.0. Below: a 1px horizontal rule in Solar Gold spanning 80px. Below: "Impact Report" + period label in 14px uppercase DM Sans letter-spacing 0.2em, Warm Stone 60% opacity. Bottom of column: mission statement in Cormorant Garamond italic 20px, Warm Stone 80% opacity, max-width 480px. Right column (40%): org logo centered vertically if present. Cerulean (#3A6B8A) left border 3px full height on the right column.
2. AGENCY NARRATIVE — Warm Stone background, max-width 800px centered, 128px vertical padding. Section label: "Our Work" in 10px uppercase DM Sans letter-spacing 0.2em, Cerulean, with Solar Gold 2px × 40px vertical rule to left. Below: 2–3 paragraphs AI-generated from org.mission + program descriptions. Theory of change, population served, overall approach. Cormorant Garamond? No — this is prose. DM Sans 300 weight, 17px, line-height 1.8, Midnight Ink. First paragraph gets a drop cap: first letter at 4.5rem Cormorant Garamond 600, Solar Gold, float left, margin-right 8px, line-height 0.8.
3. PER-PROGRAM SECTIONS — alternating backgrounds: Warm Stone for odd programs, rgba(27,43,58,0.04) tint for even programs. Each section: 128px vertical padding, max-width 800px centered. Structure within each program section in this order: (a) Cerulean full-width horizontal rule 1px + 48px spacing, (b) program name in Cormorant Garamond 44px weight 300 Midnight Ink, (c) outcomes narrative paragraph — DM Sans 17px line-height 1.8 — AI-synthesized from outcomes array as flowing prose, not bullet points, (d) metric callout row — 2–3 metrics displayed inline as a horizontal strip: each metric has value in Cormorant Garamond 48px Solar Gold + label in 10px uppercase DM Sans below, no borders, background rgba(233,192,58,0.06), padding 24px 32px, (e) barriers paragraph — "Challenges" label in 10px uppercase DM Sans Cerulean then DM Sans 17px prose from barriers array, (f) pull quote — full-width, Solar Gold left border 4px, padding-left 32px, quote in Cormorant Garamond italic 1.8rem Midnight Ink, attribution 10px uppercase DM Sans, from client_voice[0], (g) what changed paragraph — "What Changed" label then DM Sans 17px prose from change_description.
4. CLOSING — Midnight Ink background, 128px padding, max-width 800px centered. AI-generated aggregate summary sentence in Cormorant Garamond 32px weight 300 Warm Stone, line-height 1.4. Below: one forward-looking sentence in DM Sans 17px Warm Stone 70% opacity. Org logo small bottom-left.
5. FOOTER — "Powered by Candela · candela.education" 11px DM Sans Warm Stone 40% opacity, centered (unless suppressed).

RULES: Scrollable document. No JavaScript. Line height 1.8 for all body text. Google Fonts import. Text-rendering: optimizeLegibility on all text.`,

    website_embed: `AUDIENCE: General public, prospective donors, community partners visiting the org's website. Context: always-on iframe embed, 400px wide. Job: prove measurable work to anyone who lands on the site.

DESIGN INTENTION: This is not a widget. This is a small gallery piece that lives on the org's website. It should feel designed, not embedded. The three stat numbers should feel large enough to command attention at sidebar scale. The rotating quote is the human pulse of the embed — it should feel alive.

REQUIRED STRUCTURE:
1. HEADER BAR — 48px height, uses org.brand_colors.primary as background (fallback: Midnight Ink #1B2B3A). Org logo at 20px height centered vertically if present. If no logo: org name truncated at 24 characters, DM Sans 12px, brand text color.
2. STAT STRIP — three metric cards side by side. Each: 32px padding, brand primary background darkened slightly via rgba overlay rgba(0,0,0,0.15). Metric value in Cormorant Garamond 52px, brand accent color (fallback: Solar Gold #E9C03A), line-height 1.0. Metric label below in 9px uppercase DM Sans, letter-spacing 0.15em, brand text color 70% opacity. If metric.target is not null: a slim progress bar beneath the label — 4px height, border-radius 2px, background rgba(255,255,255,0.15), filled portion in brand accent color, width = percentage of value vs target (cap at 100%). Use programs[0].metrics sorted by is_featured first, then display_order. Show first 3 metrics only.
3. QUOTE CAROUSEL — 72px vertical padding, brand primary background. Minimum height 100px. Quote text in Cormorant Garamond italic 15px, brand text color, line-height 1.6, max-width 340px centered. Attribution in 9px uppercase DM Sans letter-spacing 0.15em, brand text color 55% opacity. Cycles through all items in programs[0].client_voice every 6 seconds via setInterval. CSS opacity transition 400ms ease. Show first quote on load immediately. If client_voice empty: ⚠ flag.
4. FOOTER — 32px height, brand primary background with rgba(0,0,0,0.2) overlay. "Powered by Candela · candela.education" in 9px DM Sans, brand text color 40% opacity, centered (unless suppressed).

RULES: Fixed width 400px. Uses org.brand_colors from payload — never Candela brand colors directly. JavaScript for quote rotation only. Must work as standalone iframe. No external images except org logo.`,

    program_profile: `AUDIENCE: Funders, donors, general public. Context: shareable link, print handout, social share, gala table card. Job: one program, one number that stops you cold, then a story that makes it human.

DESIGN INTENTION: Think charity: water campaign card meets museum label. The number is the entire first act. It is so large, so isolated, so dominant that the viewer has absorbed the impact before they have read a word. Then the narrative gives it humanity. Then the quote makes it personal. The design should feel like it was made by someone who believes this work matters — because it was.

REQUIRED STRUCTURE — portrait orientation, programs[0] only:
1. HERO SECTION — full viewport height, Midnight Ink background with radial-gradient(ellipse at 60% 30%, #1e3448 0%, #0d1a26 75%). Vertically centered content. Program name in 13px uppercase DM Sans letter-spacing 0.2em, Warm Stone 60% opacity, centered. Below: 48px spacing. The featured metric value (first where is_featured=true, else metrics[0].value) in Cormorant Garamond 180px–220px weight 300, Solar Gold, line-height 0.85, centered. The number should feel like it weighs something. Below: metric label in 12px uppercase DM Sans letter-spacing 0.18em, Warm Stone 55% opacity, centered. Below: 64px spacing. A subtle scroll indicator (3 small dots, 6px each, Warm Stone 30% opacity) at the absolute bottom center.
2. NARRATIVE SECTION — Warm Stone background, max-width 640px centered, 128px vertical padding. Section label: "The Story" in 10px uppercase DM Sans Cerulean, letter-spacing 0.2em, Solar Gold 2px × 32px vertical rule to left. Below 24px: 3–5 sentence narrative paragraph. AI-generated from programs[0].description + programs[0].outcomes. This paragraph answers: what does that number mean in human terms? Who are the people behind it? DM Sans 300 weight, 18px, line-height 1.8, Midnight Ink. Never fabricate — if outcomes is empty, render ⚠ flag instead of narrative.
3. CLIENT QUOTE — Midnight Ink background with linear-gradient(135deg, #1a2f42 0%, #0d1a26 100%), 96px vertical padding, max-width 640px centered. If programs[0].client_voice is not empty: quote mark at 8rem Cormorant Garamond Solar Gold, positioned so quote text overlaps lower portion. Quote in Cormorant Garamond italic 2rem Warm Stone line-height 1.5. Attribution 10px uppercase DM Sans Warm Stone 55% opacity letter-spacing 0.2em. If empty: ⚠ block.
4. FOOTER — Warm Stone background, 40px padding. Org logo left (max 28px height) if present. Period label center in 10px uppercase DM Sans Midnight Ink 50% opacity. "Powered by Candela · candela.education" right 11px DM Sans Midnight Ink 40% opacity (unless suppressed).

RULES: Scrollable portrait layout. No JavaScript. PDF and print intent — use @media print to remove scroll indicator and footer. Google Fonts import.`,

    impact_command_center: `AUDIENCE: Funders, board members. Context: live meeting on a laptop — the funder asks "can you show me your programs?" and this is what comes up. Job: walk a funder through the complete program landscape organically, at their own pace.

DESIGN INTENTION: This is the piece that replaces the PowerPoint deck. It should feel like mission control — authoritative, alive, purposeful. The constellation is not decoration. It is the argument that this organization's programs are connected, cohesive, and part of something larger. Every interaction should feel cinematic, not functional.

REQUIRED STRUCTURE — three interactive levels:

LEVEL 1 (default — the constellation):
Full-screen dark canvas. Background: radial-gradient(ellipse at 50% 45%, #1e3448 0%, #0d1a26 70%) — the center glows faintly, nodes emerge from depth.
D3.js force simulation. Each program node: SVG <circle> radius 56px. Node fill: radial gradient defined in <defs> — top-left highlight #4a8fb8 at 0%, base Cerulean #3A6B8A at 70%, deep navy #1a3d56 at 100%. SVG filter: feDropShadow dx=0 dy=4 stdDeviation=12 flood-color=#0a1e2e flood-opacity=0.6.
Node labels: two SVG <text> elements stacked (shadow layer: Midnight Ink 50% opacity, offset 0/1px; visible layer: Warm Stone 100% opacity). DM Sans 11px weight 500 letter-spacing 0.04em. Truncate at 16 characters. dominant-baseline: middle, text-anchor: middle.
Central hub: SVG <circle> radius 68px. Same radial gradient as nodes but deeper. If org.logo_url: SVG <image> clipped to circle via <clipPath>, 80px × 80px. If no logo: org initials (max 2 chars) in Cormorant Garamond 32px Warm Stone centered. Hub has: outer ring at radius+14px, stroke Solar Gold 25% opacity, stroke-width 1.5px. CSS keyframe pulse on outer ring: transform scale(1) → scale(1.07) → scale(1) over 3.5s infinite ease-in-out — the heartbeat.
Connection lines: SVG <line> elements with linearGradient stroke — Solar Gold 12% opacity at hub end, transparent at node end. stroke-width 1px.
Solar flare: setTimeout loop every 25 seconds — SVG <circle> on hub starts at radius 68, animates to radius 160px while opacity 0.5→0 over 1.4s. CSS animation via class added and removed. Cancel and restart on interaction.
Period selector: top-right, DM Sans 12px, Warm Stone, background rgba(255,255,255,0.06) border-radius 4px padding 8px 16px.
Hover state on nodes: radius expands to 68px via d3 transition 200ms. Outer glow ring appears (Solar Gold 35% opacity). Tooltip div positioned near node: program description in DM Sans 13px Warm Stone, background rgba(14,26,38,0.92) backdrop-filter blur(8px) border-radius 4px padding 12px 16px border-left 2px solid Solar Gold.

LEVEL 2 (click a node — program detail):
Selected node stays visible. All other nodes: opacity transition to 0.2 over 350ms. Detail panel slides in from right: transform translateX(100%)→translateX(0), transition 380ms cubic-bezier(0.16, 1, 0.3, 1). Panel covers 65% of screen right side. Panel background: linear-gradient(160deg, #1a2f42 0%, #0d1a26 100%), left border 2px solid Solar Gold.
Panel content: program name Cormorant Garamond 42px weight 300 Warm Stone line-height 1.1. Period label 10px uppercase DM Sans Warm Stone 45% opacity. Metrics grid: CSS Grid 2 columns, auto rows, gap 16px, margin-top 32px. Each metric card: background rgba(255,255,255,0.05) border-radius 2px padding 20px 24px — min-height never fixed height. Value in Cormorant Garamond 44px Solar Gold. Label in 10px uppercase DM Sans Warm Stone 60% opacity letter-spacing 0.15em. Target if present: 10px DM Sans Warm Stone 35% opacity. Outcomes section below: "Outcomes" label in 10px uppercase DM Sans Cerulean, then DM Sans 14px Warm Stone 85% opacity line-height 1.7. Client quote: Solar Gold left border 3px, padding-left 20px, Cormorant Garamond italic 17px Warm Stone line-height 1.55. "← Back" button top-left: 11px DM Sans Warm Stone 60%, hover 100%, transition 200ms ease.

LEVEL 3 (see all programs toggle):
"All Programs" button top-left (visible in both levels). Click transitions constellation to card grid: opacity fade 300ms. Grid: CSS Grid auto-fit columns min 280px, gap 24px, padding 64px. Same card styling as Level 2 metric cards but full program cards. Same Solar Gold left border on cards. Back to constellation button top-left.

D3.js SETUP:
Load: <script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js"></script>
forceSimulation with forceManyBody strength -400, forceCenter, forceCollide radius 90.
All JS inline. Initialize in DOMContentLoaded. Node click via d3 .on("click"). Detail panel is HTML div outside SVG — never position:absolute over SVG for text.

RULES: Full dark mode throughout. All animations via CSS transitions triggered by JS class changes — never setTimeout chains for animations. All JS inline. Google Fonts import.`,

    story_view: `AUDIENCE: Donors, board members, general public. Context: shared link replacing a printed annual report or used as a campaign page before a gala. Job: take someone on a complete emotional and evidential journey through the organization's impact.

DESIGN INTENTION: This is the piece that makes a donor cry in the best possible way. It is not a report. It is a story told in full-screen chapters. Each program section is a complete thought — identity, then proof, then humanity. The numbers count up because watching them arrive feels like witnessing the work happen. The alternating backgrounds are not decoration — they are the rhythm of breathing. The journey testimonial is the emotional apex: one voice, one screen, nothing else.

REQUIRED STRUCTURE — every section exactly 100vh:

SECTION 1 — OPENING: Midnight Ink background with radial-gradient(ellipse at 40% 50%, #1e3448 0%, #0d1a26 80%). Content vertically centered via flexbox. Org name: Cormorant Garamond 88px weight 300 Warm Stone line-height 1.0, centered, fades in on load via CSS opacity 0→1 transition 1.2s ease. Below: 24px spacing. Mission statement: Cormorant Garamond italic 22px Warm Stone 75% opacity, centered, fades in 600ms delay. Below: period label 11px uppercase DM Sans Warm Stone 45% opacity letter-spacing 0.2em, fades in 1000ms delay. Scroll indicator bottom-center: thin animated line, 2px wide 40px tall Solar Gold, pulses opacity 60%→100%→60% on 2s loop.

SECTIONS 2 through N — one per program in programs[]:
Odd programs: Warm Stone background (#EDE8DE). Even programs: Midnight Ink background with linear-gradient(180deg, #1a2f42 0%, #0d1a26 100%).
Content: max-width 800px centered, vertically centered via flexbox, padding 0 64px.
IntersectionObserver triggers content sequence when section enters viewport (threshold 0.3):
Step 1 (fires immediately on enter): program name in Cormorant Garamond 72px weight 300, color matches background contrast (Midnight Ink on Warm Stone, Warm Stone on dark). Enters via opacity 0→1 + transform translateY(24px)→translateY(0), transition 600ms ease.
Step 2 (200ms delay): program description in DM Sans 300 18px line-height 1.75, 65% opacity, enters same way 500ms transition.
Step 3 (500ms delay): "Outcomes" label (10px uppercase DM Sans Cerulean letter-spacing 0.2em) + outcomes text (DM Sans 17px line-height 1.7) enters opacity fade 400ms.
Step 4 (900ms delay): metrics row — each metric displayed as: value in Cormorant Garamond 80px Solar Gold (counts up from 0 using requestAnimationFrame over 1.8s, starts counting when step 4 fires) + label 10px uppercase DM Sans below. Metrics appear left to right with 150ms stagger.
Step 5 (after counter completes): client voice quote slides in from left — transform translateX(-48px)→translateX(0) opacity 0→1 transition 600ms. Quote styled with Solar Gold left border 4px, padding-left 24px, Cormorant Garamond italic 1.6rem, attribution 10px uppercase DM Sans.
Missing fields: ⚠ blocks styled distinctly (amber left border, 10px DM Sans label naming exact missing field and where to add it).

JOURNEY TESTIMONIAL SECTION: Midnight Ink with radial-gradient(ellipse at 50% 50%, #1e3448 0%, #0d1a26 80%). Content centered both axes. If org_testimonials not empty: quote mark 9rem Cormorant Garamond Solar Gold positioned behind text. Quote text Cormorant Garamond italic 2.4rem Warm Stone line-height 1.45 max-width 720px centered, enters via opacity fade 1s on IntersectionObserver. Attribution 11px uppercase DM Sans Warm Stone 50% opacity letter-spacing 0.2em. If empty: full-width ⚠ block amber border "No journey testimonials entered — add one in your Data Area."

CLOSING SECTION: Warm Stone background. Max-width 800px centered. Aggregate outcomes AI-generated from all programs. Cormorant Garamond 48px weight 300 Midnight Ink line-height 1.3. Final forward-looking sentence DM Sans 18px Midnight Ink 70% opacity line-height 1.7. Org logo if present, small, centered below. "Powered by Candela · candela.education" 11px DM Sans Midnight Ink 35% opacity (unless suppressed).

ANIMATION RULES — non-negotiable:
- All entrance animations: CSS transitions triggered by IntersectionObserver adding a class. Never setTimeout chains.
- Sliding elements: transform: translateX/translateY only — never position changes.
- Counter animation: requestAnimationFrame loop, update textContent each frame, easeOutCubic easing function, stop exactly at target value.
- Never animate an element whose parent has overflow: hidden.
- Scroll indicator on section 1: CSS keyframe animation, not JS.

D3.js: Available via CDN if a program section benefits from an inline data visualization. Only load if actually used.
<script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js"></script>

RULES: Solar Gold for all metric numbers. Google Fonts import. All JS inline. Period filter applies to program sections — testimonial section is not period-filtered.`,
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
          `You are the creative director at a boutique studio that charges $85,000 for a nonprofit annual report. Your clients include community foundations, national advocacy organizations, and civil rights nonprofits. Your work has been featured in Communication Arts, shortlisted for D&AD, and cited in the Information is Beautiful Awards. You have spent 15 years perfecting the art of making data feel human.
Your philosophy: restraint is power, whitespace is an argument, and every typographic decision either earns its place or gets cut. You do not use templates. You do not produce generic output. Every layout decision is intentional.
You are generating a visual artifact for a real nonprofit. The data inside represents real people — participants, clients, community members — whose lives were changed by this organization's work. The design must honor that weight while being visually stunning enough to open doors, secure funding, and make a funder lean forward in their seat.
You think in systems: grid, typographic hierarchy, color temperature, spatial rhythm, negative space. You know the difference between amateur and professional work is almost never complexity — it is spacing, contrast, type scale, and restraint.
One more thing: you have seen a thousand AI-generated reports and you refuse to produce one. You can spot generic output immediately — the uniform card grids, the centered everything, the box shadows that look like Bootstrap, the hero stats that are big but not dramatic enough, the layouts that could have been dragged and dropped. You reject all of it. Every output you produce must look like a human being who cares deeply about craft spent a week on it.`,
          ``,
          `VISUAL THEME — this governs all layout, typography, section transitions, and visual density. It is not a suggestion. Every structural and aesthetic decision must express this theme:\n${themeInstructions}`,
          ``,
          `DESIGN RULES — the craft standards of a $85,000 studio, not a checklist:

GOOGLE FONTS: ALWAYS include this exact import inside the <head> tag:
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">

TYPOGRAPHIC HIERARCHY — the single most powerful design tool you have:
Violent scale contrast is required. If the hero stat is 160px, the next largest element must be no larger than 32px. The gap must feel intentional and dramatic — not a gentle step, a cliff.
Cormorant Garamond is used exclusively for: hero stats, section headers, pull quotes, program names, chapter numbers. Never for body copy, labels, captions, or UI elements.
DM Sans is used exclusively for: body copy, labels, captions, metadata, navigation, timestamps. Never for display or headline text.
Numeric figures in Cormorant Garamond: always set font-variant-numeric: tabular-nums lining-nums for alignment and visual weight.
All uppercase DM Sans labels require letter-spacing: 0.12em minimum. Uppercase text without tracking is a red flag.
Line heights are non-negotiable: 1.1–1.2 for display text (hero stats, large headers), 1.65–1.75 for body text (DM Sans paragraphs). Never deviate. Line height is the difference between readable and claustrophobic.
Font weights: use Cormorant Garamond 300 (light) for large display text above 64px — the thinness of strokes at scale creates elegance. Use 600 for headers below 48px where weight creates authority. Use DM Sans 300 for body copy, 500 for labels and UI text.
Never mix more than 2 font weights in a single component or card.

SPATIAL SYSTEM — professional layouts are built on a grid, not intuition:
Base unit: 8px. Every padding, margin, gap, and offset must be a multiple of 8 (8, 16, 24, 32, 40, 48, 64, 80, 96, 128, 160). This creates invisible harmony that viewers feel without understanding.
Section vertical padding: 96px minimum. 128px for hero sections. 160px when the section needs to breathe and command attention.
Content max-width: 1200px for full visual layouts, 800px for narrative/document layouts, 480px for single-column portrait layouts. Always horizontally centered. Never full-width body text.
Column gutters: 40px minimum between grid columns.
The most important rule of spacing: more than you think. When you believe a section has enough whitespace, add 40% more. Generous spacing signals confidence. Cramped spacing signals fear.

COLOR APPLICATION — four tokens, infinite depth:
Never use any color at full opacity for large backgrounds. Use Midnight Ink at 100% only for full-bleed hero/cover sections. For secondary content areas: use rgba(27,43,58,0.06) as a tint on light backgrounds — this creates depth without introducing new colors.
Solar Gold (#E9C03A) is precious. It marks the single most important element per visual zone. One intentional use per section. Applied everywhere, it means nothing. Applied once, it stops the eye.
Color temperature is a design tool: a Midnight Ink section (cool, authoritative) followed by a Warm Stone section (warm, human) creates emotional rhythm. Alternate deliberately. Never randomly.
On dark backgrounds: primary text is Warm Stone (#EDE8DE) at 100% opacity. Secondary text (metadata, labels, captions) is Warm Stone at 55% opacity. Never pure white (#ffffff) — it vibrates against dark backgrounds and reads as cheap.
Cerulean (#3A6B8A) is structural: use for dividers, section markers, node fills, UI elements. Not for large backgrounds.
Tinted backgrounds: a section with background rgba(233,192,58,0.06) on Warm Stone creates a whisper of warmth that guides the eye without announcing itself. Use this technique.
Never put Solar Gold text on a Warm Stone background. Contrast ratio fails.

LAYOUT CRAFT — what separates gallery-quality from template-quality:
Asymmetry is a decision. At least one element per layout must intentionally break the grid: an oversized stat that bleeds beyond its column, a pull quote that spans into the margin, a color block that starts mid-grid and bleeds to the edge. Controlled asymmetry creates visual tension that keeps the viewer engaged.
The Z-pattern is real: high-value content (hero stat, critical quote) belongs at top-left and bottom-right. Design with eye movement in mind, not just content hierarchy.
Full-bleed color section transitions create rhythm without decoration. Never use <hr> or border-bottom dividers. Use background color change + generous spacing instead.
Overlap creates continuity: a typographic element (large initial, oversized number) that slightly overlaps the boundary between two sections creates visual flow. Use once per layout maximum.
The empty column: a two-column layout where one column is intentionally mostly empty except for a small label or single stat is a powerful sophistication signal. It says "we had the restraint not to fill this."
Every layout must have one moment that makes the viewer pause. One element that is dramatically larger, dramatically bolder, or dramatically more isolated than everything around it. Design toward that moment.

COMPONENT CRAFT — the details that signal $85k versus $850:
Metric displays: the number is the entire design. Strip everything else. Enormous number, tiny uppercase label beneath with tracking. No icons, no progress bars unless data explicitly provides targets, no decorative rings, no boxes, no shadows. The number alone, with enough scale, is the design.
Pull quotes: the opening quotation mark is a graphic element. Render it at 6rem–8rem in Solar Gold, positioned so the first line of quote text overlaps it slightly. The quote text itself at 1.6rem–2rem Cormorant Garamond italic. Attribution in 10px uppercase DM Sans with full tracking. Never put a pull quote in a bordered card.
Program cards: min-height always, never fixed height. CSS Grid auto rows. Cards must vary in size — a 2-column feature card alongside 1-column supporting cards. The variation creates hierarchy. Uniform grids signal templates.
Section headers: a 2px × 48px Solar Gold vertical rule positioned to the left of the header text, separated by 16px. Or a 1px × 64px horizontal rule beneath. Choose one system and hold it across every section header in the document. Never mix systems.
Background depth on dark surfaces: never flat. Use linear-gradient(135deg, #1a2f42 0%, #0d1a26 100%) as the base for dark sections. Use radial-gradient(ellipse at 30% 20%, #1e3448 0%, #0d1a26 70%) for hero/cover sections. The gradient is invisible at a glance but felt immediately.

MICRO-DETAILS that are invisible individually but collectively define quality:
CSS on all text elements: text-rendering: optimizeLegibility; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
CSS custom properties in :root for every color value. Never hardcode a color twice.
Hover transitions on interactive elements: 200ms ease. Never instant, never longer than 250ms.
Numbers that represent people: always Cormorant Garamond, always at least semi-bold, always with enough scale to feel like they matter. A number too small or too light says the data isn't important. A number given scale and weight says these people's stories matter.
Letter-spacing on the smallest text (10px–12px uppercase labels): 0.15em–0.20em. At small sizes, tracking improves readability and signals typographic intentionality.
Image treatment if org logo is present: never just drop the PNG. Display it at a consistent, small scale. On dark backgrounds: apply CSS filter: brightness(0) invert(1) if the logo appears to be dark-on-light, so it renders as white on dark. Note this in a comment.

NEVER DO THESE — each one is detectable from ten feet away as AI-generated or template-based:
Layout and positioning:
- position: absolute on text unless inside an explicitly bounded relative container with defined width AND height on the parent
- Fixed pixel heights (height: Npx) on any container holding text — use min-height always
- overflow: hidden on any text container
- Equal-height card grids — CSS Grid auto rows, let content drive height
- Generic box-shadow: 0 2px 4px rgba(0,0,0,0.1) — this is Bootstrap. Use either no shadow, or a deliberate colored shadow (e.g., box-shadow: 0 8px 32px rgba(27,43,58,0.4)) that fits the component
- z-index stacking that places text over a background without a contrast guarantee
Typography:
- Font sizes between 16px and 28px for anything functioning as a headline — there is no middle. Either body text (14px–16px) or headline text (32px+)
- Line height below 1.5 on any paragraph text
- More than 3 distinct font sizes inside a single card or panel
- Centered body copy — centered headings only, and even then, sparingly
- Uppercase text without letter-spacing
Structure and decoration:
- Horizontal rule dividers (<hr> or border-bottom between sections)
- Borders around stat cards, data cards, or metric displays
- Flat single-color full-page backgrounds — always introduce depth
- Any layout that could have been produced by a drag-and-drop website builder
- Placeholder text, lorem ipsum, or fabricated content for any missing data field — use the ⚠ flag system
- Icons next to stats — the number speaks for itself
- Progress bars unless target data is present and the comparison is meaningful`,
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
