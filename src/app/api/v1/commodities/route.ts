import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  commodities,
  commodityPrices,
  commodityAnomalies,
} from "@/lib/db/schema";
import { redisGet, redisSet } from "@/lib/redis";
import { and, desc, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const query = searchParams.get("q");

  const cacheKey = `pantau:commodities:${category || "all"}:${query || "none"}`;

  try {
    const cached = await redisGet(cacheKey);
    if (cached) {
      return NextResponse.json({
        success: true,
        source: "cache",
        data: cached,
      });
    }

    // Ambil komoditas aktif
    const commQuery = db
      .select()
      .from(commodities)
      .where(eq(commodities.isActive, true));

    const allCommodities = await commQuery;

    let filtered = allCommodities;
    if (category) {
      filtered = filtered.filter((c) => c.category === category);
    }
    if (query) {
      const qLower = query.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.displayName.toLowerCase().includes(qLower) ||
          c.apiName.toLowerCase().includes(qLower) ||
          c.slug.toLowerCase().includes(qLower)
      );
    }

    // Ambil harga nasional terbaru & anomali terbaru untuk setiap komoditas
    const result = await Promise.all(
      filtered.map(async (comm) => {
        const latestPrice = await db
          .select()
          .from(commodityPrices)
          .where(
            and(
              eq(commodityPrices.commodityId, comm.id),
              eq(commodityPrices.level, "konsumen"),
              eq(commodityPrices.regionScope, "nasional")
            )
          )
          .orderBy(desc(commodityPrices.periodMonth))
          .limit(1);

        const latestAnomaly = await db
          .select()
          .from(commodityAnomalies)
          .where(eq(commodityAnomalies.commodityId, comm.id))
          .orderBy(desc(commodityAnomalies.periodMonth))
          .limit(1);

        return {
          id: comm.id,
          slug: comm.slug,
          apiName: comm.apiName,
          displayName: comm.displayName,
          category: comm.category,
          unit: comm.unit,
          icon: comm.icon,
          latestPrice: latestPrice[0]
            ? {
                periodMonth: latestPrice[0].periodMonth,
                price: latestPrice[0].price,
                momChangePct: latestPrice[0].momChangePct,
                yoyChangePct: latestPrice[0].yoyChangePct,
              }
            : null,
          latestAnomaly: latestAnomaly[0]
            ? {
                periodMonth: latestAnomaly[0].periodMonth,
                qipa: latestAnomaly[0].qipa,
                aipa: latestAnomaly[0].aipa,
                ifpa: latestAnomaly[0].ifpa,
                status: latestAnomaly[0].status,
                severity: latestAnomaly[0].severity,
              }
            : null,
        };
      })
    );

    // Cache di Redis selama 15 menit (900 detik)
    await redisSet(cacheKey, result, 900);

    return NextResponse.json({
      success: true,
      source: "database",
      data: result,
    });
  } catch (error) {
    console.error("[API /api/v1/commodities] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
