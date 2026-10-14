import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { db } from "@/lib/db";
import { users, provinces, auditLogs } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import crypto from "crypto";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Akses ditolak: Hanya untuk administrator" },
        { status: 403 }
      );
    }

    const userList = await db
      .select({
        id: users.id,
        name: users.name,
        username: users.username,
        email: users.email,
        role: users.role,
        defaultProvinceCode: users.defaultProvinceCode,
        provinceName: provinces.name,
        createdAt: users.createdAt,
      })
      .from(users)
      .leftJoin(provinces, eq(users.defaultProvinceCode, provinces.code))
      .orderBy(desc(users.createdAt));

    return NextResponse.json({ success: true, data: userList });
  } catch (err) {
    console.error("[Admin Users GET] Error:", err);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil daftar pengguna" },
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
    const { name, username, email, password, role = "pembeli", defaultProvinceCode = null } = body;

    if (!name || !username || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Nama, username, email, dan password wajib diisi" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password minimal 6 karakter" },
        { status: 400 }
      );
    }

    // Cek username atau email ganda
    const existing = await db
      .select({ id: users.id, username: users.username, email: users.email })
      .from(users)
      .where(eq(users.username, username.trim().toLowerCase()))
      .limit(1);

    if (existing[0]) {
      return NextResponse.json(
        { success: false, error: "Username sudah digunakan" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const newUserId = crypto.randomUUID();

    await db.insert(users).values({
      id: newUserId,
      name: name.trim(),
      username: username.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role,
      defaultProvinceCode: defaultProvinceCode || null,
      createdBy: session.id,
    });

    // Catat log audit
    await db.insert(auditLogs).values({
      actorId: session.id,
      action: "user_created",
      targetType: "user",
      targetId: newUserId,
      metadataJson: JSON.stringify({
        name,
        username,
        email,
        role,
        defaultProvinceCode,
      }),
    });

    return NextResponse.json({
      success: true,
      message: "Pengguna baru berhasil ditambahkan",
      userId: newUserId,
    });
  } catch (err) {
    console.error("[Admin Users POST] Error:", err);
    return NextResponse.json(
      { success: false, error: "Gagal menambahkan pengguna" },
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
    const { id, name, email, role, defaultProvinceCode } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID pengguna wajib disertakan" },
        { status: 400 }
      );
    }

    // VALIDASI KRITIS KEAMANAN: Admin tidak dapat menurunkan role akunnya sendiri
    if (session.id === id && role && role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Admin tidak dapat menurunkan role akunnya sendiri.",
        },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      updatedBy: session.id,
    };

    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.trim().toLowerCase();
    if (role) updateData.role = role;
    if (defaultProvinceCode !== undefined) {
      updateData.defaultProvinceCode = defaultProvinceCode || null;
    }

    await db.update(users).set(updateData).where(eq(users.id, id));

    // Catat log audit
    await db.insert(auditLogs).values({
      actorId: session.id,
      action: "user_updated",
      targetType: "user",
      targetId: id,
      metadataJson: JSON.stringify(updateData),
    });

    return NextResponse.json({
      success: true,
      message: "Data pengguna berhasil diperbarui",
    });
  } catch (err) {
    console.error("[Admin Users PATCH] Error:", err);
    return NextResponse.json(
      { success: false, error: "Gagal memperbarui pengguna" },
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
    let targetUserId = searchParams.get("id");

    if (!targetUserId) {
      const body = await request.json().catch(() => ({}));
      targetUserId = body?.id;
    }

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: "ID pengguna wajib disertakan" },
        { status: 400 }
      );
    }

    // VALIDASI KRITIS KEAMANAN: Admin DILARANG menghapus akunnya sendiri
    if (session.id === targetUserId) {
      return NextResponse.json(
        {
          success: false,
          error: "Admin tidak dapat menghapus akunnya sendiri demi mencegah penguncian sistem.",
        },
        { status: 400 }
      );
    }

    // Ambil info user sebelum dihapus untuk audit log
    const targetUser = await db
      .select({ id: users.id, username: users.username, role: users.role })
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1);

    if (!targetUser[0]) {
      return NextResponse.json(
        { success: false, error: "Pengguna tidak ditemukan" },
        { status: 404 }
      );
    }

    // Hapus pengguna (foreign keys cascade otomatis menghapus watchlists, search_histories, dll)
    await db.delete(users).where(eq(users.id, targetUserId));

    // Catat audit log
    await db.insert(auditLogs).values({
      actorId: session.id,
      action: "user_deleted",
      targetType: "user",
      targetId: targetUserId,
      metadataJson: JSON.stringify({
        deletedUsername: targetUser[0].username,
        deletedRole: targetUser[0].role,
      }),
    });

    return NextResponse.json({
      success: true,
      message: "Pengguna berhasil dihapus",
    });
  } catch (err) {
    console.error("[Admin Users DELETE] Error:", err);
    return NextResponse.json(
      { success: false, error: "Gagal menghapus pengguna" },
      { status: 500 }
    );
  }
}
