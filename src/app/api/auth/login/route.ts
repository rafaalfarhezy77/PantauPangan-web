import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { users, auditLogs } from "@/lib/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";
import { checkLoginRateLimit } from "@/lib/auth/rate-limit";
import { sql } from "drizzle-orm";

const loginSchema = z.object({
  identifier: z.string().min(3, "Username atau Email wajib diisi"),
  password: z.string().min(6, "Kata sandi minimal 6 karakter"),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Ekstrak IP untuk Rate Limiting
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : request.headers.get("x-real-ip") || "127.0.0.1";

    const rateLimit = await checkLoginRateLimit(ip);
    if (!rateLimit.success) {
      const waitSec = Math.ceil(rateLimit.resetMs / 1000);
      return NextResponse.json(
        {
          success: false,
          error: `Terlalu banyak percobaan login gagal. Silakan coba lagi dalam ${waitSec} detik.`,
        },
        { status: 429 }
      );
    }

    // 2. Validasi input dengan Zod
    const body = await request.json().catch(() => null);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || "Input tidak valid",
        },
        { status: 400 }
      );
    }

    const { identifier, password } = parsed.data;

    // 3. Cari user berdasarkan email atau username
    const userRecords = await db
      .select()
      .from(users)
      .where(
        sql`${users.email} = ${identifier} OR ${users.username} = ${identifier}`
      )
      .limit(1);

    const user = userRecords[0];

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Username/Email atau kata sandi tidak sesuai.",
        },
        { status: 401 }
      );
    }

    // 4. Verifikasi kata sandi
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Username/Email atau kata sandi tidak sesuai.",
        },
        { status: 401 }
      );
    }

    // 5. Simpan sesi login ke HttpOnly Cookie
    const sessionData = {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      defaultProvinceCode: user.defaultProvinceCode,
    };

    await setSessionCookie(sessionData);

    // 6. Catat audit log
    try {
      await db.insert(auditLogs).values({
        actorId: user.id,
        action: "login_success",
        targetType: "user",
        targetId: user.id,
        metadataJson: JSON.stringify({ ip, userAgent: request.headers.get("user-agent") }),
      });
    } catch (auditErr) {
      console.warn("[Auth Login] Audit log warning:", auditErr);
    }

    return NextResponse.json({
      success: true,
      message: "Login berhasil",
      user: sessionData,
    });
  } catch (error) {
    console.error("[Auth Login] Internal error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan internal pada server saat login.",
      },
      { status: 500 }
    );
  }
}
