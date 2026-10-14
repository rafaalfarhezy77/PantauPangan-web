import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await verifySessionToken(token) : null;

  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register";

  const isProtectedUserRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/pantauan") ||
    pathname.startsWith("/riwayat");

  const isAdminPage = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/v1/admin");

  // 1. Jika sudah login dan mencoba membuka halaman login/register
  if (isAuthPage && user) {
    if (user.role === "admin") {
      return NextResponse.redirect(new URL("/admin/sync", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 2. Proteksi rute user terdaftar (/dashboard, /pantauan, /riwayat)
  if (isProtectedUserRoute && !user) {
    const callbackUrl = encodeURIComponent(pathname + request.nextUrl.search);
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${callbackUrl}`, request.url)
    );
  }

  // 3. Proteksi rute halaman Admin (/admin/:path*)
  if (isAdminPage) {
    if (!user) {
      const callbackUrl = encodeURIComponent(pathname + request.nextUrl.search);
      return NextResponse.redirect(
        new URL(`/login?callbackUrl=${callbackUrl}`, request.url)
      );
    }
    if (user.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // 4. Proteksi rute API Admin (/api/v1/admin/:path*)
  if (isAdminApi) {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    const isCronAuthorized =
      cronSecret && authHeader === `Bearer ${cronSecret}`;

    if (!isCronAuthorized) {
      if (!user) {
        return NextResponse.json(
          { success: false, error: "Unauthorized: Silakan login terlebih dahulu" },
          { status: 401 }
        );
      }
      if (user.role !== "admin") {
        return NextResponse.json(
          {
            success: false,
            error: "Forbidden: Akses khusus role Administrator",
          },
          { status: 403 }
        );
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/pantauan/:path*",
    "/riwayat/:path*",
    "/admin/:path*",
    "/api/v1/admin/:path*",
    "/login",
    "/register",
  ],
};
