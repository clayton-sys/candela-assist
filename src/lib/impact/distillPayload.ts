import Anthropic from "@anthropic-ai/sdk";
import type { ImpactPayload } from "@/lib/types/impact-payload";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const DISTILL_SYSTEM =
  "You are a data distillation assistant. You extract and restructure nonprofit program data into precise JSON contracts for downstream HTML generation. Respond with valid JSON only. No markdown fences, no preamble, no explanation. Output must be parseable by JSON.parse().";

async function callDistill(userPrompt: string): Promise<string> {
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: DISTILL_SYSTEM,
    messages: [{ role: "user", content: userPrompt }],
  });

  const content = message.content[0];
  const responseText = content.type === "text" ? content.text.trim() : "";

  // Strip markdown code fences if Haiku wraps them despite instructions
  const raw = responseText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

  // Validate it parses
  JSON.parse(raw);
  return raw;
}

export async function distillForSnapshot(payload: ImpactPayload): Promise<string> {
  const userPrompt = `Extract a distilled data contract from this nonprofit impact data for a clean one-page Impact Snapshot view.

Rules:
- mission_short: 1 sentence, max 25 words
- headline_stats: aggregate total participants across all programs as a number, plus 1-2 other org-level stats if available
- programs: include all programs, one_line_outcome is the single most impressive outcome in max 20 words
- headline_metric: the single most impressive featured metric per program
- featured_quote: the most emotionally compelling client quote across all programs

Return this exact JSON shape:
{
  "org_name": "string",
  "mission_short": "string",
  "period_label": "string",
  "primary_color": "hex string",
  "headline_stats": [{ "label": "string", "value": "string" }],
  "programs": [{
    "name": "string",
    "one_line_outcome": "string",
    "headline_metric": { "label": "string", "value": "string" }
  }],
  "featured_quote": { "text": "string", "attribution": "string" }
}

Data:
${JSON.stringify(payload, null, 2)}`;

  try {
    return await callDistill(userPrompt);
  } catch (err) {
    console.error("[distillForSnapshot] error:", err);
    return JSON.stringify(payload);
  }
}

export async function distillForStoryView(payload: ImpactPayload): Promise<string> {
  const userPrompt = `Extract a distilled data contract from this nonprofit impact data for a scrollytelling Story View.

Rules:
- narrative_paragraph: 3-4 sentences, active voice, first person plural (We served... Our participants...)
- counter_metrics: max 3 per program, numbers only — separate value from unit. Examples: value: 89, unit: "%", prefix: null OR value: 21.40, unit: "/hr", prefix: "$"
- pull_quote: most human and emotional quote, max 35 words
- change_note: 1 sentence, what changed or improved this period
- closing_quote: best single org_testimonial, or best client quote if no testimonials

Return this exact JSON shape:
{
  "org_name": "string",
  "period_label": "string",
  "primary_color": "hex string",
  "programs": [{
    "name": "string",
    "narrative_paragraph": "string",
    "counter_metrics": [{ "label": "string", "value": "number", "unit": "string", "prefix": "string or null" }],
    "pull_quote": { "text": "string", "attribution": "string" },
    "change_note": "string"
  }],
  "closing_quote": { "text": "string", "attribution": "string" }
}

Data:
${JSON.stringify(payload, null, 2)}`;

  try {
    return await callDistill(userPrompt);
  } catch (err) {
    console.error("[distillForStoryView] error:", err);
    return JSON.stringify(payload);
  }
}

export async function distillForICC(payload: ImpactPayload): Promise<string> {
  const userPrompt = `Extract a distilled data contract from this nonprofit impact data for an Impact Command Center — a D3 force constellation visualization.

Rules:
- summary_stats.total_participants: sum participant counts across all programs using numeric reasoning on metric values
- summary_stats.active_programs: count of distinct program names
- node_label: 2-3 word max label for the constellation node
- top_metrics: max 3 per program, featured metrics first
- outcome_bullets: max 3 per program, most quantified outcomes first
- quotes: max 2 per program, max 30 words each
- barrier_summary: 1 sentence, most urgent barrier
- solar_flare_quote: use org_testimonials if available, otherwise best single client quote across all programs

Return this exact JSON shape:
{
  "org_name": "string",
  "mission_short": "string, max 20 words",
  "period_label": "string",
  "primary_color": "hex string",
  "secondary_color": "hex string",
  "summary_stats": {
    "total_participants": "number",
    "active_programs": "number",
    "period_label": "string"
  },
  "programs": [{
    "id": "string",
    "name": "string",
    "node_label": "string",
    "headline_metric": { "label": "string", "value": "string" },
    "top_metrics": [{ "label": "string", "value": "string", "target": "string or null" }],
    "outcome_bullets": ["string"],
    "quotes": [{ "text": "string", "attribution": "string" }],
    "barrier_summary": "string"
  }],
  "solar_flare_quote": { "text": "string", "attribution": "string" }
}

Data:
${JSON.stringify(payload, null, 2)}`;

  try {
    return await callDistill(userPrompt);
  } catch (err) {
    console.error("[distillForICC] error:", err);
    return JSON.stringify(payload);
  }
}

