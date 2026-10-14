import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export type UserRole = "admin" | "petani" | "pedagang" | "pembeli";

export interface SessionUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  defaultProvinceCode: string | null;
}

export const SESSION_COOKIE_NAME = "pantau_session";
const SESSION_EXPIRY = 7 * 24 * 60 * 60; // 7 days in seconds

function getJwtSecretKey(): Uint8Array {
  const secret =
    process.env.BETTER_AUTH_SECRET ||
    process.env.SESSION_SECRET ||
    "pantaupangan_jwt_super_secret_session_key_32_characters_minimum";
  return new TextEncoder().encode(secret);
}

/**
 * Membuat token JWT terenkripsi untuk session
 */
export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({ user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_EXPIRY}s`)
    .sign(getJwtSecretKey());
}

/**
 * Verifikasi token JWT session (kompatibel dengan Edge Runtime / Middleware)
 */
export async function verifySessionToken(
  token: string
): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());
    return (payload.user as SessionUser) || null;
  } catch {
    return null;
  }
}

/**
 * Menyimpan sesi login ke HttpOnly Cookie (Server Action / Route Handler)
 */
export async function setSessionCookie(user: SessionUser): Promise<void> {
  const token = await createSessionToken(user);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_EXPIRY,
  });
}

/**
 * Menghapus sesi login dari cookie
 */
export async function deleteSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Mengambil sesi user aktif dari cookie
 */
export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
