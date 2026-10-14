import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { commodities, auditLogs } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

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
      .select()
      .from(commodities)
      .orderBy(asc(commodities.id));

    return NextResponse.json({ success: true, data: list });
  } catch (err) {
    console.error("[Admin Commodities GET] Error:", err);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil daftar komoditas" },
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
    const { id, category, unit, icon, isActive, displayName } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID komoditas wajib disertakan" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (category !== undefined) updateData.category = category;
    if (unit !== undefined) updateData.unit = unit;
    if (icon !== undefined) updateData.icon = icon;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (displayName !== undefined) updateData.displayName = displayName;

    await db.update(commodities).set(updateData).where(eq(commodities.id, Number(id)));

    // Catat log audit
    await db.insert(auditLogs).values({
      actorId: session.id,
      action: "commodity_updated",
      targetType: "commodity",
      targetId: String(id),
      metadataJson: JSON.stringify(updateData),
    });

    return NextResponse.json({
      success: true,
      message: "Data master komoditas berhasil diperbarui",
    });
  } catch (err) {
    console.error("[Admin Commodities PATCH] Error:", err);
    return NextResponse.json(
      { success: false, error: "Gagal memperbarui master komoditas" },
      { status: 500 }
    );
  }
}
