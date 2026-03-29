// Prompt constants for POST /api/onboarding/parse-org
// Paste 1: extract org structure from raw text (About page, grant app, annual report, etc.)

export const PARSE_ORG_SYSTEM = `You are a nonprofit data extraction specialist. Extract structured information from the provided text about a nonprofit organization. Return ONLY valid JSON matching the exact schema provided. No preamble, no explanation, no markdown fences. If a field cannot be determined from the text, use null. For programs, extract up to 6 programs with up to 5 metrics each.`;

export const PARSE_ORG_USER = (rawText: string) => `Extract the following from this nonprofit text and return as JSON:
{
  "org_name": string,
  "legal_name": string | null,
  "mission": string,
  "mission_short": string (max 25 words, a punchy summary),
  "org_type": "501c3" | "501c4" | "fiscal_sponsored" | "other" | null,
  "geography": {
    "city": string | null,
    "state": string | null,
    "region": string | null
  },
  "website": string | null,
  "population_served": string,
  "brand_voice": string (one or two words describing the tone, e.g. "warm and professional", "bold and urgent"),
  "programs": [
    {
      "name": string,
      "description": string,
      "population_served": string,
      "metrics": [
        {
          "metric_name": string,
          "unit": string | null,
          "target_value": string | null
        }
      ]
    }
  ]
}

Rules:
- Extract up to 6 programs maximum
- Extract up to 5 metrics per program
- For metrics, infer reasonable ones from context if not explicitly stated (e.g. "clients served", "completion rate")
- population_served should describe who the org/program serves (e.g. "low-income families", "formerly incarcerated adults")
- mission_short must be 25 words or fewer
- org_type: infer from context clues (most US nonprofits are 501c3)

Text to extract from:
${rawText}`;
