// Prompt constants for POST /api/onboarding/parse-data
// Paste 2: extract period data matched to existing programs

export const PARSE_DATA_SYSTEM = `You are a nonprofit program data extraction specialist. Extract structured program data from the provided text, matching it to the provided program and metric definitions. Return ONLY valid JSON. No preamble, no explanation, no markdown fences. If data for a program cannot be found in the text, include it with null values and set "matched" to false.`;

export const PARSE_DATA_USER = (programsJson: string, rawText: string) =>
  `Extract period data from this text and match to the programs below.

Return JSON matching this exact schema:
{
  "period_label": string (e.g. "Q1 2026", "January 2026", "FY 2025"),
  "period_start": string (ISO date, e.g. "2026-01-01") | null,
  "period_end": string (ISO date, e.g. "2026-03-31") | null,
  "programs": [
    {
      "program_id": string (from the provided list),
      "program_name": string,
      "matched": boolean (true if data was found for this program),
      "outcomes": string | null (key outcomes as a brief narrative),
      "barriers": string | null (challenges faced),
      "client_voice": string | null (participant quote or voice — first name or role only, never full names),
      "change_description": string | null (what changed this period),
      "metrics": [
        {
          "metric_id": string (from the provided list),
          "value": string | null
        }
      ]
    }
  ]
}

Rules:
- Match data to programs by name similarity, not exact match
- For each program in the provided list, include an entry in the output
- If a program has no data in the paste, set matched: false and all fields to null
- For client_voice, use only first names or roles (e.g. "Maria", "a participant") — never full names
- Infer period_label from dates, headers, or context in the text
- If period dates can be inferred, provide ISO format; otherwise null

Programs to match against:
${programsJson}

Text to extract from:
${rawText}`;
