import { NextRequest, NextResponse } from "next/server";
import { checkAndRunDeltaSync } from "@/lib/api-indonesia/sync-engine";
import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";

async function handleSync(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    const isVercelCronHeader = request.headers.get("x-vercel-cron") === "1";

    const isAuthorized =
      (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
      isVercelCronHeader ||
      process.env.NODE_ENV === "development";

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak: Bearer CRON_SECRET tidak valid" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const forceFullSync = searchParams.get("force") === "true";

    console.log(`[CronSync] Memulai sinkronisasi otomatis (force=${forceFullSync})...`);
    const result = await checkAndRunDeltaSync({ forceFullSync });

    // Catat log audit sinkronisasi
    try {
      await db.insert(auditLogs).values({
        actorId: null,
        action: "cron_delta_sync_executed",
        targetType: "api_sync_metadata",
        targetId: "cron_auto",
        metadataJson: JSON.stringify(result),
      });
    } catch {}

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result,
    });
  } catch (error) {
    console.error("[CronSync] Error during cron execution:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

// Vercel Cron default menggunakan HTTP GET
export async function GET(request: NextRequest) {
  return handleSync(request);
}

export async function POST(request: NextRequest) {
  return handleSync(request);
}
