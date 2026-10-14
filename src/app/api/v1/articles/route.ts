import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { articles, commodities } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const commodityId = searchParams.get("commodityId");
    const limit = Number(searchParams.get("limit")) || 10;

    const query = db
      .select({
        id: articles.id,
        slug: articles.slug,
        title: articles.title,
        category: articles.category,
        sourceName: articles.sourceName,
        content: articles.content,
        commodityId: articles.commodityId,
        commodityName: commodities.displayName,
        commoditySlug: commodities.slug,
        publishedAt: articles.publishedAt,
      })
      .from(articles)
      .leftJoin(commodities, eq(articles.commodityId, commodities.id))
      .orderBy(desc(articles.publishedAt))
      .limit(limit);

    const items = commodityId
      ? await query.where(eq(articles.commodityId, Number(commodityId)))
      : await query;

    return NextResponse.json({ success: true, data: items });
  } catch (err) {
    console.error("[Articles GET] Error:", err);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil artikel berita" },
      { status: 500 }
    );
  }
}
