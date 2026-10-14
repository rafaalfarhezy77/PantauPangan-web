import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiSyncMetadata } from "@/lib/db/schema";
import { redisGet, redisSet } from "@/lib/redis";

export async function GET() {
  const cacheKey = "pantau:summary";

  try {
    const cached = await redisGet(cacheKey);
    if (cached) {
      return NextResponse.json({
        success: true,
        source: "cache",
        data: cached,
      });
    }

    const records = await db.select().from(apiSyncMetadata);

    // Cache di Redis selama 1 jam (3600 detik)
    await redisSet(cacheKey, records, 3600);

    return NextResponse.json({
      success: true,
      source: "database",
      data: records,
    });
  } catch (error) {
    console.error("[API /api/v1/summary] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
