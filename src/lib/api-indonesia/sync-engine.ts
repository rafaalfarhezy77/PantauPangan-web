import { db } from "@/lib/db";
import {
  provinces,
  commodities,
  commodityPrices,
  commodityAnomalies,
  apiSyncMetadata,
} from "@/lib/db/schema";
import { apiIndonesiaClient } from "./client";
import {
  HargaPanganItem,
  HargaPanganSummaryItem,
  TingkatHarga,
  WilayahHarga,
} from "./types";
import { redisDelByPattern } from "@/lib/redis";
import { and, eq, sql } from "drizzle-orm";

// 38 Provinsi Resmi Indonesia (BPS) dengan koordinat centroid
export const PROVINCES_SEED_DATA = [
  { code: "11", name: "Aceh", altName: "Nanggroe Aceh Darussalam", lat: 4.695135, lng: 96.749399 },
  { code: "12", name: "Sumatera Utara", altName: "Sumut", lat: 2.115355, lng: 99.545097 },
  { code: "13", name: "Sumatera Barat", altName: "Sumbar", lat: -0.73994, lng: 100.800005 },
  { code: "14", name: "Riau", altName: null, lat: 0.293347, lng: 101.706829 },
  { code: "15", name: "Jambi", altName: null, lat: -1.485183, lng: 102.438058 },
  { code: "16", name: "Sumatera Selatan", altName: "Sumsel", lat: -3.319437, lng: 104.91471 },
  { code: "17", name: "Bengkulu", altName: null, lat: -3.577847, lng: 102.346388 },
  { code: "18", name: "Lampung", altName: null, lat: -4.558585, lng: 105.406808 },
  { code: "19", name: "Kepulauan Bangka Belitung", altName: "Babel", lat: -2.741051, lng: 106.440587 },
  { code: "21", name: "Kepulauan Riau", altName: "Kepri", lat: 3.945651, lng: 108.142867 },
  { code: "31", name: "DKI Jakarta", altName: "Jakarta", lat: -6.208763, lng: 106.845599 },
  { code: "32", name: "Jawa Barat", altName: "Jabar", lat: -6.917464, lng: 107.619123 },
  { code: "33", name: "Jawa Tengah", altName: "Jateng", lat: -7.150975, lng: 110.140259 },
  { code: "34", name: "DI Yogyakarta", altName: "Jogja", lat: -7.79558, lng: 110.36949 },
  { code: "35", name: "Jawa Timur", altName: "Jatim", lat: -7.536064, lng: 112.238402 },
  { code: "36", name: "Banten", altName: null, lat: -6.405817, lng: 106.064018 },
  { code: "51", name: "Bali", altName: null, lat: -8.409518, lng: 115.188916 },
  { code: "52", name: "Nusa Tenggara Barat", altName: "NTB", lat: -8.652933, lng: 117.361648 },
  { code: "53", name: "Nusa Tenggara Timur", altName: "NTT", lat: -8.657382, lng: 121.07937 },
  { code: "61", name: "Kalimantan Barat", altName: "Kalbar", lat: -0.278781, lng: 111.475285 },
  { code: "62", name: "Kalimantan Tengah", altName: "Kalteng", lat: -1.681488, lng: 113.382355 },
  { code: "63", name: "Kalimantan Selatan", altName: "Kalsel", lat: -3.092642, lng: 115.283759 },
  { code: "64", name: "Kalimantan Timur", altName: "Kaltim", lat: 0.538659, lng: 116.419389 },
  { code: "65", name: "Kalimantan Utara", altName: "Kaltara", lat: 3.073093, lng: 116.041388 },
  { code: "71", name: "Sulawesi Utara", altName: "Sulut", lat: 0.624693, lng: 123.975002 },
  { code: "72", name: "Sulawesi Tengah", altName: "Sulteng", lat: -1.430025, lng: 121.445618 },
  { code: "73", name: "Sulawesi Selatan", altName: "Sulsel", lat: -3.668799, lng: 119.974053 },
  { code: "74", name: "Sulawesi Tenggara", altName: "Sultra", lat: -4.14491, lng: 122.174605 },
  { code: "75", name: "Gorontalo", altName: null, lat: 0.699937, lng: 122.446724 },
  { code: "76", name: "Sulawesi Barat", altName: "Sulbar", lat: -2.844137, lng: 119.232078 },
  { code: "81", name: "Maluku", altName: null, lat: -3.238462, lng: 130.145273 },
  { code: "82", name: "Maluku Utara", altName: "Malut", lat: 1.570999, lng: 127.808769 },
  { code: "91", name: "Papua", altName: null, lat: -4.269928, lng: 138.080353 },
  { code: "92", name: "Papua Barat", altName: null, lat: -1.336115, lng: 133.174716 },
  { code: "93", name: "Papua Selatan", altName: null, lat: -7.0, lng: 139.5 },
  { code: "94", name: "Papua Tengah", altName: null, lat: -3.5, lng: 136.5 },
  { code: "95", name: "Papua Pegunungan", altName: null, lat: -4.1, lng: 139.0 },
  { code: "96", name: "Papua Barat Daya", altName: null, lat: -1.0, lng: 131.5 },
];

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

