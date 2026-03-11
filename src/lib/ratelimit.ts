import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Input length limits
export const MAX_RAW_INPUT_CHARS = 5000;
export const MAX_FIELD_CHARS = 2000;

// User-facing 429 message
export const RATE_LIMIT_MESSAGE =
  "You've reached the limit for now. Candela Assist allows up to 20 documents per hour to keep the tool available for everyone. Try again in a little while — your inputs are still here when you're ready.";

// Only initialise Redis/limiters if credentials are present.
// During local dev without Upstash env vars the check below is skipped gracefully.
function makeRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const redis = makeRedis();

const perMinute = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 m"),
      prefix: "rl:min",
    })
  : null;

const perHour = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "1 h"),
      prefix: "rl:hr",
    })
  : null;

const perDay = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(50, "1 d"),
      prefix: "rl:day",
    })
  : null;

export interface RateLimitResult {
  limited: boolean;
  message?: string;
}

/**
 * Checks all three windows (minute / hour / day) for the given identifier.
 * Returns { limited: false } if any window is not yet initialised (no Upstash
 * credentials) so the app works normally in local dev.
 */
export async function checkRateLimit(
  identifier: string
): Promise<RateLimitResult> {
  if (!perMinute || !perHour || !perDay) {
    return { limited: false };
  }

  const [minResult, hrResult, dayResult] = await Promise.all([
    perMinute.limit(identifier),
    perHour.limit(identifier),
    perDay.limit(identifier),
  ]);

  if (!minResult.success || !hrResult.success || !dayResult.success) {
    return { limited: true, message: RATE_LIMIT_MESSAGE };
  }

  return { limited: false };
}
