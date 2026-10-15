import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { db, poolConnection } from "@/lib/db";
import {
  provinces,
  commodities,
  commodityPrices,
  commodityAnomalies,
  apiSyncMetadata,
} from "@/lib/db/schema";
import { apiIndonesiaClient } from "@/lib/api-indonesia/client";
import {
  PROVINCES_SEED_DATA,
  slugify,
  categorizeCommodity,
  getCommodityIcon,
  mapSeverity,
  calculateMoMAndYoY,
} from "@/lib/api-indonesia/sync-engine";
import { redisDelByPattern } from "@/lib/redis";
import { sql, eq } from "drizzle-orm";

// -------------------------------------------------------------
// Credit Tracker Guard (Hemat Kredit API Indonesia: 2 kredit/hit)
// -------------------------------------------------------------
class CreditTracker {
  private used = 0;
  private max: number;

  constructor(max: number) {
    this.max = max;
  }

  canConsume(amount = 2): boolean {
    return this.used + amount <= this.max;
  }

  consume(amount = 2): void {
    this.used += amount;
  }

  getUsed(): number {
    return this.used;
  }

  getRemaining(): number {
    return Math.max(0, this.max - this.used);
  }

  getMax(): number {
    return this.max;
  }
}

// -------------------------------------------------------------
// Parse CLI Arguments
// -------------------------------------------------------------
function parseCliArgs() {
  const args = process.argv.slice(2);
  let maxCredits = 300;
  let fromDate = "2024-01";
  let provFromDate = "2025-01";

  for (const arg of args) {
    if (arg.startsWith("--max-credits=")) {
      const val = parseInt(arg.split("=")[1], 10);
      if (!isNaN(val) && val > 0) maxCredits = val;
    } else if (arg.startsWith("--from=")) {
      fromDate = arg.split("=")[1] || "2024-01";
    } else if (arg.startsWith("--prov-from=")) {
      provFromDate = arg.split("=")[1] || "2025-01";
    }
  }

  return { maxCredits, fromDate, provFromDate };
}