export function categorizeCommodity(name: string): "pokok" | "bumbu" | "protein" | "minyak_gula" | "lainnya" {
  const lower = name.toLowerCase();
  if (
    lower.includes("beras") ||
    lower.includes("jagung") ||
    lower.includes("kedelai") ||
    lower.includes("terigu") ||
    lower.includes("singkong") ||
    lower.includes("ubi")
  ) {
    return "pokok";
  }
  if (
    lower.includes("cabai") ||
    lower.includes("cabe") ||
    lower.includes("bawang") ||
    lower.includes("merica") ||
    lower.includes("jahe") ||
    lower.includes("kunyit")
  ) {
    return "bumbu";
  }
  if (
    lower.includes("daging") ||
    lower.includes("ayam") ||
    lower.includes("telur") ||
    lower.includes("ikan") ||
    lower.includes("sapi")
  ) {
    return "protein";
  }
  if (
    lower.includes("minyak") ||
    lower.includes("gula") ||
    lower.includes("minyakita")
  ) {
    return "minyak_gula";
  }
  return "lainnya";
}

export function getCommodityIcon(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("beras")) return "🌾";
  if (lower.includes("cabai") || lower.includes("cabe")) return "🌶️";
  if (lower.includes("bawang")) return "🧅";
  if (lower.includes("ayam")) return "🍗";
  if (lower.includes("sapi") || lower.includes("daging")) return "🥩";
  if (lower.includes("telur")) return "🥚";
  if (lower.includes("ikan")) return "🐟";
  if (lower.includes("minyak")) return "🫗";
  if (lower.includes("gula")) return "🍬";
  if (lower.includes("jagung")) return "🌽";
  return "📦";
}

export function mapSeverity(
  status: string
): "normal" | "warning" | "alert_low" | "alert_high" {
  const lower = status.toLowerCase();
  if (lower.includes("alert (high") || lower.includes("high price")) return "alert_high";
  if (lower.includes("alert (low") || lower.includes("low price")) return "alert_low";
  if (lower.includes("warning")) return "warning";
  return "normal";
}

export async function syncProvincesIfEmpty(): Promise<number> {
  const existing = await db.select({ count: sql<number>`count(*)` }).from(provinces);
  const count = Number(existing[0]?.count ?? 0);
  if (count > 0) {
    return count;
  }

  console.log("[SyncEngine] Seeding 38 provinces into database...");
  for (const prov of PROVINCES_SEED_DATA) {
    await db
      .insert(provinces)
      .values({
        code: prov.code,
        name: prov.name,
        altName: prov.altName,
        lat: prov.lat,
        lng: prov.lng,
      })
      .onDuplicateKeyUpdate({
        set: {
          name: prov.name,
          altName: prov.altName,
          lat: prov.lat,
          lng: prov.lng,
        },
      });
  }

  // Attempt to enrich or sync from API Indonesia if key is set
  try {
    if (process.env.API_INDONESIA_KEY) {
      const res = await apiIndonesiaClient.getProvinces();
      if (res.data && Array.isArray(res.data)) {
        for (const item of res.data) {
          const code = String(item.code || item.kode || item.id || "");
          const name = item.name || item.nama;
          if (code && name) {
            await db
              .insert(provinces)
              .values({
                code,
                name,
                altName: item.alt_name || null,
                lat: item.lat ?? item.latitude ?? null,
                lng: item.lng ?? item.longitude ?? null,
              })
              .onDuplicateKeyUpdate({
                set: {
                  name,
                },
              });
          }
        }
      }
    }
  } catch (err) {
    console.warn("[SyncEngine] Note: API Indonesia provinces check skipped or failed:", (err as Error).message);
  }

  return 38;
}

