// Prompt constants for POST /api/onboarding/parse-org

export const PARSE_ORG_SYSTEM = `You are a nonprofit data extraction specialist. Extract structured information from the provided text. Return ONLY valid JSON matching the exact schema provided. No preamble, no explanation, no markdown fences.`;

export const PARSE_ORG_USER = (rawText: string) => `Extract the following from this nonprofit text and return as JSON:
{
  "org_name": string | null,
  "legal_name": string | null,
  "mission": string | null,
  "mission_short": string (max 25 words) | null,
  "programs": [
    {
      "name": string,
      "description": string,
      "population_served": string | null,
      "geography": string | null,
      "suggested_metrics": [{ "name": string, "unit": string }]
    }
  ],
  "primary_color": string (hex) | null,
  "secondary_color": string (hex) | null,
  "brand_voice_notes": string | null
}

Text to extract from:
${rawText}`;
