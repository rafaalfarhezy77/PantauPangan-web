import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { searchHistories, commodities, provinces, commodityPrices } from "@/lib/db/schema";
import { and, eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Silakan masuk terlebih dahulu" },
        { status: 401 }
      );
    }

    const histories = await db
      .select({
        id: searchHistories.id,
        commodityId: searchHistories.commodityId,
        commodityName: commodities.displayName,
        commoditySlug: commodities.slug,
        commodityCategory: commodities.category,
        commodityUnit: commodities.unit,
        commodityIcon: commodities.icon,
        level: searchHistories.level,
        provinceCode: searchHistories.provinceCode,
        provinceName: provinces.name,
        periodFrom: searchHistories.periodFrom,
        periodTo: searchHistories.periodTo,
        searchedAt: searchHistories.searchedAt,
      })
      .from(searchHistories)
      .innerJoin(commodities, eq(searchHistories.commodityId, commodities.id))
      .leftJoin(provinces, eq(searchHistories.provinceCode, provinces.code))
      .where(eq(searchHistories.userId, user.id))
      .orderBy(desc(searchHistories.searchedAt))
      .limit(30);

    // Ambil harga terkini untuk setiap riwayat pencarian
    const dataWithPrices = await Promise.all(
      histories.map(async (item) => {
        const priceConditions = [
          eq(commodityPrices.commodityId, item.commodityId),
          eq(commodityPrices.level, (item.level as "konsumen" | "produsen") || "konsumen"),
        ];

        if (item.provinceCode) {
          priceConditions.push(eq(commodityPrices.provinceCode, item.provinceCode));
        } else {
          priceConditions.push(eq(commodityPrices.regionScope, "nasional"));
        }

        const latestPrice = await db
          .select({
            price: commodityPrices.price,
            periodMonth: commodityPrices.periodMonth,
          })
          .from(commodityPrices)
          .where(and(...priceConditions))
          .orderBy(desc(commodityPrices.periodMonth))
          .limit(1);

        return {
          ...item,
          latestPrice: latestPrice[0]?.price ?? null,
          latestMonth: latestPrice[0]?.periodMonth ?? null,
        };
      })
    );

    return NextResponse.json({ success: true, data: dataWithPrices });
  } catch (err) {
    console.error("[SearchHistory GET] Error:", err);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil riwayat pencarian" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "Anonymous search, history skipped",
      });
    }

    const body = await request.json().catch(() => ({}));
    const { commodityId, level, provinceCode, periodFrom, periodTo } = body;

    if (!commodityId) {
      return NextResponse.json(
        { success: false, error: "commodityId is required" },
        { status: 400 }
      );
    }

    await db.insert(searchHistories).values({
      userId: user.id,
      commodityId: Number(commodityId),
      level: level || "konsumen",
      provinceCode: provinceCode || null,
      periodFrom: periodFrom || null,
      periodTo: periodTo || null,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.warn("[SearchHistory POST] Error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to save history" },
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
    const id = searchParams.get("id");
    const clearAll = searchParams.get("all") === "true" || !id;

    if (clearAll) {
      await db
        .delete(searchHistories)
        .where(eq(searchHistories.userId, user.id));

      return NextResponse.json({
        success: true,
        message: "Seluruh riwayat pencarian berhasil dibersihkan",
      });
    }

    await db
      .delete(searchHistories)
      .where(
        and(
          eq(searchHistories.id, Number(id)),
          eq(searchHistories.userId, user.id)
        )
      );

    return NextResponse.json({
      success: true,
      message: "Riwayat pencarian berhasil dihapus",
    });
  } catch (err) {
    console.error("[SearchHistory DELETE] Error:", err);
    return NextResponse.json(
      { success: false, error: "Gagal menghapus riwayat pencarian" },
      { status: 500 }
    );
  }
}
