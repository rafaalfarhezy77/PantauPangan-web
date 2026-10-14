import { Redis } from "@upstash/redis";

let redisInstance: Redis | null = null;

function getRedis(): Redis | null {
  if (redisInstance) return redisInstance;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token && !url.includes("xxxx") && !token.includes("xxxx")) {
    try {
      redisInstance = new Redis({ url, token });
      return redisInstance;
    } catch (err) {
      console.warn("[Redis] Failed to initialize Upstash Redis:", err);
      return null;
    }
  }

  return null;
}

export async function redisGet<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;
  try {
    const data = await redis.get<T>(key);
    return data ?? null;
  } catch (err) {
    console.warn(`[Redis] Error getting key ${key}:`, err);
    return null;
  }
}

export async function redisSet(
  key: string,
  value: unknown,
  exSeconds: number = 3600
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.set(key, value, { ex: exSeconds });
  } catch (err) {
    console.warn(`[Redis] Error setting key ${key}:`, err);
  }
}

export async function redisDel(...keys: string[]): Promise<void> {
  const redis = getRedis();
  if (!redis || keys.length === 0) return;
  try {
    await redis.del(...keys);
  } catch (err) {
    console.warn(`[Redis] Error deleting keys:`, err);
  }
}

export async function redisDelByPattern(pattern: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    console.warn(`[Redis] Error deleting pattern ${pattern}:`, err);
  }
}
