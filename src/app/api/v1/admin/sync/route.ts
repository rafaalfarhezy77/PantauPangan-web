import { NextRequest, NextResponse } from "next/server";
import { checkAndRunDeltaSync } from "@/lib/api-indonesia/sync-engine";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { apiSyncMetadata, auditLogs } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Akses ditolak: Hanya untuk administrator" },
        { status: 403 }
      );
    }

    // 1. Ambil 4 matriks sinkronisasi dari api_sync_metadata
    const metadata = await db.select().from(apiSyncMetadata);

    // 2. Ambil riwayat audit log sinkronisasi terakhir
    const history = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.action, "delta_sync_executed"))
      .orderBy(desc(auditLogs.createdAt))
      .limit(15);

    return NextResponse.json({
      success: true,
      metadata,
      history,
    });
  } catch (error) {
    console.error("[API /admin/sync GET] Error:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verifikasi autorisasi (Session Admin atau Bearer CRON_SECRET)
    const session = await getSession();
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    const isAuthorizedViaCron =
      cronSecret &&
      authHeader &&
      authHeader === `Bearer ${cronSecret}`;

    const isAdmin = session?.role === "admin";
    const isDev = process.env.NODE_ENV === "development";

    if (!isAdmin && !isAuthorizedViaCron && !isDev) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Akses ditolak. Hanya untuk administrator.",
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

    // Catat log audit eksekusi sync
    try {
      await db.insert(auditLogs).values({
        actorId: session?.id || null,
        action: "delta_sync_executed",
        targetType: "api_sync_metadata",
        targetId: "all_series",
        metadataJson: JSON.stringify({
          durationMs,
          triggeredBy: session?.username || "cron_or_dev",
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
