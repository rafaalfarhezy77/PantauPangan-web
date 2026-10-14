import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { userWatchlists, commodities } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import crypto from "crypto";

export async function GET() {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const items = await db
      .select({
        id: userWatchlists.id,
        commodityId: userWatchlists.commodityId,
        commodityName: commodities.displayName,
        commoditySlug: commodities.slug,
        level: userWatchlists.level,
        provinceCode: userWatchlists.provinceCode,
        targetMinPrice: userWatchlists.targetMinPrice,
        targetMaxPrice: userWatchlists.targetMaxPrice,
        alertOnAnomaly: userWatchlists.alertOnAnomaly,
        createdAt: userWatchlists.createdAt,
      })
      .from(userWatchlists)
      .innerJoin(commodities, eq(userWatchlists.commodityId, commodities.id))
      .where(eq(userWatchlists.userId, user.id));

    return NextResponse.json({ success: true, data: items });
  } catch (err) {
    console.error("[Watchlist GET] Error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch watchlist" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Silakan masuk terlebih dahulu untuk memantau komoditas.",
        },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
      commodityId,
      level = "konsumen",
      provinceCode = null,
      targetMinPrice = null,
      targetMaxPrice = null,
      alertOnAnomaly = true,
    } = body;

    if (!commodityId) {
      return NextResponse.json(
        { success: false, error: "commodityId is required" },
        { status: 400 }
      );
    }

    // Cek apakah sudah ada di watchlist
    const existing = await db
      .select()
      .from(userWatchlists)
      .where(
        and(
          eq(userWatchlists.userId, user.id),
          eq(userWatchlists.commodityId, Number(commodityId)),
          eq(userWatchlists.level, level)
        )
      )
      .limit(1);

    if (existing[0]) {
      // Toggle off / update
      if (body.remove) {
        await db
          .delete(userWatchlists)
          .where(eq(userWatchlists.id, existing[0].id));
        return NextResponse.json({
          success: true,
          message: "Komoditas dihapus dari pantauan",
          isWatching: false,
        });
      }

      await db
        .update(userWatchlists)
        .set({
          provinceCode: provinceCode || null,
          targetMinPrice: targetMinPrice ? Number(targetMinPrice) : null,
          targetMaxPrice: targetMaxPrice ? Number(targetMaxPrice) : null,
          alertOnAnomaly: Boolean(alertOnAnomaly),
        })
        .where(eq(userWatchlists.id, existing[0].id));

      return NextResponse.json({
        success: true,
        message: "Pengaturan pantauan diperbarui",
        isWatching: true,
      });
    }

    // Tambah baru
    await db.insert(userWatchlists).values({
      id: crypto.randomUUID(),
      userId: user.id,
      commodityId: Number(commodityId),
      level,
      provinceCode: provinceCode || null,
      targetMinPrice: targetMinPrice ? Number(targetMinPrice) : null,
      targetMaxPrice: targetMaxPrice ? Number(targetMaxPrice) : null,
      alertOnAnomaly: Boolean(alertOnAnomaly),
    });

    return NextResponse.json({
      success: true,
      message: "Komoditas berhasil ditambahkan ke daftar pantauan",
      isWatching: true,
    });
  } catch (err) {
    console.error("[Watchlist POST] Error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to update watchlist" },
      { status: 500 }
    );
  }
}
