import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// In-memory fallback map jika Upstash Redis belum dikonfigurasi
const memoryStore = new Map<string, { count: number; expiresAt: number }>();

let upstashRatelimit: Ratelimit | null = null;

function getUpstashRatelimiter(): Ratelimit | null {
  if (upstashRatelimit) return upstashRatelimit;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token && !url.includes("xxxx") && !token.includes("xxxx")) {
    try {
      const redis = new Redis({ url, token });
      upstashRatelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "60 s"),
        analytics: true,
        prefix: "pantau:ratelimit:login",
      });
      return upstashRatelimit;
    } catch {
      return null;
    }
  }

  return null;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetMs: number;
}

/**
 * Memeriksa batasan rate-limit login (maksimal 5 percobaan per menit per IP)
 */
export async function checkLoginRateLimit(ip: string): Promise<RateLimitResult> {
  const limiter = getUpstashRatelimiter();

  if (limiter) {
    try {
      const res = await limiter.limit(ip);
      return {
        success: res.success,
        remaining: res.remaining,
        resetMs: res.reset - Date.now(),
      };
    } catch {
      // Fallback ke in-memory jika Upstash error
    }
  }

  // Fallback in-memory
  const now = Date.now();
  const record = memoryStore.get(ip);

  if (!record || now > record.expiresAt) {
    memoryStore.set(ip, { count: 1, expiresAt: now + 60_000 });
    return { success: true, remaining: 4, resetMs: 60_000 };
  }

  if (record.count >= 5) {
    return {
      success: false,
      remaining: 0,
      resetMs: Math.max(0, record.expiresAt - now),
    };
  }

  record.count += 1;
  return {
    success: true,
    remaining: 5 - record.count,
    resetMs: Math.max(0, record.expiresAt - now),
  };
}
