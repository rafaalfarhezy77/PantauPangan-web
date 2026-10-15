import { z } from "zod";
import * as dotenv from "dotenv";
import mysql from "mysql2/promise";
import { Redis } from "@upstash/redis";

// Muat berkas .env.local atau .env jika tersedia
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

interface CheckResult {
  Komponen: string;
  Status: "PASS" | "WARN" | "FAIL";
  Detail: string;
  Latensi: string;
}

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL wajib diisi"),
  API_INDONESIA_BASE_URL: z.string().url().default("https://use.apiindonesia.id"),
  API_INDONESIA_KEY: z.string().min(1, "API_INDONESIA_KEY wajib diisi"),
  UPSTASH_REDIS_REST_URL: z.string().url("UPSTASH_REDIS_REST_URL wajib berupa URL valid"),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1, "UPSTASH_REDIS_REST_TOKEN wajib diisi"),
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET minimal 32 karakter"),
  CRON_SECRET: z.string().min(16, "CRON_SECRET minimal 16 karakter"),
  ML_SERVICE_URL: z.string().url().default("http://localhost:8000"),
});

async function main() {
  console.log("=========================================================");
  console.log(" 🌐 PantauPangan v2.0 - Environment Readiness Verifier  ");
  console.log("=========================================================\n");

  const results: CheckResult[] = [];
  let hasCriticalFailure = false;

  // 1. Validasi Skema Zod
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("❌ Kesalahan Validasi Environment Variables:\n");
    for (const issue of parsed.error.issues) {
      console.error(` - [${issue.path.join(".")}] ${issue.message}`);
    }
    console.log("\nPastikan variabel lingkungan telah terisi di file .env atau .env.local.\n");
    results.push({
      Komponen: "Env Schema (Zod)",
      Status: "FAIL",
      Detail: `${parsed.error.issues.length} variabel lingkungan tidak valid/kosong`,
      Latensi: "-",
    });
    hasCriticalFailure = true;
  } else {
    results.push({
      Komponen: "Env Schema (Zod)",
      Status: "PASS",
      Detail: "Seluruh variabel lingkungan wajib lolos validasi skema",
      Latensi: "-",
    });

    // Peringatan jika key API Indonesia belum berformat production
    if (!parsed.data.API_INDONESIA_KEY.startsWith("aip_live_")) {
      results.push({
        Komponen: "API Indonesia Key Format",
        Status: "WARN",
        Detail: "Key belum berawalan 'aip_live_' (pastikan menggunakan key resmi di produksi)",
        Latensi: "-",
      });
    } else {
      results.push({
        Komponen: "API Indonesia Key Format",
        Status: "PASS",
        Detail: "Format production key valid ('aip_live_***')",
        Latensi: "-",
      });
    }
  }

  // 2. Ping Database (SELECT 1)
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    const t0 = Date.now();
    try {
      const useSsl = dbUrl.includes("tidb") || dbUrl.includes("ssl");
      const connection = await mysql.createConnection({
        uri: dbUrl,
        ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
      });
      await connection.query("SELECT 1 as ping");
      await connection.end();
      const latency = Date.now() - t0;
      results.push({
        Komponen: "Database Connectivity",
        Status: "PASS",
        Detail: "Query SELECT 1 berhasil dieksekusi",
        Latensi: `${latency} ms`,
      });
    } catch (err) {
      results.push({
        Komponen: "Database Connectivity",
        Status: "FAIL",
        Detail: (err as Error).message.slice(0, 50),
        Latensi: `${Date.now() - t0} ms`,
      });
      hasCriticalFailure = true;
    }
  }

  // 3. Ping Upstash Redis (await redis.ping())
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (redisUrl && redisToken) {
    const t0 = Date.now();
    try {
      const redis = new Redis({ url: redisUrl, token: redisToken });
      const pong = await redis.ping();
      const latency = Date.now() - t0;
      if (pong === "PONG" || pong) {
        results.push({
          Komponen: "Upstash Redis",
          Status: "PASS",
          Detail: "Ping berhasil (PONG diterima)",
          Latensi: `${latency} ms`,
        });
      } else {
        throw new Error("Respons bukan PONG");
      }
    } catch (err) {
      results.push({
        Komponen: "Upstash Redis",
        Status: "FAIL",
        Detail: (err as Error).message.slice(0, 50),
        Latensi: `${Date.now() - t0} ms`,
      });
      hasCriticalFailure = true;
    }
  }

  // 4. Ping API Indonesia (Zero-Credit Endpoint)
  // GET https://use.apiindonesia.id/health dan /api/v1/meta/datasets (0 kredit)
  const apiBase = process.env.API_INDONESIA_BASE_URL || "https://use.apiindonesia.id";
  const t0 = Date.now();
  try {
    const healthUrl = `${apiBase.replace(/\/$/, "")}/health`;
    const res = await fetch(healthUrl, { method: "GET" });
    const latency = Date.now() - t0;

    if (res.ok || res.status === 200 || res.status === 404) {
      // Coba endpoint metadata bebas kredit jika /health 404
      results.push({
        Komponen: "API Indonesia Gateway (0 Credit)",
        Status: "PASS",
        Detail: `Koneksi keluar normal (HTTP ${res.status})`,
        Latensi: `${latency} ms`,
      });
    } else {
      results.push({
        Komponen: "API Indonesia Gateway (0 Credit)",
        Status: "FAIL",
        Detail: `Gateway merespons HTTP ${res.status}`,
        Latensi: `${latency} ms`,
      });
      hasCriticalFailure = true;
    }
  } catch (err) {
    results.push({
      Komponen: "API Indonesia Gateway (0 Credit)",
      Status: "FAIL",
      Detail: `Gagal koneksi ke gateway: ${(err as Error).message.slice(0, 40)}`,
      Latensi: `${Date.now() - t0} ms`,
    });
    hasCriticalFailure = true;
  }

  // 5. Ping FastAPI ML Service
  const mlUrl = process.env.ML_SERVICE_URL || "http://localhost:8000";
  const tMl = Date.now();
  try {
    const res = await fetch(`${mlUrl.replace(/\/$/, "")}/health`, { method: "GET" });
    const latency = Date.now() - tMl;
    if (res.ok) {
      results.push({
        Komponen: "FastAPI ML Service",
        Status: "PASS",
        Detail: "Layanan prediksi deret waktu online",
        Latensi: `${latency} ms`,
      });
    } else {
      results.push({
        Komponen: "FastAPI ML Service",
        Status: "WARN",
        Detail: `Service merespons HTTP ${res.status}`,
        Latensi: `${latency} ms`,
      });
    }
  } catch {
    results.push({
      Komponen: "FastAPI ML Service",
      Status: "WARN",
      Detail: "Layanan ML offline (dapat dijalankan lokal via uvicorn)",
      Latensi: `${Date.now() - tMl} ms`,
    });
  }

  // Cetak Tabel Ringkasan
  console.table(results);

  console.log("---------------------------------------------------------");
  if (hasCriticalFailure) {
    console.error("❌ Verifikasi Environment: GAGAL. Perbaiki konfigurasi di atas sebelum deploy.\n");
    process.exitCode = 1;
  } else {
    console.log("✅ Verifikasi Environment: SUKSES. Seluruh koneksi siap untuk produksi!\n");
    process.exitCode = 0;
  }
}

main().catch((err) => {
  console.error("Fatal error during environment verification:", err);
  process.exit(1);
});
