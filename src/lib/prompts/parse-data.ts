// Prompt constants for POST /api/onboarding/parse-data

export const PARSE_DATA_SYSTEM = `You are a nonprofit program data extraction specialist. Extract structured program data from the provided text. Match data to the provided program list. Return ONLY valid JSON. No preamble, no explanation, no markdown fences.`;

export const PARSE_DATA_USER = (programsJson: string, rawText: string) =>
  `Extract period data from this text and match to the programs below. Return JSON:
{
  "programs": [
    {
      "program_id": string (from provided list),
      "outcomes": string | null,
      "barriers": string | null,
      "change_description": string | null,
      "client_voice": string | null,
      "metrics": [
        {
          "metric_id": string (from provided list),
          "value": string | null
        }
      ]
    }
  ]
}

Programs to match against:
${programsJson}

Text to extract from:
${rawText}`;
