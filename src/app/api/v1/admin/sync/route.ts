import { NextRequest, NextResponse } from "next/server";
import { checkAndRunDeltaSync } from "@/lib/api-indonesia/sync-engine";
import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";

export async function POST(request: NextRequest) {
  try {
    // Verifikasi autorisasi (Bearer CRON_SECRET atau Header x-admin-key)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    const isAuthorizedViaCron =
      cronSecret &&
      authHeader &&
      authHeader === `Bearer ${cronSecret}`;

    // Catatan: Pada sprint auth berikutnya, session cookie admin juga divalidasi di sini.
    const isDev = process.env.NODE_ENV === "development";

    if (!isAuthorizedViaCron && !isDev) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Invalid or missing authorization token.",
        },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const forceFullSync = Boolean(body.forceFullSync);

    console.log(`[API /admin/sync] Starting delta sync (force=${forceFullSync})...`);

    const startTime = Date.now();
    const syncResult = await checkAndRunDeltaSync({ forceFullSync });
    const durationMs = Date.now() - startTime;

    // Catat log audit
    try {
      await db.insert(auditLogs).values({
        action: "delta_sync_executed",
        targetType: "api_sync_metadata",
        targetId: "all_series",
        metadataJson: JSON.stringify({
          durationMs,
          ...syncResult,
        }),
      });
    } catch (auditErr) {
      console.warn("[API /admin/sync] Failed to record audit log:", auditErr);
    }

    return NextResponse.json({
      success: true,
      message: "Smart Delta Sync executed successfully",
      durationMs,
      data: syncResult,
    });
  } catch (error) {
    console.error("[API /admin/sync] Sync execution failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || "Internal server error during sync",
      },
      { status: 500 }
    );
  }
}
