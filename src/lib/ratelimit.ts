// Input length limits
export const MAX_RAW_INPUT_CHARS = 5000;
export const MAX_FIELD_CHARS = 2000;

// User-facing 429 message
export const RATE_LIMIT_MESSAGE =
  "You've reached the limit for now. Candela Assist allows up to 20 documents per hour to keep the tool available for everyone. Try again in a little while — your inputs are still here when you're ready.";

export interface RateLimitResult {
  limited: boolean;
  message?: string;
}

/**
 * Checks all three sliding-window rate limits (minute / hour / day).
 * Imports are deferred inside the function so nothing runs at build time.
 * Returns { limited: false } when Upstash env vars are absent (local dev).
 */
export async function checkRateLimit(
  identifier: string
): Promise<RateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return { limited: false };
  }

  try {
    // Dynamic imports — resolved at runtime, never at build time
    const { Redis } = await import("@upstash/redis");
    const { Ratelimit } = await import("@upstash/ratelimit");

    const redis = new Redis({ url, token });

    const [perMinute, perHour, perDay] = [
      new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "1 m"),
        prefix: "rl:min",
      }),
      new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(20, "1 h"),
        prefix: "rl:hr",
      }),
      new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(50, "1 d"),
        prefix: "rl:day",
      }),
    ];

    const [minResult, hrResult, dayResult] = await Promise.all([
      perMinute.limit(identifier),
      perHour.limit(identifier),
      perDay.limit(identifier),
    ]);

    if (!minResult.success || !hrResult.success || !dayResult.success) {
      return { limited: true, message: RATE_LIMIT_MESSAGE };
    }

    return { limited: false };
  } catch (err) {
    // Fail open — a Redis misconfiguration should never block document generation
    console.error("Rate limit check failed, allowing request:", err);
    return { limited: false };
  }
}