export async function distillForBoardReport(payload: ImpactPayload): Promise<string> {
  const userPrompt = `Extract a distilled data contract from this nonprofit impact data for a formal Board Report.

Rules:
- executive_summary: 3-4 sentences written for a board audience — outcomes, not activities. Professional tone.
- program summaries: 2-3 sentences in professional third-person
- met_target: true if value meets or exceeds target, false if below, null if no target
- highlight: single most noteworthy quantified achievement per program
- period_over_period_note: 1 sentence comparing to prior period if multiple period_labels exist in data, otherwise null

Return this exact JSON shape:
{
  "org_name": "string",
  "mission": "string",
  "period_label": "string",
  "primary_color": "hex string",
  "executive_summary": "string",
  "programs": [{
    "name": "string",
    "summary": "string",
    "key_metrics": [{ "label": "string", "value": "string", "target": "string or null", "met_target": "boolean or null" }],
    "highlight": "string"
  }],
  "featured_quote": { "text": "string", "attribution": "string" },
  "period_over_period_note": "string or null"
}

Data:
${JSON.stringify(payload, null, 2)}`;

  try {
    return await callDistill(userPrompt);
  } catch (err) {
    console.error("[distillForBoardReport] error:", err);
    return JSON.stringify(payload);
  }
}

export async function distillForStaffDashboard(payload: ImpactPayload): Promise<string> {
  const userPrompt = `Extract a distilled data contract from this nonprofit impact data for an internal Staff Dashboard.

Rules:
- status: derive by comparing metrics to targets. on-track if 90%+ of targets met. at-risk if 70-89%. needs-attention if below 70% or no targets set.
- metrics: max 5 per program
- barrier_flag: most urgent barrier in 1 sentence, null if no significant barriers
- alerts: only programs with at-risk or needs-attention status. max 1 alert per program.

Return this exact JSON shape:
{
  "org_name": "string",
  "period_label": "string",
  "primary_color": "hex string",
  "programs": [{
    "name": "string",
    "status": "on-track | at-risk | needs-attention",
    "metrics": [{ "label": "string", "value": "string", "target": "string or null", "delta": "string or null" }],
    "barrier_flag": "string or null",
    "change_note": "string"
  }],
  "alerts": [{ "program": "string", "message": "string" }]
}

Data:
${JSON.stringify(payload, null, 2)}`;

  try {
    return await callDistill(userPrompt);
  } catch (err) {
    console.error("[distillForStaffDashboard] error:", err);
    return JSON.stringify(payload);
  }
}

export async function distillForImpactJourney(payload: ImpactPayload): Promise<string> {
  const userPrompt = `Extract a distilled data contract from this nonprofit impact data for an Impact Journey — a scroll-based narrative digital impact report.

Rules:
- opening_statement: 2 sentences, the org's impact this period in warm human terms. Suitable for an annual report opening.
- section_headline: 6-8 words, compelling and human — not a program description
- narrative: 4-5 sentences in first person plural (Our clients... We served...). Tells the story of this program this period. Warm, not clinical.
- stat_callouts: max 3 per program, most impressive numbers only
- closing_statement: 2 sentences, forward-looking and mission-affirming

Return this exact JSON shape:
{
  "org_name": "string",
  "mission": "string",
  "period_label": "string",
  "primary_color": "hex string",
  "opening_statement": "string",
  "programs": [{
    "name": "string",
    "section_headline": "string",
    "narrative": "string",
    "stat_callouts": [{ "value": "string", "label": "string" }],
    "quote": { "text": "string, max 40 words", "attribution": "string" }
  }],
  "closing_statement": "string"
}

Data:
${JSON.stringify(payload, null, 2)}`;

  try {
    return await callDistill(userPrompt);
  } catch (err) {
    console.error("[distillForImpactJourney] error:", err);
    return JSON.stringify(payload);
  }
}

export async function distillForTerminal(payload: ImpactPayload): Promise<string> {
  const userPrompt = `Extract a distilled data contract from this nonprofit impact data for an Impact Terminal — a Bloomberg-style trading terminal dashboard.

Rules:
- ticker: 3-4 char uppercase abbreviation of program name (Job Readiness Training → JRT, Financial Coaching → FCS)
- status_flag: ON_TRACK if majority of metrics meet/exceed targets, AT_RISK if mixed, ALERT if majority miss or no targets
- delta for metrics: UP if value meets or exceeds target, DOWN if below target, FLAT if no target
- delta_value: percentage or absolute difference vs target, e.g. "+12% vs target" or null if no target
- outcome_lines: max 2, short and data-dense, under 15 words each
- quote: max 25 words, most impactful
- ticker_feed: generate 6-8 short terminal-style data strings, e.g. "JRT ↑ 89% placement rate Q1" or "FCS $387K debt eliminated" — these scroll across the bottom of the terminal
- total_participants: sum participant counts across all programs

Return this exact JSON shape:
{
  "org_name": "string",
  "period_label": "string",
  "primary_color": "hex string",
  "terminal_header": {
    "total_participants": "number",
    "active_programs": "number",
    "period_label": "string",
    "org_status": "ACTIVE"
  },
  "programs": [{
    "id": "string",
    "ticker": "string",
    "name": "string",
    "status_flag": "ON_TRACK | AT_RISK | ALERT",
    "headline_metric": { "label": "string", "value": "string", "delta": "UP | DOWN | FLAT" },
    "metrics": [{ "label": "string", "value": "string", "target": "string or null", "delta": "UP | DOWN | FLAT", "delta_value": "string or null" }],
    "outcome_lines": ["string"],
    "barrier": "string",
    "quote": { "text": "string", "attribution": "string" }
  }],
  "ticker_feed": ["string"]
}

Data:
${JSON.stringify(payload, null, 2)}`;

  try {
    return await callDistill(userPrompt);
  } catch (err) {
    console.error("[distillForTerminal] error:", err);
    return JSON.stringify(payload);
  }
}
