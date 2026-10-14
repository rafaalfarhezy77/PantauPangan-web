import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { userWatchlists, commodities, provinces, commodityPrices } from "@/lib/db/schema";
import { and, eq, desc } from "drizzle-orm";
import crypto from "crypto";

export async function GET() {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Silakan masuk terlebih dahulu" },
        { status: 401 }
      );
    }

    const items = await db
      .select({
        id: userWatchlists.id,
        commodityId: userWatchlists.commodityId,
        commodityName: commodities.displayName,
        commoditySlug: commodities.slug,
        commodityCategory: commodities.category,
        commodityUnit: commodities.unit,
        commodityIcon: commodities.icon,
        level: userWatchlists.level,
        provinceCode: userWatchlists.provinceCode,
        provinceName: provinces.name,
        targetMinPrice: userWatchlists.targetMinPrice,
        targetMaxPrice: userWatchlists.targetMaxPrice,
        alertOnAnomaly: userWatchlists.alertOnAnomaly,
        createdAt: userWatchlists.createdAt,
      })
      .from(userWatchlists)
      .innerJoin(commodities, eq(userWatchlists.commodityId, commodities.id))
      .leftJoin(provinces, eq(userWatchlists.provinceCode, provinces.code))
      .where(eq(userWatchlists.userId, user.id))
      .orderBy(desc(userWatchlists.createdAt));

    // Ambil harga terbaru untuk masing-masing item watchlist
    const itemsWithLatestPrice = await Promise.all(
      items.map(async (item) => {
        const priceConditions = [
          eq(commodityPrices.commodityId, item.commodityId),
          eq(commodityPrices.level, item.level),
        ];

        if (item.provinceCode) {
          priceConditions.push(eq(commodityPrices.provinceCode, item.provinceCode));
        } else {
          priceConditions.push(eq(commodityPrices.regionScope, "nasional"));
        }

        const latestPriceRecord = await db
          .select({
            price: commodityPrices.price,
            periodMonth: commodityPrices.periodMonth,
          })
          .from(commodityPrices)
          .where(and(...priceConditions))
          .orderBy(desc(commodityPrices.periodMonth))
          .limit(1);

        const currentPrice = latestPriceRecord[0]?.price ?? null;
        let isPriceAlert = false;
        let alertType: "min_breached" | "max_breached" | null = null;

        if (currentPrice !== null) {
          if (item.targetMinPrice !== null && currentPrice <= item.targetMinPrice) {
            isPriceAlert = true;
            alertType = "min_breached";
          } else if (item.targetMaxPrice !== null && currentPrice >= item.targetMaxPrice) {
            isPriceAlert = true;
            alertType = "max_breached";
          }
        }

        return {
          ...item,
          currentPrice,
          latestMonth: latestPriceRecord[0]?.periodMonth ?? null,
          isPriceAlert,
          alertType,
        };
      })
    );

    return NextResponse.json({ success: true, data: itemsWithLatestPrice });
  } catch (err) {
    console.error("[Watchlists GET] Error:", err);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil daftar pantauan" },
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
      remove = false,
    } = body;

    if (!commodityId) {
      return NextResponse.json(
        { success: false, error: "commodityId wajib diisi" },
        { status: 400 }
      );
    }

    // Cek apakah item sudah ada di watchlist user
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
      if (remove) {
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
        message: "Pengaturan pantauan berhasil diperbarui",
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
    console.error("[Watchlists POST] Error:", err);
    return NextResponse.json(
      { success: false, error: "Gagal memperbarui pantauan" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Silakan masuk terlebih dahulu" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");

    if (!id) {
      const body = await request.json().catch(() => ({}));
      id = body?.id;
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID pantauan wajib disertakan" },
        { status: 400 }
      );
    }

    await db
      .delete(userWatchlists)
      .where(
        and(eq(userWatchlists.id, id), eq(userWatchlists.userId, user.id))
      );

    return NextResponse.json({
      success: true,
      message: "Item berhasil dihapus dari pantauan",
    });
  } catch (err) {
    console.error("[Watchlists DELETE] Error:", err);
    return NextResponse.json(
      { success: false, error: "Gagal menghapus item pantauan" },
      { status: 500 }
    );
  }
}
