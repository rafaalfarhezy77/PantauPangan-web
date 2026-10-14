import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  commodityAnomalies,
  commodities,
} from "@/lib/db/schema";
import { redisGet, redisSet } from "@/lib/redis";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const komoditasParam = searchParams.get("komoditas");
  const severityParam = searchParams.get("severity") as
    | "normal"
    | "warning"
    | "alert_low"
    | "alert_high"
    | null;
  const dari = searchParams.get("dari");
  const sampai = searchParams.get("sampai");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(
    200,
    Math.max(1, parseInt(searchParams.get("limit") || "50", 10))
  );

  const cacheKey = `pantau:anomalies:${komoditasParam || "all"}:${
    severityParam || "all"
  }:${dari || "start"}:${sampai || "end"}:${page}:${limit}`;

  try {
    const cached = await redisGet(cacheKey);
    if (cached) {
      return NextResponse.json({
        success: true,
        source: "cache",
        ...(cached as object),
      });
    }

    let resolvedCommodityId: number | null = null;
    if (komoditasParam) {
      const comm = await db
        .select({ id: commodities.id })
        .from(commodities)
        .where(
          sql`${commodities.slug} = ${komoditasParam} OR ${commodities.apiName} = ${komoditasParam} OR ${commodities.displayName} = ${komoditasParam}`
        )
        .limit(1);

      if (comm[0]) {
        resolvedCommodityId = comm[0].id;
      }
    }

    const conditions = [];

    if (resolvedCommodityId) {
      conditions.push(eq(commodityAnomalies.commodityId, resolvedCommodityId));
    }
    if (severityParam) {
      conditions.push(eq(commodityAnomalies.severity, severityParam));
    }
    if (dari) {
      conditions.push(gte(commodityAnomalies.periodMonth, dari));
    }
    if (sampai) {
      conditions.push(lte(commodityAnomalies.periodMonth, sampai));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const totalCountQuery = await db
      .select({ count: sql<number>`count(*)` })
      .from(commodityAnomalies)
      .where(whereClause);

    const total = Number(totalCountQuery[0]?.count ?? 0);
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;

    const rows = await db
      .select({
        id: commodityAnomalies.id,
        commodityId: commodityAnomalies.commodityId,
        commodityName: commodities.displayName,
        commoditySlug: commodities.slug,
        periodMonth: commodityAnomalies.periodMonth,
        qipa: commodityAnomalies.qipa,
        aipa: commodityAnomalies.aipa,
        ifpa: commodityAnomalies.ifpa,
        status: commodityAnomalies.status,
        severity: commodityAnomalies.severity,
        updatedAt: commodityAnomalies.updatedAt,
      })
      .from(commodityAnomalies)
      .innerJoin(commodities, eq(commodityAnomalies.commodityId, commodities.id))
      .where(whereClause)
      .orderBy(desc(commodityAnomalies.periodMonth))
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
    console.error("[API /api/v1/anomalies] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
