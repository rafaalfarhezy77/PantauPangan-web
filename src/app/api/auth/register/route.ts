import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { users, auditLogs } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";
import { sql } from "drizzle-orm";
import crypto from "crypto";

const registerSchema = z.object({
  name: z.string().min(2, "Nama lengkap minimal 2 karakter").max(100),
  username: z
    .string()
    .min(3, "Username minimal 3 karakter")
    .max(32)
    .regex(/^[a-zA-Z0-9_]+$/, "Username hanya boleh huruf, angka, dan garis bawah"),
  email: z.string().email("Format email tidak valid").max(120),
  password: z.string().min(6, "Kata sandi minimal 6 karakter"),
  role: z.enum(["petani", "pedagang", "pembeli"], {
    message: "Pilihan peran harus salah satu dari: Petani, Pedagang, atau Pembeli",
  }),
  defaultProvinceCode: z.string().max(4).optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || "Input tidak valid",
        },
        { status: 400 }
      );
    }

    const { name, username, email, password, role, defaultProvinceCode } =
      parsed.data;

    // Cek duplikasi email atau username
    const existing = await db
      .select({ id: users.id, email: users.email, username: users.username })
      .from(users)
      .where(sql`${users.email} = ${email} OR ${users.username} = ${username}`)
      .limit(1);

    if (existing[0]) {
      if (existing[0].email === email) {
        return NextResponse.json(
          {
            success: false,
            error: "Email sudah terdaftar. Silakan gunakan email lain atau masuk.",
          },
          { status: 409 }
        );
      }
      return NextResponse.json(
        {
          success: false,
          error: "Username sudah digunakan. Silakan pilih username lain.",
        },
        { status: 409 }
      );
    }

    // Hash kata sandi
    const passwordHash = await hashPassword(password);
    const userId = crypto.randomUUID();

    const provCode =
      defaultProvinceCode && defaultProvinceCode.trim() !== ""
        ? defaultProvinceCode.trim()
        : null;

    // Simpan ke database
    await db.insert(users).values({
      id: userId,
      name,
      username,
      email,
      passwordHash,
      role,
      defaultProvinceCode: provCode,
    });

    const sessionData = {
      id: userId,
      name,
      username,
      email,
      role,
      defaultProvinceCode: provCode,
    };

    // Auto-login setelah registrasi
    await setSessionCookie(sessionData);

    // Audit log
    try {
      await db.insert(auditLogs).values({
        actorId: userId,
        action: "register_success",
        targetType: "user",
        targetId: userId,
        metadataJson: JSON.stringify({ role, defaultProvinceCode: provCode }),
      });
    } catch (auditErr) {
      console.warn("[Auth Register] Audit log warning:", auditErr);
    }

    return NextResponse.json({
      success: true,
      message: "Registrasi akun berhasil",
      user: sessionData,
    });
  } catch (error) {
    console.error("[Auth Register] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan internal server saat registrasi.",
      },
      { status: 500 }
    );
  }
}
