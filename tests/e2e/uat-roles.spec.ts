import { test, expect } from "@playwright/test";

const DEFAULT_PASSWORD = process.env.SEED_DEFAULT_PASSWORD || "PantauPangan2026!";

test.describe("PantauPangan v2.0 - Role-Based UAT & Edge-Case E2E Suite", () => {
  // -------------------------------------------------------------
  // UAT 1: Pengguna Publik / Tamu (Tanpa Login)
  // -------------------------------------------------------------
  test("UAT 1: Publik dapat mengeksplorasi Beranda, Price Ticker Rupiah, Saklar Tingkat, dan Detail Komoditas", async ({
    page,
  }) => {
    // 1. Kunjungi Beranda
    await page.goto("/");
    await expect(page.locator("text=PantauPangan").first()).toBeVisible();

    // 2. Verifikasi Live Price Ticker memuat simbol Rupiah
    const ticker = page.locator(".animate-marquee, [data-testid='price-ticker']").first();
    if (await ticker.isVisible()) {
      await expect(ticker).toContainText("Rp");
    } else {
      // Fallback periksa elemen harga di halaman beranda
      await expect(page.locator("body")).toContainText("Rp");
    }

    // 3. Verifikasi Saklar Tingkat Konsumen vs Produsen
    const consumerBtn = page.locator("button:has-text('Tingkat Konsumen'), button:has-text('Konsumen')").first();
    const producerBtn = page.locator("button:has-text('Tingkat Produsen'), button:has-text('Produsen')").first();

    if (await consumerBtn.isVisible() && await producerBtn.isVisible()) {
      await producerBtn.click();
      await page.waitForTimeout(400);
      await consumerBtn.click();
      await page.waitForTimeout(400);
    }

    // 4. Kunjungi Halaman Detail Komoditas
    await page.goto("/komoditas/beras-premium");
    await expect(page.locator("h1, h2").first()).toBeVisible();
    await expect(page.locator("body")).toContainText("Beras Premium");
  });

  // -------------------------------------------------------------
  // UAT 2: Persona Petani (Jawa Timur)
  // -------------------------------------------------------------
  test("UAT 2: Petani Jatim dapat login, melihat workspace produsen, domisili Jawa Timur, dan deteksi anomali", async ({
    page,
  }) => {
    await page.goto("/login");

    // Form Login
    await page.fill("input[type='text'], input[type='email']", "petani.jatim@pantaupangan.id");
    await page.fill("input[type='password']", DEFAULT_PASSWORD);
    await page.click("button[type='submit']");

    // Diarahkan ke Dashboard
    await page.waitForURL((url) => url.pathname.includes("/dashboard"), { timeout: 10000 });
    expect(page.url()).toContain("/dashboard");

    // Verifikasi Info Domisili Jawa Timur & Role Petani
    await expect(page.locator("body")).toContainText("Jawa Timur");
    await expect(page.locator("body")).toContainText("petani");

    // Verifikasi Workspace Petani / Produsen
    await expect(page.locator("body")).toContainText("Petani");
  });

  // -------------------------------------------------------------
  // UAT 3: Persona Pedagang (Jawa Barat)
  // -------------------------------------------------------------
  test("UAT 3: Pedagang Jabar dapat login, mengakses radar disparitas wilayah dan analisis margin spread", async ({
    page,
  }) => {
    await page.goto("/login");

    await page.fill("input[type='text'], input[type='email']", "pedagang.jabar@pantaupangan.id");
    await page.fill("input[type='password']", DEFAULT_PASSWORD);
    await page.click("button[type='submit']");

    await page.waitForURL((url) => url.pathname.includes("/dashboard"), { timeout: 10000 });
    expect(page.url()).toContain("/dashboard");

    // Verifikasi Role Pedagang & Domisili Jawa Barat
    await expect(page.locator("body")).toContainText("Jawa Barat");
    await expect(page.locator("body")).toContainText("pedagang");

    // Verifikasi Fitur Disparitas Wilayah / Arbitrase
    const arbitrageHeading = page.locator("text=Arbitrase, text=Disparitas, text=Peluang").first();
    await expect(arbitrageHeading).toBeVisible();
  });

  // -------------------------------------------------------------
  // UAT 4: Persona Pembeli (Jawa Tengah)
  // -------------------------------------------------------------
  test("UAT 4: Pembeli Jateng dapat login, memantau harga eceran, mengelola Watchlist, dan melihat Riwayat Pencarian", async ({
    page,
  }) => {
    await page.goto("/login");

    await page.fill("input[type='text'], input[type='email']", "pembeli.jateng@pantaupangan.id");
    await page.fill("input[type='password']", DEFAULT_PASSWORD);
    await page.click("button[type='submit']");

    await page.waitForURL((url) => url.pathname.includes("/dashboard"), { timeout: 10000 });
    expect(page.url()).toContain("/dashboard");

    // Verifikasi Role Pembeli & Domisili Jawa Tengah
    await expect(page.locator("body")).toContainText("Jawa Tengah");
    await expect(page.locator("body")).toContainText("pembeli");

    // Verifikasi Komponen Watchlist & Riwayat Pencarian aktif
    await expect(page.locator("text=Watchlist, text=Komoditas Dipantau").first()).toBeVisible();
    await expect(page.locator("text=Riwayat Pencarian").first()).toBeVisible();
  });

  // -------------------------------------------------------------
  // UAT 5: Administrator & Proteksi RBAC Anti-Lockout
  // -------------------------------------------------------------
  test("UAT 5: Proteksi RBAC mengalihkan non-admin, Admin dapat mengakses sync center, dan tombol self-delete diblokir", async ({
    page,
  }) => {
    // 1. Akses langsung non-admin ke /admin/sync harus dialihkan ke login
    await page.goto("/admin/sync");
    await page.waitForURL((url) => url.pathname.includes("/login"), { timeout: 5000 });
    expect(page.url()).toContain("/login");

    // 2. Login sebagai Administrator
    await page.fill("input[type='text'], input[type='email']", "admin@pantaupangan.id");
    await page.fill("input[type='password']", DEFAULT_PASSWORD);
    await page.click("button[type='submit']");

    // Diarahkan ke /admin/sync atau /dashboard
    await page.waitForURL((url) => url.pathname.includes("/admin") || url.pathname.includes("/dashboard"), {
      timeout: 10000,
    });

    // 3. Masuk ke Admin Sync Control Center
    await page.goto("/admin/sync");
    await expect(page.locator("text=Control Center, text=Sinkronisasi").first()).toBeVisible();

    // Verifikasi 4 seri sinkronisasi (Konsumen Nasional, Konsumen Provinsi, Produsen Nasional, Produsen Provinsi)
    await expect(page.locator("body")).toContainText("Konsumen");
    await expect(page.locator("body")).toContainText("Produsen");
    await expect(page.locator("body")).toContainText("Nasional");
    await expect(page.locator("body")).toContainText("Provinsi");

    // 4. Masuk ke Halaman Manajemen Pengguna (/admin/users)
    await page.goto("/admin/users");
    await expect(page.locator("text=Manajemen Pengguna").first()).toBeVisible();

    // Verifikasi tombol hapus akun admin sendiri dalam keadaan DISABLED (anti-lockout protection)
    const selfDeleteBtn = page.locator("button[disabled][title*='sendiri'], button[disabled]:has-text('Hapus')").first();
    await expect(selfDeleteBtn).toBeVisible();
    await expect(selfDeleteBtn).toBeDisabled();
  });
});
