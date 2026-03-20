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

    impact_command_center: `AUDIENCE: Funders, board members, sophisticated donors. Context: live meeting on a laptop — pulled up mid-conversation to answer "tell me about your programs." Job: let a funder explore every piece of data the org has at their own pace, drilling as deep as they want.

DESIGN INTENTION: This is mission control. Dark canvas, living constellation, data that reveals itself on demand. Nothing is hidden because there isn't enough space — everything is accessible because the interface is intelligent. A funder who spends 5 minutes in this view should feel like they have been given a complete picture of the organization. A funder who spends 20 minutes should feel like they have been given access to the organization's soul.

The principle: show identity first, then proof, then humanity. Every drill-down follows this sequence — who the program is for, then what the numbers say, then what a person who was changed by it has to say.

DATA COMPLETENESS MANDATE: Every field in the ImpactPayload must be accessible somewhere in this view. No data is hidden. If a program has 6 metrics, all 6 are visible. If a program has 4 outcome statements, all 4 are readable. If there are 3 client quotes, all 3 are accessible. The interface must be designed to accommodate ANY amount of data, not just a curated subset.

LEVEL 1 — THE CONSTELLATION (default view, full screen):

Canvas: full viewport, Midnight Ink with radial-gradient(ellipse at 48% 52%, #1e3448 0%, #0d1a26 75%). Subtle noise texture via CSS: background-image layered with url("data:image/svg+xml,...") at 3% opacity — adds depth without pattern.

D3.js force simulation setup:
<script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js"></script>
d3.forceSimulation with: forceManyBody strength -500, forceCenter at SVG center, forceCollide radius 100, forceLink for hub connections with distance 220. Let simulation run for 200 ticks then alpha(0) to freeze — nodes don't continuously move, they settle into position.

SVG fills full viewport. Position: fixed during Level 1, releases on drill-down.

PROGRAM NODES:
Each node: SVG <circle> radius 58px.
Fill: SVG <radialGradient> id unique per node — top-left highlight #4a8fb8 0%, Cerulean #3A6B8A 65%, #1a3d56 100%.
Filter: SVG <filter> feDropShadow dx=0 dy=6 stdDeviation=14 flood-color=#050e18 flood-opacity=0.7.
Outer ring: SVG <circle> radius 72px, stroke Cerulean 20% opacity, stroke-width 1px, fill none.
Active/hover ring: SVG <circle> radius 82px, stroke Solar Gold 0% opacity, stroke-width 1.5px, fill none. CSS transition stroke-opacity 200ms ease.

Node labels — NEVER use HTML over SVG:
Shadow text: SVG <text> fill #050e18 opacity 0.5 dy=1 — program name
Visible text: SVG <text> fill #EDE8DE — same program name
DM Sans 11px font-weight 500 letter-spacing 0.03em, text-anchor: middle, dominant-baseline: middle.
Truncate at 18 chars with ellipsis.
Below program name: SVG <text> fill Solar Gold opacity 0.9 font-size 18px Cormorant Garamond — the featured metric value. This is the only data visible at Level 1. Number only, no label. Positioned 20px below center.

CENTRAL HUB: SVG <circle> radius 72px. Deeper gradient version. Outer ring radius 88px Solar Gold 20% opacity. Second outer ring radius 104px Solar Gold 10% opacity — creates depth halo.
CSS keyframe pulse on outer rings: alternating scale(1)↔scale(1.06) over 3.5s infinite ease-in-out, staggered 1.75s between rings. The double-ring pulse feels alive, not mechanical.
If org.logo_url: SVG <image> width=90 height=90 centered, clipped to circle via <clipPath>.
If no logo: Org initials (max 2 chars) Cormorant Garamond 36px Warm Stone, centered in hub.

CONNECTIONS: SVG <line> per program-to-hub. SVG <linearGradient> stroke — Solar Gold 15% opacity at hub, transparent at node. stroke-width 1px.

SOLAR FLARE: setTimeout 25s loop. A new SVG <circle> created at hub center, radius animates 72→200px, opacity 0.5→0 over 1.4s via CSS animation class. Remove element after animation. Clear and restart timer on any user interaction.

PERIOD SELECTOR: Top-right fixed position. Background rgba(255,255,255,0.07) border 1px solid rgba(255,255,255,0.12) border-radius 6px padding 10px 20px. DM Sans 12px Warm Stone. Options = unique period_labels from all programs[].

"ALL PROGRAMS" TOGGLE: Top-left, same style as period selector. Switches to Level 3. Text: "Grid View"

AGENCY STATS BAR: Bottom of screen, full width, position fixed. Height 56px. Background rgba(13,26,38,0.85) backdrop-filter blur(12px). Border-top 1px solid rgba(255,255,255,0.06). Displays total participants across all programs as small stat chips: each chip shows sum of featured metrics per program. DM Sans 11px Warm Stone 60%, value in Solar Gold.

LEVEL 2 — PROGRAM DEEP DIVE (click any node):

Transition: clicked node expands — SVG circle radius animates 58→100px over 300ms, then entire SVG fades to opacity 0.15 over 200ms as detail panel takes over.

Detail panel: position fixed, right 0 top 0, width 62%, height 100vh. Background linear-gradient(160deg, #162433 0%, #0a1520 100%). Left border 3px solid Solar Gold. Enters via transform translateX(100%)→translateX(0) transition 380ms cubic-bezier(0.16, 1, 0.3, 1).

Panel has two zones: HEADER (fixed height) + SCROLLABLE CONTENT (overflow-y auto, custom scrollbar: 4px wide, Solar Gold 30% opacity track, Solar Gold 70% thumb).

PANEL HEADER (fixed, 100px):
Program name: Cormorant Garamond 38px weight 300 Warm Stone line-height 1.1, padding 28px 40px 0.
Period label: 10px uppercase DM Sans Warm Stone 40% letter-spacing 0.2em, padding 4px 40px 0.
"← Back" button: top-right 20px, 11px DM Sans Warm Stone 55%, hover Warm Stone 100%, transition 200ms.
Bottom of header: 1px border Solar Gold 25% opacity.

PANEL SCROLLABLE CONTENT (padding 32px 40px 64px):

BLOCK 1 — METRICS (full display, ALL metrics for this program):
Label: "Impact Numbers" 10px uppercase DM Sans Cerulean letter-spacing 0.2em, margin-bottom 20px.
CSS Grid: repeat(auto-fit, minmax(160px, 1fr)), gap 16px.
Each metric card: background rgba(255,255,255,0.05), border-radius 3px, padding 20px 24px, min-height unset — content drives height.
Value: Cormorant Garamond 52px Solar Gold line-height 0.95. Counter animates from 0 on panel open.
Label: 10px uppercase DM Sans Warm Stone 55% letter-spacing 0.15em, margin-top 8px.
Target if present: DM Sans 11px Warm Stone 30% margin-top 4px — "Target: [target]"
Featured metric card gets special treatment: border-left 2px solid Solar Gold, background rgba(233,192,58,0.06).
If metrics empty: ⚠ block.

BLOCK 2 — PROGRAM OVERVIEW:
Label: "About This Program" same label style.
Description: DM Sans 300 15px Warm Stone 80% line-height 1.75.

BLOCK 3 — OUTCOMES (ALL outcomes, not just first):
Label: "What We Achieved" same label style.
Each outcome as a separate line item — left border 2px solid Cerulean 40%, padding-left 16px, DM Sans 14px Warm Stone 85% line-height 1.65, margin-bottom 12px.
If outcomes empty: ⚠ block.

BLOCK 4 — BARRIERS (if present):
Label: "Challenges We Navigated" same label style.
Each barrier: left border 2px solid rgba(233,192,58,0.3), padding-left 16px, DM Sans 14px Warm Stone 65% line-height 1.65, margin-bottom 12px.

BLOCK 5 — WHAT CHANGED (if present):
Label: "What Shifted" same label style.
DM Sans 14px Warm Stone 75% line-height 1.75 font-style italic.

BLOCK 6 — CLIENT VOICES (ALL quotes, carousel with navigation):
Label: "In Their Words" same label style.
Quote display area: min-height 120px, position relative.
Active quote: Large quote mark 5rem Cormorant Garamond Solar Gold, positioned as background element. Quote text Cormorant Garamond italic 1.5rem Warm Stone line-height 1.55. Attribution 10px uppercase DM Sans Warm Stone 45% letter-spacing 0.2em.
If multiple quotes: quote counter "1 of 3" in 11px DM Sans Warm Stone 35%, navigation arrows in Solar Gold 60%, hover 100%. Previous/next cycle through client_voice array. CSS opacity transition 300ms between quotes.
If client_voice empty: ⚠ block.

LEVEL 3 — ALL PROGRAMS GRID (grid view toggle):

Transition from Level 1: SVG constellation fades to opacity 0 over 400ms. Grid fades in.
Transition back: reverse.

Layout: full screen, background matches canvas gradient. Padding 80px 64px. Content max-width 1400px centered.

Header: "All Programs" Cormorant Garamond 48px weight 300 Warm Stone, period label 11px DM Sans Warm Stone 40%. "← Constellation" button top-left.

Program cards grid: CSS Grid repeat(auto-fit, minmax(340px, 1fr)) gap 24px.

Each program card: background linear-gradient(145deg, #162433 0%, #0d1a26 100%), border-radius 4px, border-top 2px solid Solar Gold, padding 32px, cursor pointer.

Card content — ALL data visible without click:
- Program name: Cormorant Garamond 28px Warm Stone weight 300
- Featured metric: value Cormorant Garamond 64px Solar Gold line-height 0.9 + label 10px uppercase DM Sans
- ALL remaining metrics as a compact row: each metric value in DM Sans 500 18px Solar Gold + label 9px DM Sans Warm Stone 50%, separated by vertical dividers
- First outcome: DM Sans 13px Warm Stone 70% line-height 1.6, margin-top 16px, max 2 lines then fade out with gradient
- "Show more" link if outcomes has more than 1 item: 11px DM Sans Solar Gold, expands card inline
- Client quote preview: first 80 chars of client_voice[0] in Cormorant Garamond italic 14px Warm Stone 55%, if present
- Card hover: background lightens slightly, box-shadow 0 8px 40px rgba(0,0,0,0.4). Cursor pointer.
- Click card → opens Level 2 panel for that program (same panel behavior, Level 3 dims to 30% opacity behind it)

GLOBAL RULES FOR THIS VIEW:
- All JavaScript inline in HTML document
- Initialize D3 inside DOMContentLoaded
- CSS custom properties in :root for all colors
- No position: absolute for text — SVG <text> for node labels, transform-based transitions for panels
- Custom scrollbar on detail panel: thin, Solar Gold-tinted
- All metric counter animations use the same requestAnimationFrame easeOutCubic function
- Period selector change: re-renders Level 1 node featured metrics and Level 3 card data for selected period
- Google Fonts import in <head>
- text-rendering: optimizeLegibility and -webkit-font-smoothing: antialiased on all text
- max_tokens for this view: use full 16384 — this view requires complete HTML`,

    story_view: `AUDIENCE: Donors, board members, general public. Context: shared link replacing a printed annual report or used as a campaign page. Job: take someone on a complete emotional journey through the organization's impact — data arrives as you scroll, not before.

DESIGN INTENTION: Clean white canvas. The whiteness is intentional — it creates the sense that content is emerging from nothing, conjured by the scroll. Color is used surgically: Solar Gold for numbers that matter, Cerulean for structural moments, Midnight Ink for text that needs authority. Nothing is decorative. Every color use is a decision.

The scrollytelling is the product. Content does not sit on the page waiting — it arrives. Text blocks enter from alternating sides. Numbers materialize. Quotes slide into place. The viewer feels like they are calling the data into existence with their scrolling.

TECHNICAL FOUNDATION:
Use IntersectionObserver (threshold: 0.2) on every animated element. Each element starts in a hidden state via CSS class. When the observer fires, add the visible class which triggers CSS transitions. Never use setTimeout chains for sequencing — use CSS transition-delay on child elements within a triggered parent.

All entrance animations are CSS transitions. JS only adds/removes classes. Zero setTimeout animation chains.

REQUIRED CSS ANIMATION SYSTEM — define these classes in <style>:
.from-left { opacity: 0; transform: translateX(-60px); }
.from-right { opacity: 0; transform: translateX(60px); }
.from-below { opacity: 0; transform: translateY(40px); }
.from-above { opacity: 0; transform: translateY(-40px); }
.scale-in { opacity: 0; transform: scale(0.92); }
.from-left.visible, .from-right.visible, .from-below.visible, .from-above.visible, .scale-in.visible {
  opacity: 1; transform: none;
  transition: opacity 700ms cubic-bezier(0.16, 1, 0.3, 1), transform 700ms cubic-bezier(0.16, 1, 0.3, 1);
}
.delay-1 { transition-delay: 150ms; }
.delay-2 { transition-delay: 300ms; }
.delay-3 { transition-delay: 450ms; }
.delay-4 { transition-delay: 600ms; }
.delay-5 { transition-delay: 750ms; }

Apply IntersectionObserver to every element with a from-* or scale-in class. When it enters viewport, add "visible". Once visible, unobserve (no re-triggering on scroll back).

COUNTER ANIMATION: For metric numbers, use requestAnimationFrame with easeOutCubic. Extract numeric value from metric.value string — parse leading numbers, preserve units (%, $, +) as suffix. Count from 0 to target over 1800ms. Start counter when element receives "visible" class, not on page load.
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
function animateCounter(el, targetStr) {
  const match = targetStr.match(/^([^0-9]*)([0-9,.]+)(.*)$/);
  if (!match) { el.textContent = targetStr; return; }
  const prefix = match[1], numStr = match[2].replace(/,/g,''), suffix = match[3];
  const target = parseFloat(numStr);
  const isInt = !numStr.includes('.');
  const start = performance.now();
  const duration = 1800;
  function tick(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutCubic(progress);
    const current = target * eased;
    el.textContent = prefix + (isInt ? Math.round(current).toLocaleString() : current.toFixed(1)) + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

REQUIRED PAGE STRUCTURE:

SECTION 1 — OPENING (min-height: 100vh, white background #ffffff):
Layout: vertically centered content, max-width 900px, centered, padding 0 64px.
Elements and their entrance animations:
- Period label: 11px uppercase DM Sans letter-spacing 0.2em Cerulean — class "from-above"
- Org name: Cormorant Garamond 96px weight 300 Midnight Ink line-height 1.0 — class "from-below delay-1"
- Horizontal rule: 2px width 80px Solar Gold, centered — class "scale-in delay-2"
- Mission statement: Cormorant Garamond italic 24px Midnight Ink 70% opacity line-height 1.6 max-width 640px — class "from-below delay-3"
- Scroll prompt: 11px uppercase DM Sans letter-spacing 0.15em Midnight Ink 35% opacity — class "from-below delay-4". Below text: animated chevron, CSS keyframe translateY(0)→translateY(8px)→translateY(0) over 1.6s infinite.

SECTION 2 — IMPACT NUMBERS TEASER (min-height: 60vh, background #f8f8f6 — barely-there warm tint):
Purpose: before diving into programs, show the agency-level numbers. Creates anticipation.
Layout: CSS Grid, auto columns, gap 48px, max-width 1000px centered, padding 96px 64px.
For each program in programs[], show ONLY the featured metric (first where is_featured=true, else metrics[0]):
- Number: Cormorant Garamond 96px Solar Gold — class "from-below" with staggered delay per program (delay-1, delay-2, etc.)
- Label: 10px uppercase DM Sans letter-spacing 0.18em Midnight Ink 55% — class "from-below" matching delay
- Program name below label: 12px DM Sans Midnight Ink 40% — same delay
Counter animation fires when "visible" added.
Section label top: "This Period" in 10px uppercase DM Sans letter-spacing 0.2em Cerulean — class "from-above"

PER-PROGRAM SECTIONS — one section per item in programs[] (min-height: 100vh, white background):
Each section has a left column (45%) and right column (55%) layout via CSS Grid. Columns switch sides alternating: odd programs left=content right=quote, even programs left=quote right=content. This creates the visual rhythm of content coming from both sides.

LEFT/RIGHT CONTENT COLUMN (odd programs):
- Program number: "01", "02" etc in Cormorant Garamond 180px weight 300 Solar Gold 12% opacity — this is a background typographic element, positioned behind content via z-index, class "scale-in"
- Program name: Cormorant Garamond 52px weight 300 Midnight Ink line-height 1.1 — class "from-left" (odd) or "from-right" (even)
- Program description: DM Sans 300 17px Midnight Ink 65% line-height 1.75 — class "from-left delay-1" or "from-right delay-1"
- "Outcomes" label: 10px uppercase DM Sans Cerulean letter-spacing 0.2em with 2px × 32px Solar Gold vertical rule — class "from-left delay-2"
- Outcomes: DM Sans 16px Midnight Ink line-height 1.7 — class "from-left delay-3" or "from-right delay-3". If outcomes empty: ⚠ block.
- Barriers if present: "Challenges" in same label style, then DM Sans 15px Midnight Ink 60% — class "from-left delay-4"
- What changed if present: "What Changed" label, then DM Sans 15px — class "from-left delay-5"

RIGHT/QUOTE COLUMN (odd programs — swaps for even):
- Metrics block — each metric displayed vertically:
  Value: Cormorant Garamond 88px Solar Gold line-height 0.9 — class "from-right delay-1" (odd) or "from-left delay-1" (even). Counter animation fires on visible.
  Label: 10px uppercase DM Sans letter-spacing 0.18em Midnight Ink 55% — class "from-right delay-2"
  Target if present: DM Sans 12px Midnight Ink 35% — "Target: X"
  Each metric separated by 48px spacing.
- Client voice quote — below metrics, Solar Gold left border 3px, padding-left 24px:
  Quote text: Cormorant Garamond italic 1.7rem Midnight Ink line-height 1.55 — class "from-right delay-3"
  Attribution: 10px uppercase DM Sans Midnight Ink 45% letter-spacing 0.2em — class "from-right delay-4"
  If client_voice empty: ⚠ block styled amber left border, DM Sans 13px.

BETWEEN-PROGRAM DIVIDERS:
A full-width section, min-height 20vh, white background. Single centered element: program number in Cormorant Garamond 240px weight 300 Solar Gold 6% opacity. Class "scale-in". Creates breathing room and visual punctuation between programs.

JOURNEY TESTIMONIAL SECTION (min-height: 100vh):
Background: Midnight Ink #1B2B3A with radial-gradient(ellipse at 50% 50%, #1e3448 0%, #0d1a26 80%).
Content: max-width 800px centered, vertically centered via flexbox.
If org_testimonials not empty:
- Quote mark: 10rem Cormorant Garamond Solar Gold — class "scale-in", positioned so quote text appears to emerge from beneath it
- Quote text: Cormorant Garamond italic 2.6rem Warm Stone line-height 1.45 — class "from-below delay-1"
- Attribution: 11px uppercase DM Sans Warm Stone 45% letter-spacing 0.2em — class "from-below delay-2"
- Programs referenced note if programs_referenced not empty: 11px DM Sans Warm Stone 30% italic — "Journey spanning [program names]"
If org_testimonials empty: styled ⚠ block, amber border, Warm Stone text: "No journey testimonials entered — add one in your Data Area."

CLOSING SECTION (min-height: 80vh, white background):
Content max-width 800px centered, padding 128px 64px.
- Closing label: "The Work Continues" in 10px uppercase DM Sans Cerulean letter-spacing 0.2em — class "from-above"
- AI-generated closing statement from all programs' outcomes combined: Cormorant Garamond 48px weight 300 Midnight Ink line-height 1.3 — class "from-below delay-1"
- Forward-looking sentence: DM Sans 300 18px Midnight Ink 60% line-height 1.7 — class "from-below delay-2"
- Org logo if present, 32px height, centered — class "scale-in delay-3"
- "Powered by Candela · candela.education" 11px DM Sans Midnight Ink 30% centered — unless suppressed

GLOBAL PAGE RULES:
- Background: white (#ffffff) throughout except Teaser section (#f8f8f6) and Testimonial section (Midnight Ink gradient)
- Body: max-width none — sections are full-width with internal max-width containers
- Google Fonts import required in <head>
- All CSS in <style> block, all JS inline before </body>
- CSS custom properties in :root for all colors
- text-rendering: optimizeLegibility and -webkit-font-smoothing: antialiased on all text
- Sections must have position: relative and overflow: visible — never overflow: hidden on section containers
- D3.js not needed for this view — vanilla JS only
- Period filter: applies to all program sections. Testimonial section is not period-filtered.`,
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
      force_regenerate,
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
      force_regenerate?: boolean;
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

    // Cache check — only returns existing output if view_type AND data IDs match
    if (!force_regenerate && selectedViews.length === 1 && programDataIds?.length) {
      const cacheViewType = selectedViews[0];
      const sortedIncoming = [...programDataIds].sort().join(",");

      // Find recent runs that used the same selected data points
      const { data: recentRuns } = await supabase
        .from("project_runs")
        .select("id, selected_data_points")
        .order("created_at", { ascending: false })
        .limit(20);

      if (recentRuns) {
        const matchingRun = recentRuns.find((run) => {
          const stored = Array.isArray(run.selected_data_points)
            ? [...(run.selected_data_points as string[])].sort().join(",")
            : "";
          return stored === sortedIncoming;
        });

        if (matchingRun) {
          const { data: cachedView } = await supabase
            .from("generated_views")
            .select("output_html")
            .eq("run_id", matchingRun.id)
            .eq("view_type", cacheViewType)
            .limit(1)
            .single();

          if (cachedView?.output_html) {
            return new Response(
              JSON.stringify({ outputs: { [cacheViewType]: cachedView.output_html }, cached: true }),
              { headers: { "Content-Type": "application/json", "X-Cache": "HIT" } }
            );
          }
        }
      }
    }

    // Generate — streaming for single views, parallel for multi
    const viewType = selectedViews[0];

    if (selectedViews.length === 1) {
      const prompt = prompts[viewType];
      if (!prompt) {
        return NextResponse.json({ outputs: { [viewType]: `<p>Unknown view type: ${viewType}</p>` } });
      }

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

      const maxTokens = (viewType === "impact_command_center" || viewType === "story_view") ? 10000 : 8192;

      const stream = client.messages.stream({
        model: "claude-sonnet-4-20250514",
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });

      const encoder = new TextEncoder();

      const readable = new ReadableStream({
        async start(controller) {
          try {
            let fullHtml = "";

            for await (const event of stream) {
              if (
                event.type === "content_block_delta" &&
                event.delta.type === "text_delta"
              ) {
                const text = event.delta.text;
                fullHtml += text;
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ chunk: text })}\n\n`)
                );
              }
            }

            // Strip code fences if present
            const fenceMatch = fullHtml.match(/```(?:html)?\s*([\s\S]*?)```/);
            if (fenceMatch) fullHtml = fenceMatch[1].trim();

            // Send done signal with complete HTML
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ done: true, html: fullHtml })}\n\n`)
            );
            controller.close();
          } catch (err) {
            console.error("Stream error:", err);
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ error: "Generation failed" })}\n\n`)
            );
            controller.close();
          }
        },
      });

      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Multi-view fallback (non-streaming)
    const results = await Promise.all(
      selectedViews.map(async (vt) => {
        const prompt = prompts[vt];
        if (!prompt) return { viewType: vt, html: `<p>Unknown view type: ${vt}</p>` };

        const systemPrompt = [
          `You are the creative director at a boutique studio that charges $85,000 for a nonprofit annual report.`,
          ``,
          `VISUAL THEME:\n${themeInstructions}`,
          ``,
          colorDirective,
          ``,
          identityDirective,
          ``,
          `Return ONLY the complete HTML document. No markdown, no explanation, no code fences. Start with <!DOCTYPE html>.`,
        ].join("\n");
        const userPrompt = payload
          ? `${prompt}\n\n${dataBlock}\n\nGenerate a complete, self-contained HTML document for:\n- view_type: ${vt}\n- theme: ${theme_id ?? theme ?? "candela-classic"}`
          : `${prompt}\n\n${dataBlock}`;

        const message = await client.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 8192,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        });

        const content = message.content[0];
        let html = content.type === "text" ? content.text.trim() : "";
        const fenceMatch = html.match(/```(?:html)?\s*([\s\S]*?)```/);
        if (fenceMatch) html = fenceMatch[1].trim();
        return { viewType: vt, html };
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
