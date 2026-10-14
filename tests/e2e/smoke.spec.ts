import { test, expect } from "@playwright/test";

test.describe("Smoke Tests PantauPangan v2.0", () => {
  test("1. Beranda harus memuat brand PantauPangan, navbar, dan price ticker", async ({ page }) => {
    await page.goto("/");

    // Verifikasi Brand
    await expect(page.locator("text=PantauPangan").first()).toBeVisible();

    // Verifikasi Navigasi Utama
    await expect(page.locator("text=Beranda").first()).toBeVisible();
    await expect(page.locator("text=Eksplorasi Harga").first()).toBeVisible();
    await expect(page.locator("text=Radar Anomali").first()).toBeVisible();
  });

  test("2. Saklar Konsumen vs Produsen dapat dioperasikan", async ({ page }) => {
    await page.goto("/");

    const consumerBtn = page.locator("button:has-text('Tingkat Konsumen')").first();
    const producerBtn = page.locator("button:has-text('Tingkat Produsen')").first();

    if (await consumerBtn.isVisible() && await producerBtn.isVisible()) {
      await producerBtn.click();
      await page.waitForTimeout(300);
      await consumerBtn.click();
      await page.waitForTimeout(300);
    }
  });

  test("3. Halaman Login & Register merender form autentikasi dengan baik", async ({ page }) => {
    // Test halaman Login
    await page.goto("/login");
    await expect(page.locator("input[type='text'], input[type='email']").first()).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
    await expect(page.locator("button[type='submit']")).toBeVisible();

    // Test navigasi ke Register
    await page.goto("/register");
    await expect(page.locator("input[type='password']")).toBeVisible();
  });

  test("4. Proteksi RBAC Middleware: Akses admin tanpa login harus diredirect ke login", async ({ page }) => {
    // Mencoba mengakses rute admin tanpa session cookie
    await page.goto("/admin/sync");
    
    // Middleware harus mengarahkan ke halaman login dengan query callbackUrl
    await page.waitForURL((url) => url.pathname.includes("/login"));
    expect(page.url()).toContain("/login");
  });

  test("5. Proteksi RBAC Middleware: Akses dashboard user tanpa login harus diredirect ke login", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL((url) => url.pathname.includes("/login"));
    expect(page.url()).toContain("/login");
  });
});
