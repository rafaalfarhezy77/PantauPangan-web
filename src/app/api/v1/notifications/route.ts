import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
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

    const items = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(50);

    const unreadCount = items.filter((n) => !n.isRead).length;

    return NextResponse.json({
      success: true,
      unreadCount,
      data: items,
    });
  } catch (err) {
    console.error("[Notifications GET] Error:", err);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil notifikasi" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Silakan masuk terlebih dahulu" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { id, markAll } = body;

    if (markAll) {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.userId, user.id));

      return NextResponse.json({
        success: true,
        message: "Seluruh notifikasi ditandai telah dibaca",
      });
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID notifikasi atau markAll wajib disertakan" },
        { status: 400 }
      );
    }

    await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(eq(notifications.id, id), eq(notifications.userId, user.id))
      );

    return NextResponse.json({
      success: true,
      message: "Notifikasi ditandai telah dibaca",
    });
  } catch (err) {
    console.error("[Notifications PATCH] Error:", err);
    return NextResponse.json(
      { success: false, error: "Gagal memperbarui status notifikasi" },
      { status: 500 }
    );
  }
}
