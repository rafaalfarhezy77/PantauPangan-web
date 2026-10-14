import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  commodityPrices,
  commodities,
  provinces,
} from "@/lib/db/schema";
import { redisGet, redisSet } from "@/lib/redis";
import { and, asc, eq, gte, lte, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tingkat = searchParams.get("tingkat") as "konsumen" | "produsen" | null;
  const wilayah = searchParams.get("wilayah") as "nasional" | "provinsi" | null;
  const komoditasParam = searchParams.get("komoditas");
  const provinsiParam = searchParams.get("provinsi");
  const dari = searchParams.get("dari");
  const sampai = searchParams.get("sampai");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(
    500,
    Math.max(1, parseInt(searchParams.get("limit") || "100", 10))
  );

  const cacheKey = `pantau:prices:${tingkat || "all"}:${wilayah || "all"}:${
    komoditasParam || "all"
  }:${provinsiParam || "all"}:${dari || "start"}:${sampai || "end"}:${page}:${limit}`;

  try {
    const cached = await redisGet(cacheKey);
    if (cached) {
      return NextResponse.json({
        success: true,
        source: "cache",
        ...(cached as object),
      });
    }

    // Resolusi komoditas jika parameter diberikan
    let resolvedCommodityId: number | null = null;
    if (komoditasParam) {
      const commRecord = await db
        .select({ id: commodities.id })
        .from(commodities)
        .where(
          sql`${commodities.slug} = ${komoditasParam} OR ${commodities.apiName} = ${komoditasParam} OR ${commodities.displayName} = ${komoditasParam}`
        )
        .limit(1);

      if (commRecord[0]) {
        resolvedCommodityId = commRecord[0].id;
      }
    }

    // Resolusi provinsi jika parameter diberikan
    let resolvedProvinceCode: string | null = null;
    if (provinsiParam) {
      const provRecord = await db
        .select({ code: provinces.code })
        .from(provinces)
        .where(
          sql`${provinces.code} = ${provinsiParam} OR ${provinces.name} = ${provinsiParam}`
        )
        .limit(1);

      if (provRecord[0]) {
        resolvedProvinceCode = provRecord[0].code;
      }
    }

    const conditions = [];

    if (tingkat) {
      conditions.push(eq(commodityPrices.level, tingkat));
    }
    if (wilayah) {
      conditions.push(eq(commodityPrices.regionScope, wilayah));
    }
    if (resolvedCommodityId) {
      conditions.push(eq(commodityPrices.commodityId, resolvedCommodityId));
    }
    if (resolvedProvinceCode) {
      conditions.push(eq(commodityPrices.provinceCode, resolvedProvinceCode));
    }
    if (dari) {
      conditions.push(gte(commodityPrices.periodMonth, dari));
    }
    if (sampai) {
      conditions.push(lte(commodityPrices.periodMonth, sampai));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Hitung total data
    const totalCountQuery = await db
      .select({ count: sql<number>`count(*)` })
      .from(commodityPrices)
      .where(whereClause);

    const total = Number(totalCountQuery[0]?.count ?? 0);
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;

    // Query data harga dengan relasi komoditas dan provinsi
    const rows = await db
      .select({
        id: commodityPrices.id,
        commodityId: commodityPrices.commodityId,
        commodityName: commodities.displayName,
        commoditySlug: commodities.slug,
        unit: commodities.unit,
        level: commodityPrices.level,
        regionScope: commodityPrices.regionScope,
        provinceCode: commodityPrices.provinceCode,
        provinceName: provinces.name,
        periodMonth: commodityPrices.periodMonth,
        price: commodityPrices.price,
        priceRaw: commodityPrices.priceRaw,
        momChangePct: commodityPrices.momChangePct,
        yoyChangePct: commodityPrices.yoyChangePct,
        updatedAt: commodityPrices.updatedAt,
      })
      .from(commodityPrices)
      .innerJoin(commodities, eq(commodityPrices.commodityId, commodities.id))
      .leftJoin(provinces, eq(commodityPrices.provinceCode, provinces.code))
      .where(whereClause)
      .orderBy(
        asc(commodityPrices.periodMonth),
        asc(commodities.displayName)
      )
      .limit(limit)
      .offset(offset);

    const responsePayload = {
      data: rows,
      meta: {
        total,
        page,
        per_page: limit,
        total_pages: totalPages,
      },
    };

    // Cache di Redis selama 15 menit (900 detik)
    await redisSet(cacheKey, responsePayload, 900);

    return NextResponse.json({
      success: true,
      source: "database",
      ...responsePayload,
    });
  } catch (error) {
    console.error("[API /api/v1/prices] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
