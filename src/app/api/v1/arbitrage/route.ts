import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { commodityPrices, commodities, provinces } from "@/lib/db/schema";
import { and, eq, desc, isNotNull } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const level = (searchParams.get("level") as "konsumen" | "produsen") || "konsumen";

    // 1. Dapatkan bulan periode terbaru dari harga komoditas level provinsi
    const latestMonthRecord = await db
      .select({ periodMonth: commodityPrices.periodMonth })
      .from(commodityPrices)
      .where(
        and(
          eq(commodityPrices.level, level),
          eq(commodityPrices.regionScope, "provinsi")
        )
      )
      .orderBy(desc(commodityPrices.periodMonth))
      .limit(1);

    if (!latestMonthRecord[0]) {
      return NextResponse.json({
        success: true,
        data: [],
        periodMonth: null,
      });
    }

    const latestMonth = latestMonthRecord[0].periodMonth;

    // 2. Ambil seluruh harga provinsi pada bulan terbaru tersebut yang tidak null
    const records = await db
      .select({
        commodityId: commodityPrices.commodityId,
        commodityName: commodities.displayName,
        commoditySlug: commodities.slug,
        commodityCategory: commodities.category,
        commodityUnit: commodities.unit,
        commodityIcon: commodities.icon,
        provinceCode: commodityPrices.provinceCode,
        provinceName: provinces.name,
        price: commodityPrices.price,
      })
      .from(commodityPrices)
      .innerJoin(commodities, eq(commodityPrices.commodityId, commodities.id))
      .innerJoin(provinces, eq(commodityPrices.provinceCode, provinces.code))
      .where(
        and(
          eq(commodityPrices.level, level),
          eq(commodityPrices.regionScope, "provinsi"),
          eq(commodityPrices.periodMonth, latestMonth),
          isNotNull(commodityPrices.price)
        )
      );

    // 3. Kelompokkan berdasarkan komoditas untuk mencari min, max, dan spread
    const grouped: Record<
      number,
      {
        commodityId: number;
        commodityName: string;
        commoditySlug: string;
        commodityCategory: string;
        commodityUnit: string;
        commodityIcon: string | null;
        prices: Array<{
          provinceCode: string;
          provinceName: string;
          price: number;
        }>;
      }
    > = {};

    for (const r of records) {
      if (r.price === null || !r.provinceCode || !r.provinceName) continue;

      if (!grouped[r.commodityId]) {
        grouped[r.commodityId] = {
          commodityId: r.commodityId,
          commodityName: r.commodityName,
          commoditySlug: r.commoditySlug,
          commodityCategory: r.commodityCategory,
          commodityUnit: r.commodityUnit,
          commodityIcon: r.commodityIcon,
          prices: [],
        };
      }
      grouped[r.commodityId].prices.push({
        provinceCode: r.provinceCode,
        provinceName: r.provinceName,
        price: r.price,
      });
    }

    const arbitrageItems = Object.values(grouped)
      .map((item) => {
        if (item.prices.length < 2) return null;

        let minRecord = item.prices[0];
        let maxRecord = item.prices[0];

        for (const p of item.prices) {
          if (p.price < minRecord.price) minRecord = p;
          if (p.price > maxRecord.price) maxRecord = p;
        }

        const absoluteSpread = maxRecord.price - minRecord.price;
        const spreadPct =
          minRecord.price > 0
            ? Number(((absoluteSpread / minRecord.price) * 100).toFixed(1))
            : 0;

        return {
          commodityId: item.commodityId,
          commodityName: item.commodityName,
          commoditySlug: item.commoditySlug,
          commodityCategory: item.commodityCategory,
          commodityUnit: item.commodityUnit,
          commodityIcon: item.commodityIcon,
          minPrice: minRecord.price,
          cheapestProvince: minRecord.provinceName,
          cheapestCode: minRecord.provinceCode,
          maxPrice: maxRecord.price,
          highestProvince: maxRecord.provinceName,
          highestCode: maxRecord.provinceCode,
          absoluteSpread,
          spreadPct,
          totalProvincesRecorded: item.prices.length,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => b.spreadPct - a.spreadPct);

    return NextResponse.json({
      success: true,
      periodMonth: latestMonth,
      level,
      data: arbitrageItems,
    });
  } catch (err) {
    console.error("[Arbitrage GET] Error:", err);
    return NextResponse.json(
      { success: false, error: "Gagal menghitung disparitas harga wilayah" },
      { status: 500 }
    );
  }
}
