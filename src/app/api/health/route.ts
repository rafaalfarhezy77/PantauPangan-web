import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiSyncMetadata } from "@/lib/db/schema";
import { redisPing } from "@/lib/redis";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  const checks: {
    database: { status: "up" | "down"; latencyMs: number };
    redis: { status: "up" | "down" };
    sync: {
      lastSyncStatus: string | null;
      lastSyncedAt: string | null;
      seriesTracked: number;
    };
  } = {
    database: { status: "down", latencyMs: 0 },
    redis: { status: "down" },
    sync: { lastSyncStatus: null, lastSyncedAt: null, seriesTracked: 0 },
  };

  let isHealthy = true;

  // 1. Database Check
  try {
    const dbStart = Date.now();
    await db.execute(sql`SELECT 1`);
    checks.database.latencyMs = Date.now() - dbStart;
    checks.database.status = "up";
  } catch (err) {
    console.error("[Healthcheck] Database check failed:", err);
    checks.database.status = "down";
    isHealthy = false;
  }

  // 2. Redis Cache Check
  try {
    const redisOk = await redisPing();
    checks.redis.status = redisOk ? "up" : "down";
    if (!redisOk && process.env.UPSTASH_REDIS_REST_URL) {
      // In production with configured Redis, redis down means degraded
      isHealthy = false;
    }
  } catch {
    checks.redis.status = "down";
  }

  // 3. Sync Status Check
  try {
    const metaList = await db.select().from(apiSyncMetadata);
    checks.sync.seriesTracked = metaList.length;

    if (metaList.length > 0) {
      // Find latest sync timestamp
      const sorted = [...metaList].sort((a, b) => {
        const timeA = a.lastSyncedAt ? new Date(a.lastSyncedAt).getTime() : 0;
        const timeB = b.lastSyncedAt ? new Date(b.lastSyncedAt).getTime() : 0;
        return timeB - timeA;
      });
      checks.sync.lastSyncStatus = sorted[0].lastSyncStatus || "unknown";
      checks.sync.lastSyncedAt = sorted[0].lastSyncedAt
        ? new Date(sorted[0].lastSyncedAt).toISOString()
        : null;
    }
  } catch (err) {
    console.warn("[Healthcheck] Sync metadata check failed:", err);
  }

  const statusCode = isHealthy ? 200 : 503;
  const statusLabel = isHealthy ? "healthy" : "degraded";

  return NextResponse.json(
    {
      status: statusLabel,
      version: "v2.0.0",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || "development",
      responseTimeMs: Date.now() - startTime,
      checks,
    },
    { status: statusCode }
  );
}
