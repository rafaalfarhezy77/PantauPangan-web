import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { provinces } from "@/lib/db/schema";
import { syncProvincesIfEmpty } from "@/lib/api-indonesia/sync-engine";
import { asc } from "drizzle-orm";

export async function GET() {
  try {
    await syncProvincesIfEmpty();
    const rows = await db.select().from(provinces).orderBy(asc(provinces.name));

    return NextResponse.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("[API /api/v1/provinces] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || "Failed to fetch provinces",
      },
      { status: 500 }
    );
  }
}