async function main() {
  const startTime = Date.now();
  const { maxCredits, fromDate, provFromDate } = parseCliArgs();
  const tracker = new CreditTracker(maxCredits);

  console.log("=================================================================");
  console.log(" 🌾 PantauPangan v2.0 - Credit-Guarded Production Seeder");
  console.log("=================================================================");
  console.log(` Target Max Credits : ${maxCredits} kredit (2 kredit / request)`);
  console.log(` Periode Nasional   : Dari ${fromDate}`);
  console.log(` Periode Provinsi   : Dari ${provFromDate} (Hemat Kuota)`);
  console.log("=================================================================\n");

  const summary = {
    provincesCount: 0,
    commoditiesCount: 0,
    anomaliesCount: 0,
    pricesNationalCount: 0,
    pricesProvincialCount: 0,
  };

  try {
    // -------------------------------------------------------------
    // TAHAP 1: Master 38 Provinsi
    // -------------------------------------------------------------
    console.log("📍 [Tahap 1/7] Sinkronisasi Master 38 Provinsi...");
    let provincesData: Array<{ code: string; name: string; altName?: string | null; lat?: number | null; lng?: number | null }> = [];

    if (tracker.canConsume(2)) {
      try {
        console.log("   Mengambil data provinsi dari API Indonesia (GET /wilayah/provinsi)...");
        const provRes = await apiIndonesiaClient.getProvinces();
        tracker.consume(2);

        if (provRes.data && Array.isArray(provRes.data) && provRes.data.length > 0) {
          provincesData = provRes.data
            .map((p) => {
              const code = p.kode || p.code || String(p.id || "");
              const name = p.nama || p.name || "";
              const centroid = PROVINCES_SEED_DATA.find((sp) => sp.code === code);
              return {
                code,
                name,
                altName: centroid?.altName ?? null,
                lat: centroid?.lat ?? null,
                lng: centroid?.lng ?? null,
              };
            })
            .filter((p) => Boolean(p.code && p.name));
          console.log(`   Berhasil menarik ${provincesData.length} provinsi dari API resmi.`);
        }
      } catch (err) {
        console.warn(`   ⚠️ Panggilan API provinsi gagal (${(err as Error).message}). Menggunakan fallback data statis BPS.`);
      }
    } else {
      console.warn("   ⚠️ Batas kredit tercapai sebelum tahap 1. Menggunakan fallback data statis BPS.");
    }

    if (provincesData.length === 0) {
      provincesData = PROVINCES_SEED_DATA;
      console.log(`   Menggunakan ${provincesData.length} data provinsi statis fallback.`);
    }

    for (const p of provincesData) {
      await db
        .insert(provinces)
        .values({
          code: p.code,
          name: p.name,
          altName: p.altName ?? null,
          lat: p.lat ?? null,
          lng: p.lng ?? null,
        })
        .onDuplicateKeyUpdate({
          set: {
            name: p.name,
            altName: p.altName ?? null,
            lat: p.lat ?? null,
            lng: p.lng ?? null,
            updatedAt: sql`CURRENT_TIMESTAMP`,
          },
        });
      summary.provincesCount++;
    }
    console.log(`   ✅ Selesai: ${summary.provincesCount} provinsi terdata di database.\n`);

    // -------------------------------------------------------------
    // TAHAP 2: Ringkasan Seri & Sinkronisasi Metadata
    // -------------------------------------------------------------
    console.log("📊 [Tahap 2/7] Sinkronisasi Metadata Seri Pangan (GET /harga-pangan)...");
    if (tracker.canConsume(2)) {
      try {
        const seriesRes = await apiIndonesiaClient.getSeriesSummary();
        tracker.consume(2);

        if (seriesRes.data && Array.isArray(seriesRes.data)) {
          for (const s of seriesRes.data) {
            await db
              .insert(apiSyncMetadata)
              .values({
                level: s.tingkat,
                regionScope: s.wilayah,
                commodityCount: s.komoditas,
                rowCount: s.rows,
                periodFrom: s.dari,
                periodTo: s.sampai,
                lastCheckedAt: sql`CURRENT_TIMESTAMP`,
                lastSyncedAt: sql`CURRENT_TIMESTAMP`,
                lastSyncStatus: "success",
                creditsEstimated: 2,
              })
              .onDuplicateKeyUpdate({
                set: {
                  commodityCount: s.komoditas,
                  rowCount: s.rows,
                  periodFrom: s.dari,
                  periodTo: s.sampai,
                  lastCheckedAt: sql`CURRENT_TIMESTAMP`,
                  lastSyncedAt: sql`CURRENT_TIMESTAMP`,
                  lastSyncStatus: "success",
                },
              });
          }
          console.log(`   ✅ Selesai: ${seriesRes.data.length} lingkup seri metadata diperbarui.`);
        }
      } catch (err) {
        console.warn(`   ⚠️ Sinkronisasi metadata seri gagal: ${(err as Error).message}`);
      }
    } else {
      console.warn("   ⚠️ Sisa kredit tidak mencukupi untuk Tahap 2, melewati...");
    }
    console.log("");

    // -------------------------------------------------------------
    // TAHAP 3: Master Komoditas & Anomali Terbaru (GET /anomali)
    // -------------------------------------------------------------
    console.log("🔍 [Tahap 3/7] Sinkronisasi Master Komoditas & Anomali (GET /anomali)...");
    const commodityMap = new Map<string, number>();

    // Load existing commodities first
    const existingComms = await db.select().from(commodities);
    for (const c of existingComms) {
      commodityMap.set(c.apiName, c.id);
      commodityMap.set(c.slug, c.id);
    }

    if (tracker.canConsume(2)) {
      try {
        const anomaliRes = await apiIndonesiaClient.getPriceAnomalies({ limit: 100 });
        tracker.consume(2);

        if (anomaliRes.data && Array.isArray(anomaliRes.data)) {
          console.log(`   Menerima ${anomaliRes.data.length} record anomali harga.`);

          // Ekstrak dan upsert master komoditas unik
          for (const item of anomaliRes.data) {
            if (!item.komoditas) continue;

            let commId = commodityMap.get(item.komoditas);
            if (!commId) {
              const slug = slugify(item.komoditas);
              const category = categorizeCommodity(item.komoditas);
              const icon = getCommodityIcon(item.komoditas);

              await db
                .insert(commodities)
                .values({
                  slug,
                  apiName: item.komoditas,
                  displayName: item.komoditas,
                  category,
                  unit: "per kg",
                  icon,
                  hasConsumerNational: true,
                  hasConsumerProv: true,
                  hasProducerNational: true,
                  hasProducerProv: true,
                  isActive: true,
                })
                .onDuplicateKeyUpdate({
                  set: {
                    displayName: item.komoditas,
                    category,
                    icon,
                  },
                });

              const [found] = await db
                .select({ id: commodities.id })
                .from(commodities)
                .where(eq(commodities.apiName, item.komoditas))
                .limit(1);

              if (found) {
                commId = found.id;
                commodityMap.set(item.komoditas, commId);
                commodityMap.set(slug, commId);
                summary.commoditiesCount++;
              }
            }

            // Upsert anomali
            if (commId) {
              const severity = mapSeverity(item.status);
              await db
                .insert(commodityAnomalies)
                .values({
                  commodityId: commId,
                  periodMonth: item.tanggal,
                  qipa: item.qipa !== undefined ? String(item.qipa) : null,
                  aipa: item.aipa !== undefined ? String(item.aipa) : null,
                  ifpa: item.ifpa !== undefined ? String(item.ifpa) : null,
                  status: item.status,
                  severity,
                })
                .onDuplicateKeyUpdate({
                  set: {
                    qipa: item.qipa !== undefined ? String(item.qipa) : null,
                    aipa: item.aipa !== undefined ? String(item.aipa) : null,
                    ifpa: item.ifpa !== undefined ? String(item.ifpa) : null,
                    status: item.status,
                    severity,
                    updatedAt: sql`CURRENT_TIMESTAMP`,
                  },
                });
              summary.anomaliesCount++;
            }
          }
          console.log(`   ✅ Selesai: Master komoditas dan ${summary.anomaliesCount} anomali tersimpan.`);
        }
      } catch (err) {
        console.warn(`   ⚠️ Sinkronisasi anomali gagal: ${(err as Error).message}`);
      }
    } else {
      console.warn("   ⚠️ Sisa kredit tidak mencukupi untuk Tahap 3, melewati...");
    }
    console.log("");

    // Refresh commodity map
    const allComms = await db.select().from(commodities);
    for (const c of allComms) {
      commodityMap.set(c.apiName, c.id);
      commodityMap.set(c.slug, c.id);
    }

    // -------------------------------------------------------------
    // Helper untuk Upsert Record Harga Bulanan
    // -------------------------------------------------------------
    async function upsertPriceItems(
      items: Array<{
        tingkat: "konsumen" | "produsen";
        wilayah: "nasional" | "provinsi";
        provinsi?: string | null;
        komoditas: string;
        tanggal: string;
        harga: number | string | null;
        harga_raw?: string | null;
      }>
    ): Promise<number> {
      let inserted = 0;
      for (const item of items) {
        const commId = commodityMap.get(item.komoditas);
        if (!commId) continue;

        let cleanPrice: number | null = null;
        if (
          item.harga !== null &&
          item.harga !== undefined &&
          item.harga !== "-" &&
          item.harga !== ""
        ) {
          const num = typeof item.harga === "number" ? item.harga : Number(String(item.harga).replace(/[^0-9.-]+/g, ""));
          if (!isNaN(num) && num > 0) {
            cleanPrice = Math.round(num);
          }
        }

        const provCode = item.wilayah === "provinsi" && item.provinsi ? String(item.provinsi).padStart(2, "0") : null;

        await db
          .insert(commodityPrices)
          .values({
            commodityId: commId,
            level: item.tingkat,
            regionScope: item.wilayah,
            provinceCode: provCode,
            periodMonth: item.tanggal,
            price: cleanPrice,
            priceRaw: item.harga_raw || (cleanPrice !== null ? String(cleanPrice) : null),
            momChangePct: null,
            yoyChangePct: null,
          })
          .onDuplicateKeyUpdate({
            set: {
              price: cleanPrice,
              priceRaw: item.harga_raw || (cleanPrice !== null ? String(cleanPrice) : null),
              updatedAt: sql`CURRENT_TIMESTAMP`,
            },
          });
        inserted++;
      }
      return inserted;
    }

    // -------------------------------------------------------------
    // TAHAP 4: Data Harga Nasional (Konsumen & Produsen)
    // -------------------------------------------------------------
    console.log("📈 [Tahap 4/7] Sinkronisasi Data Harga Nasional (Konsumen & Produsen)...");

    // 4a. Konsumen Nasional
    if (tracker.canConsume(2)) {
      try {
        console.log(`   Mengambil harga Konsumen Nasional (dari: ${fromDate})...`);
        let page = 1;
        while (tracker.canConsume(2)) {
          const res = await apiIndonesiaClient.getMonthlyPrices({
            tingkat: "konsumen",
            wilayah: "nasional",
            dari: fromDate,
            page,
            limit: 100,
          });
          tracker.consume(2);

          const items = res.data;
          if (!items || !Array.isArray(items) || items.length === 0) break;

          const count = await upsertPriceItems(items);
          summary.pricesNationalCount += count;
          console.log(`     Halaman ${page}: ${count} record tersimpan. (Sisa kredit: ${tracker.getRemaining()})`);

          if (items.length < 100) break;
          page++;
        }
      } catch (err) {
        console.warn(`   ⚠️ Gagal sinkronisasi konsumen nasional: ${(err as Error).message}`);
      }
    } else {
      console.warn("   ⚠️ Batas kredit tercapai, melewati Konsumen Nasional.");
    }

    // 4b. Produsen Nasional
    if (tracker.canConsume(2)) {
      try {
        console.log(`   Mengambil harga Produsen Nasional (dari: ${fromDate})...`);
        let page = 1;
        while (tracker.canConsume(2)) {
          const res = await apiIndonesiaClient.getMonthlyPrices({
            tingkat: "produsen",
            wilayah: "nasional",
            dari: fromDate,
            page,
            limit: 100,
          });
          tracker.consume(2);

          const items = res.data;
          if (!items || !Array.isArray(items) || items.length === 0) break;

          const count = await upsertPriceItems(items);
          summary.pricesNationalCount += count;
          console.log(`     Halaman ${page}: ${count} record tersimpan. (Sisa kredit: ${tracker.getRemaining()})`);

          if (items.length < 100) break;
          page++;
        }
      } catch (err) {
        console.warn(`   ⚠️ Gagal sinkronisasi produsen nasional: ${(err as Error).message}`);
      }
    } else {
      console.warn("   ⚠️ Batas kredit tercapai, melewati Produsen Nasional.");
    }

    console.log(`   ✅ Selesai Tahap 4: Total ${summary.pricesNationalCount} harga nasional terdata.\n`);

    // -------------------------------------------------------------
    // TAHAP 5: Data Harga Provinsi (Prioritas Terbatas & Hemat Kredit)
    // -------------------------------------------------------------
    console.log("🗺️ [Tahap 5/7] Sinkronisasi Data Harga Provinsi (Konsumen & Produsen)...");

    // 5a. Konsumen Provinsi
    if (tracker.canConsume(2)) {
      try {
        console.log(`   Mengambil harga Konsumen Provinsi (dari: ${provFromDate})...`);
        let page = 1;
        while (tracker.canConsume(2)) {
          const res = await apiIndonesiaClient.getMonthlyPrices({
            tingkat: "konsumen",
            wilayah: "provinsi",
            dari: provFromDate,
            page,
            limit: 100,
          });
          tracker.consume(2);

          const items = res.data;
          if (!items || !Array.isArray(items) || items.length === 0) break;

          const count = await upsertPriceItems(items);
          summary.pricesProvincialCount += count;
          console.log(`     Halaman ${page}: ${count} record tersimpan. (Sisa kredit: ${tracker.getRemaining()})`);

          if (items.length < 100) break;
          page++;
        }
      } catch (err) {
        console.warn(`   ⚠️ Gagal sinkronisasi konsumen provinsi: ${(err as Error).message}`);
      }
    } else {
      console.warn("   ⚠️ Batas kredit tercapai, melewati Konsumen Provinsi.");
    }

    // 5b. Produsen Provinsi
    if (tracker.canConsume(2)) {
      try {
        console.log(`   Mengambil harga Produsen Provinsi (dari: ${provFromDate})...`);
        let page = 1;
        while (tracker.canConsume(2)) {
          const res = await apiIndonesiaClient.getMonthlyPrices({
            tingkat: "produsen",
            wilayah: "provinsi",
            dari: provFromDate,
            page,
            limit: 100,
          });
          tracker.consume(2);

          const items = res.data;
          if (!items || !Array.isArray(items) || items.length === 0) break;

          const count = await upsertPriceItems(items);
          summary.pricesProvincialCount += count;
          console.log(`     Halaman ${page}: ${count} record tersimpan. (Sisa kredit: ${tracker.getRemaining()})`);

          if (items.length < 100) break;
          page++;
        }
      } catch (err) {
        console.warn(`   ⚠️ Gagal sinkronisasi produsen provinsi: ${(err as Error).message}`);
      }
    } else {
      console.warn("   ⚠️ Batas kredit tercapai, melewati Produsen Provinsi.");
    }

    console.log(`   ✅ Selesai Tahap 5: Total ${summary.pricesProvincialCount} harga provinsi terdata.\n`);

    // -------------------------------------------------------------
    // TAHAP 6: Kalkulasi MoM & YoY
    // -------------------------------------------------------------
    console.log("📐 [Tahap 6/7] Menghitung Metrik Perubahan MoM (M-1) & YoY (M-12)...");
    try {
      await calculateMoMAndYoY("konsumen", "nasional");
      await calculateMoMAndYoY("produsen", "nasional");
      await calculateMoMAndYoY("konsumen", "provinsi");
      await calculateMoMAndYoY("produsen", "provinsi");
      console.log("   ✅ Selesai: Kalkulasi MoM dan YoY berhasil diperbarui.");
    } catch (err) {
      console.warn(`   ⚠️ Kalkulasi MoM/YoY ada catatan: ${(err as Error).message}`);
    }
    console.log("");

    // -------------------------------------------------------------
    // TAHAP 7: Invalidate Cache & Pemicu AI Forecasting (Asinkron)
    // -------------------------------------------------------------
    console.log("⚡ [Tahap 7/7] Cache Invalidation & Pemicu AI Forecasting Microservice...");
    try {
      await redisDelByPattern("pantau:*");
      console.log("   Redis cache dibersihkan (pantau:*).");
    } catch (err) {
      console.warn("   Catatan cache redis:", (err as Error).message);
    }

    const mlServiceUrl = process.env.ML_SERVICE_URL || "http://localhost:8000";
    fetch(`${mlServiceUrl}/internal/forecast/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trigger: "seed_production_completed",
        monthsAhead: 6,
        timestamp: new Date().toISOString(),
      }),
    })
      .then(() => console.log("   Trigger AI forecasting dikirim ke microservice."))
      .catch((err) => console.info(`   Microservice notice (${mlServiceUrl}): ${(err as Error).message}`));

    // Selesai
    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log("\n=================================================================");
    console.log(" ✨ SINKRONISASI DATA PRODUKSI SELESAI");
    console.log("=================================================================");
    console.log(` Waktu Eksekusi         : ${elapsedSec} detik`);
    console.log(` Kredit Terpakai        : ${tracker.getUsed()} / ${tracker.getMax()} kredit`);
    console.log(` Sisa Kredit Limit      : ${tracker.getRemaining()} kredit`);
    console.log(` Master Provinsi        : ${summary.provincesCount}`);
    console.log(` Master Komoditas       : ${summary.commoditiesCount}`);
    console.log(` Anomali Terdata        : ${summary.anomaliesCount}`);
    console.log(` Record Harga Nasional  : ${summary.pricesNationalCount}`);
    console.log(` Record Harga Provinsi  : ${summary.pricesProvincialCount}`);
    console.log("=================================================================\n");
  } catch (fatalErr) {
    console.error("❌ Terjadi kesalahan fatal selama seeding produksi:", fatalErr);
    process.exitCode = 1;
  } finally {
    try {
      await poolConnection.end();
    } catch {}
  }
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exitCode = 1;
});
