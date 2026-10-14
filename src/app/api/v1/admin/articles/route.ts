import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { articles, commodities, auditLogs } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Akses ditolak: Hanya untuk administrator" },
        { status: 403 }
      );
    }

    const list = await db
      .select({
        id: articles.id,
        slug: articles.slug,
        title: articles.title,
        category: articles.category,
        sourceName: articles.sourceName,
        content: articles.content,
        commodityId: articles.commodityId,
        commodityName: commodities.displayName,
        publishedAt: articles.publishedAt,
      })
      .from(articles)
      .leftJoin(commodities, eq(articles.commodityId, commodities.id))
      .orderBy(desc(articles.publishedAt));

    return NextResponse.json({ success: true, data: list });
  } catch (err) {
    console.error("[Admin Articles GET] Error:", err);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil daftar artikel" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Akses ditolak: Hanya untuk administrator" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { title, slug, category, sourceName, content, commodityId } = body;

    if (!title || !content || !category) {
      return NextResponse.json(
        { success: false, error: "Judul, kategori, dan konten wajib diisi" },
        { status: 400 }
      );
    }

    const cleanSlug =
      slug?.trim().toLowerCase() ||
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") +
        "-" +
        Date.now().toString().slice(-4);

    await db.insert(articles).values({
      title: title.trim(),
      slug: cleanSlug,
      category: category.trim(),
      sourceName: sourceName?.trim() || "PantauPangan News",
      content: content.trim(),
      commodityId: commodityId ? Number(commodityId) : null,
      publishedAt: new Date(),
    });

    await db.insert(auditLogs).values({
      actorId: session.id,
      action: "article_created",
      targetType: "article",
      targetId: cleanSlug,
      metadataJson: JSON.stringify({ title, category }),
    });

    return NextResponse.json({
      success: true,
      message: "Artikel berhasil diterbitkan",
      slug: cleanSlug,
    });
  } catch (err) {
    console.error("[Admin Articles POST] Error:", err);
    return NextResponse.json(
      { success: false, error: "Gagal menyimpan artikel" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Akses ditolak: Hanya untuk administrator" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { id, title, slug, category, sourceName, content, commodityId } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID artikel wajib disertakan" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (title) updateData.title = title.trim();
    if (slug) updateData.slug = slug.trim().toLowerCase();
    if (category) updateData.category = category.trim();
    if (sourceName) updateData.sourceName = sourceName.trim();
    if (content) updateData.content = content.trim();
    if (commodityId !== undefined) {
      updateData.commodityId = commodityId ? Number(commodityId) : null;
    }

    await db.update(articles).set(updateData).where(eq(articles.id, Number(id)));

    await db.insert(auditLogs).values({
      actorId: session.id,
      action: "article_updated",
      targetType: "article",
      targetId: String(id),
      metadataJson: JSON.stringify(updateData),
    });

    return NextResponse.json({
      success: true,
      message: "Artikel berhasil diperbarui",
    });
  } catch (err) {
    console.error("[Admin Articles PATCH] Error:", err);
    return NextResponse.json(
      { success: false, error: "Gagal memperbarui artikel" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Akses ditolak: Hanya untuk administrator" },
        { status: 403 }
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
        { success: false, error: "ID artikel wajib disertakan" },
        { status: 400 }
      );
    }

    await db.delete(articles).where(eq(articles.id, Number(id)));

    await db.insert(auditLogs).values({
      actorId: session.id,
      action: "article_deleted",
      targetType: "article",
      targetId: String(id),
    });

    return NextResponse.json({
      success: true,
      message: "Artikel berhasil dihapus",
    });
  } catch (err) {
    console.error("[Admin Articles DELETE] Error:", err);
    return NextResponse.json(
      { success: false, error: "Gagal menghapus artikel" },
      { status: 500 }
    );
  }
}