export interface DeltaSyncResult {
  seriesChecked: number;
  seriesUpdated: number;
  rowsInserted: number;
  creditsUsedEstimate: number;
  details: Array<{
    tingkat: TingkatHarga;
    wilayah: WilayahHarga;
    action: "skipped" | "synced" | "failed";
    reason?: string;
    rows?: number;
  }>;
}

export async function checkAndRunDeltaSync(options?: {
  forceFullSync?: boolean;
}): Promise<DeltaSyncResult> {
  const result: DeltaSyncResult = {
    seriesChecked: 0,
    seriesUpdated: 0,
    rowsInserted: 0,
    creditsUsedEstimate: 0,
    details: [],
  };

  // 1. Pastikan tabel master provinsi terisi
  await syncProvincesIfEmpty();

  // 2. Tarik ringkasan seri dari API Indonesia (1 call = 2 kredit)
  console.log("[SyncEngine] Fetching series summary from /api/v1/harga-pangan...");
  const summaryRes = await apiIndonesiaClient.getSeriesSummary();
  result.creditsUsedEstimate += 2;

  const seriesList: HargaPanganSummaryItem[] = Array.isArray(summaryRes.data)
    ? summaryRes.data
    : [];

  result.seriesChecked = seriesList.length;

  // 3. Cache komoditas map: api_name -> id
  const existingCommodities = await db.select().from(commodities);
  const commodityMap = new Map<string, number>();
  for (const c of existingCommodities) {
    commodityMap.set(c.apiName, c.id);
  }

  // 4. Proses setiap seri secara efisien
  for (const series of seriesList) {
    const { tingkat, wilayah, sampai, rows } = series;

    // Ambil metadata sinkronisasi sebelumnya
    const metaRecord = await db
      .select()
      .from(apiSyncMetadata)
      .where(
        and(
          eq(apiSyncMetadata.level, tingkat),
          eq(apiSyncMetadata.regionScope, wilayah)
        )
      )
      .limit(1);

    const prevMeta = metaRecord[0];

    // Cek apakah dataset sama persis (Delta check)
    if (
      !options?.forceFullSync &&
      prevMeta &&
      prevMeta.periodTo === sampai &&
      prevMeta.rowCount === rows
    ) {
      console.log(
        `[SyncEngine] Series ${tingkat}-${wilayah} is already up-to-date (${sampai}, ${rows} rows). Skipping (0 credits).`
      );
      result.details.push({
        tingkat,
        wilayah,
        action: "skipped",
        reason: `Up-to-date at period ${sampai} with ${rows} rows`,
      });
      continue;
    }

    // Tentukan range 'dari' dan 'sampai'
    let fetchFrom = series.dari;
    if (prevMeta && prevMeta.periodTo && !options?.forceFullSync) {
      // Ambil bulan setelah periodTo
      const [yearStr, monthStr] = prevMeta.periodTo.split("-");
      let year = parseInt(yearStr, 10);
      let month = parseInt(monthStr, 10) + 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
      const nextPeriod = `${year}-${String(month).padStart(2, "0")}`;
      if (nextPeriod <= sampai) {
        fetchFrom = nextPeriod;
      }
    }

    console.log(
      `[SyncEngine] Syncing ${tingkat}-${wilayah} from ${fetchFrom} to ${sampai}...`
    );

    let page = 1;
    let totalPages = 1;
    let seriesRowsInserted = 0;

    try {
      while (page <= totalPages) {
        const pricesRes = await apiIndonesiaClient.getMonthlyPrices({
          tingkat,
          wilayah,
          dari: fetchFrom,
          sampai,
          page,
          limit: 100,
        });

        result.creditsUsedEstimate += 2;
        if (pricesRes.meta?.total_pages) {
          totalPages = pricesRes.meta.total_pages;
        }

        const items: HargaPanganItem[] = Array.isArray(pricesRes.data)
          ? pricesRes.data
          : [];

        if (items.length === 0) break;

        // Pastikan komoditas terdaftar di DB
        for (const item of items) {
          if (!commodityMap.has(item.komoditas)) {
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
                hasConsumerNational: tingkat === "konsumen" && wilayah === "nasional",
                hasConsumerProv: tingkat === "konsumen" && wilayah === "provinsi",
                hasProducerNational: tingkat === "produsen" && wilayah === "nasional",
                hasProducerProv: tingkat === "produsen" && wilayah === "provinsi",
                isActive: true,
              })
              .onDuplicateKeyUpdate({
                set: {
                  displayName: item.komoditas,
                  ...(tingkat === "konsumen" && wilayah === "nasional"
                    ? { hasConsumerNational: true }
                    : {}),
                  ...(tingkat === "konsumen" && wilayah === "provinsi"
                    ? { hasConsumerProv: true }
                    : {}),
                  ...(tingkat === "produsen" && wilayah === "nasional"
                    ? { hasProducerNational: true }
                    : {}),
                  ...(tingkat === "produsen" && wilayah === "provinsi"
                    ? { hasProducerProv: true }
                    : {}),
                },
              });

            const inserted = await db
              .select({ id: commodities.id })
              .from(commodities)
              .where(eq(commodities.apiName, item.komoditas))
              .limit(1);

            if (inserted[0]) {
              commodityMap.set(item.komoditas, inserted[0].id);
            }
          }
        }

        // Simpan harga ke tabel commodity_prices
        for (const item of items) {
          const commId = commodityMap.get(item.komoditas);
          if (!commId) continue;

          // Parsing harga null / "-" dengan aman (menghindari NaN)
          let cleanPrice: number | null = null;
          if (item.harga !== null && item.harga !== undefined) {
            cleanPrice = Math.round(Number(item.harga));
            if (isNaN(cleanPrice) || cleanPrice <= 0) cleanPrice = null;
          } else if (item.harga_raw && item.harga_raw !== "-") {
            const parsed = parseInt(item.harga_raw.replace(/[^\d]/g, ""), 10);
            cleanPrice = !isNaN(parsed) && parsed > 0 ? parsed : null;
          }

          const provCode =
            item.kode_provinsi && item.kode_provinsi.trim() !== ""
              ? item.kode_provinsi.trim()
              : null;

          await db
            .insert(commodityPrices)
            .values({
              commodityId: commId,
              level: tingkat,
              regionScope: wilayah,
              provinceCode: provCode,
              periodMonth: item.tanggal,
              price: cleanPrice,
              priceRaw: item.harga_raw || (cleanPrice ? String(cleanPrice) : null),
              momChangePct: null, // akan dihitung otomatis di batch update
              yoyChangePct: null,
            })
            .onDuplicateKeyUpdate({
              set: {
                price: cleanPrice,
                priceRaw: item.harga_raw || (cleanPrice ? String(cleanPrice) : null),
                updatedAt: sql`CURRENT_TIMESTAMP`,
              },
            });

          seriesRowsInserted++;
        }

        page++;
      }

      // Hitung MoM & YoY change untuk harga yang baru diupdate
      await calculateMoMAndYoY(tingkat, wilayah);

      // Simpan status metadata sync
      await db
        .insert(apiSyncMetadata)
        .values({
          level: tingkat,
          regionScope: wilayah,
          commodityCount: series.komoditas,
          rowCount: series.rows,
          periodFrom: series.dari,
          periodTo: series.sampai,
          lastCheckedAt: sql`CURRENT_TIMESTAMP`,
          lastSyncedAt: sql`CURRENT_TIMESTAMP`,
          lastSyncStatus: "success",
          creditsEstimated: result.creditsUsedEstimate,
        })
        .onDuplicateKeyUpdate({
          set: {
            commodityCount: series.komoditas,
            rowCount: series.rows,
            periodFrom: series.dari,
            periodTo: series.sampai,
            lastCheckedAt: sql`CURRENT_TIMESTAMP`,
            lastSyncedAt: sql`CURRENT_TIMESTAMP`,
            lastSyncStatus: "success",
            creditsEstimated: sql`credits_estimated + ${result.creditsUsedEstimate}`,
          },
        });

      result.seriesUpdated++;
      result.rowsInserted += seriesRowsInserted;
      result.details.push({
        tingkat,
        wilayah,
        action: "synced",
        rows: seriesRowsInserted,
      });
    } catch (err: unknown) {
      console.error(`[SyncEngine] Failed syncing ${tingkat}-${wilayah}:`, err);
      result.details.push({
        tingkat,
        wilayah,
        action: "failed",
        reason: (err as Error).message,
      });
    }
  }

  // 5. Tarik data anomali harga terbaru
  try {
    console.log("[SyncEngine] Syncing price anomalies...");
    const anomaliesRes = await apiIndonesiaClient.getPriceAnomalies({
      limit: 100,
    });
    result.creditsUsedEstimate += 2;

    if (anomaliesRes.data && Array.isArray(anomaliesRes.data)) {
      for (const anomali of anomaliesRes.data) {
        const commId = commodityMap.get(anomali.komoditas);
        if (!commId) continue;

        const severity = mapSeverity(anomali.status);

        await db
          .insert(commodityAnomalies)
          .values({
            commodityId: commId,
            periodMonth: anomali.tanggal,
            qipa: String(anomali.qipa),
            aipa: String(anomali.aipa),
            ifpa: String(anomali.ifpa),
            status: anomali.status,
            severity,
          })
          .onDuplicateKeyUpdate({
            set: {
              qipa: String(anomali.qipa),
              aipa: String(anomali.aipa),
              ifpa: String(anomali.ifpa),
              status: anomali.status,
              severity,
              updatedAt: sql`CURRENT_TIMESTAMP`,
            },
          });
      }
    }
  } catch (err) {
    console.warn("[SyncEngine] Failed syncing anomalies:", (err as Error).message);
  }

  // 6. Invalidate Redis cache setelah sinkronisasi selesai
  await redisDelByPattern("pantau:*");

  // 7. Picu webhook microservice AI Forecasting secara asinkron
  const mlServiceUrl = process.env.ML_SERVICE_URL || "http://localhost:8000";
  fetch(`${mlServiceUrl}/internal/forecast/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      trigger: "delta_sync_completed",
      monthsAhead: 6,
      timestamp: new Date().toISOString(),
    }),
  }).catch((err) => {
    // Non-blocking: jika service ML offline, proses sinkronisasi tetap sukses
    console.info("[SyncEngine] ML forecast service notice:", (err as Error).message);
  });

  return result;
}

/**
 * Menghitung persentase perubahan MoM (M-1) dan YoY (M-12)
 */
async function calculateMoMAndYoY(
  level: TingkatHarga,
  regionScope: WilayahHarga
): Promise<void> {
  try {
    // Jalankan kalkulasi update MoM & YoY menggunakan SQL window/subquery
    await db.execute(sql`
      UPDATE commodity_prices curr
      LEFT JOIN commodity_prices prev_mom
        ON curr.commodity_id = prev_mom.commodity_id
        AND curr.level = prev_mom.level
        AND curr.region_scope = prev_mom.region_scope
        AND (curr.province_code = prev_mom.province_code OR (curr.province_code IS NULL AND prev_mom.province_code IS NULL))
        AND prev_mom.period_month = DATE_FORMAT(DATE_SUB(STR_TO_DATE(CONCAT(curr.period_month, '-01'), '%Y-%m-%d'), INTERVAL 1 MONTH), '%Y-%m')
      LEFT JOIN commodity_prices prev_yoy
        ON curr.commodity_id = prev_yoy.commodity_id
        AND curr.level = prev_yoy.level
        AND curr.region_scope = prev_yoy.region_scope
        AND (curr.province_code = prev_yoy.province_code OR (curr.province_code IS NULL AND prev_yoy.province_code IS NULL))
        AND prev_yoy.period_month = DATE_FORMAT(DATE_SUB(STR_TO_DATE(CONCAT(curr.period_month, '-01'), '%Y-%m-%d'), INTERVAL 1 YEAR), '%Y-%m')
      SET
        curr.mom_change_pct = CASE
          WHEN curr.price IS NOT NULL AND prev_mom.price IS NOT NULL AND prev_mom.price > 0
          THEN ROUND(((curr.price - prev_mom.price) / prev_mom.price) * 100, 2)
          ELSE NULL
        END,
        curr.yoy_change_pct = CASE
          WHEN curr.price IS NOT NULL AND prev_yoy.price IS NOT NULL AND prev_yoy.price > 0
          THEN ROUND(((curr.price - prev_yoy.price) / prev_yoy.price) * 100, 2)
          ELSE NULL
        END
      WHERE curr.level = ${level} AND curr.region_scope = ${regionScope};
    `);
  } catch (err) {
    console.warn("[SyncEngine] MoM/YoY calculation warning:", (err as Error).message);
  }
}
