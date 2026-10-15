import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { db, poolConnection } from "@/lib/db";
import {
  users,
  commodities,
  userWatchlists,
  notifications,
  articles,
  provinces,
} from "@/lib/db/schema";
import { PROVINCES_SEED_DATA } from "@/lib/api-indonesia/sync-engine";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { eq, or, sql } from "drizzle-orm";

interface UatUserConfig {
  id: string;
  name: string;
  username: string;
  email: string;
  role: "admin" | "petani" | "pedagang" | "pembeli";
  provCode: string;
}

const UAT_USERS: UatUserConfig[] = [
  {
    id: "usr-admin-01",
    name: "Super Administrator",
    username: "admin",
    email: "admin@pantaupangan.id",
    role: "admin",
    provCode: "31", // DKI Jakarta
  },
  {
    id: "usr-petani-01",
    name: "Pak Slamet (Petani Cabai)",
    username: "petani_jatim",
    email: "petani.jatim@pantaupangan.id",
    role: "petani",
    provCode: "35", // Jawa Timur
  },
  {
    id: "usr-pedagang-01",
    name: "Haji Rusli (Grosir Sembako)",
    username: "pedagang_jabar",
    email: "pedagang.jabar@pantaupangan.id",
    role: "pedagang",
    provCode: "32", // Jawa Barat
  },
  {
    id: "usr-pembeli-01",
    name: "Ibu Rahma (Ibu Rumah Tangga)",
    username: "pembeli_jateng",
    email: "pembeli.jateng@pantaupangan.id",
    role: "pembeli",
    provCode: "33", // Jawa Tengah
  },
];

const INITIAL_COMMODITY_DEFINITIONS = [
  { slug: "beras-premium", name: "Beras Premium", cat: "pokok" as const, icon: "🌾" },
  { slug: "beras-medium", name: "Beras Medium", cat: "pokok" as const, icon: "🌾" },
  { slug: "cabai-rawit-merah", name: "Cabai Rawit Merah", cat: "bumbu" as const, icon: "🌶️" },
  { slug: "cabai-merah-keriting", name: "Cabai Merah Keriting", cat: "bumbu" as const, icon: "🌶️" },
  { slug: "bawang-merah", name: "Bawang Merah", cat: "bumbu" as const, icon: "🧅" },
  { slug: "minyak-goreng", name: "Minyak Goreng Curah", cat: "minyak_gula" as const, icon: "🫗" },
  { slug: "telur-ayam-ras", name: "Telur Ayam Ras", cat: "protein" as const, icon: "🥚" },
];

async function main() {
  console.log("=================================================================");
  console.log(" 👥 PantauPangan v2.0 - Role-Based UAT Accounts & Content Seeder");
  console.log("=================================================================");

  const rawPassword = process.env.SEED_DEFAULT_PASSWORD || "PantauPangan2026!";
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(rawPassword, salt);

  try {
    // -------------------------------------------------------------
    // 1. Pastikan Provinsi Terpenuhi Minimal Untuk Akun UAT
    // -------------------------------------------------------------
    console.log("🏛️ [1/4] Memastikan ketersediaan master provinsi...");
    for (const p of PROVINCES_SEED_DATA) {
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
          },
        });
    }

    // -------------------------------------------------------------
    // 2. Seeding Komoditas Dasar untuk Relasi Foreign Key
    // -------------------------------------------------------------
    console.log("📦 [2/4] Memastikan ketersediaan komoditas inti...");
    const commMap = new Map<string, number>();

    for (const c of INITIAL_COMMODITY_DEFINITIONS) {
      await db
        .insert(commodities)
        .values({
          slug: c.slug,
          apiName: c.name,
          displayName: c.name,
          category: c.cat,
          unit: "per kg",
          icon: c.icon,
          hasConsumerNational: true,
          hasConsumerProv: true,
          hasProducerNational: true,
          hasProducerProv: true,
          isActive: true,
        })
        .onDuplicateKeyUpdate({
          set: {
            displayName: c.name,
            icon: c.icon,
          },
        });

      const [found] = await db
        .select({ id: commodities.id, slug: commodities.slug })
        .from(commodities)
        .where(eq(commodities.slug, c.slug))
        .limit(1);

      if (found) {
        commMap.set(c.slug, found.id);
      }
    }

    // -------------------------------------------------------------
    // 3. Seeding Akun Pengguna UAT (admin, petani, pedagang, pembeli)
    // -------------------------------------------------------------
    console.log("👤 [3/4] Menyiapkan 4 Akun UAT multi-peran...");
    for (const u of UAT_USERS) {
      // Cek apakah user sudah ada berdasarkan id, email, atau username
      const existing = await db
        .select()
        .from(users)
        .where(
          or(
            eq(users.id, u.id),
            eq(users.email, u.email),
            eq(users.username, u.username)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(users)
          .set({
            name: u.name,
            username: u.username,
            email: u.email,
            role: u.role,
            passwordHash,
            defaultProvinceCode: u.provCode,
            updatedAt: sql`CURRENT_TIMESTAMP`,
          })
          .where(eq(users.id, existing[0].id));
        console.log(`   diperbarui: ${u.email} [${u.role}] (ID: ${existing[0].id})`);
      } else {
        await db.insert(users).values({
          id: u.id,
          name: u.name,
          username: u.username,
          email: u.email,
          passwordHash,
          role: u.role,
          defaultProvinceCode: u.provCode,
        });
        console.log(`   dibuat: ${u.email} [${u.role}] (ID: ${u.id})`);
      }
    }

    // Ambil ID user yang sebenarnya setelah insert/update
    const userRecords = await db.select().from(users);
    const userIdMap = new Map<string, string>();
    for (const ur of userRecords) {
      userIdMap.set(ur.email, ur.id);
      userIdMap.set(ur.username, ur.id);
      userIdMap.set(ur.id, ur.id);
    }

    const petaniId = userIdMap.get("petani.jatim@pantaupangan.id") || userIdMap.get("usr-petani-01");
    const pedagangId = userIdMap.get("pedagang.jabar@pantaupangan.id") || userIdMap.get("usr-pedagang-01");
    const pembeliId = userIdMap.get("pembeli.jateng@pantaupangan.id") || userIdMap.get("usr-pembeli-01");

    // Bersihkan watchlist & notifikasi lama untuk akun UAT agar idempotent
    const targetUserIds = [petaniId, pedagangId, pembeliId].filter(Boolean) as string[];
    for (const uid of targetUserIds) {
      await db.delete(userWatchlists).where(eq(userWatchlists.userId, uid));
      await db.delete(notifications).where(eq(notifications.userId, uid));
    }

    // -------------------------------------------------------------
    // 4. Seeding Watchlists & Notifikasi untuk Peran Non-Admin
    // -------------------------------------------------------------
    console.log("⭐ Menyiapkan data pantauan (Watchlist) & Notifikasi pengguna...");

    // 4a. Watchlists Petani
    if (petaniId) {
      const cabaiId = commMap.get("cabai-rawit-merah");
      const berasId = commMap.get("beras-premium");

      if (cabaiId) {
        await db.insert(userWatchlists).values({
          id: crypto.randomUUID(),
          userId: petaniId,
          commodityId: cabaiId,
          level: "produsen",
          provinceCode: "35",
          targetMinPrice: 40000,
          targetMaxPrice: 55000,
          alertOnAnomaly: true,
        });
      }
      if (berasId) {
        await db.insert(userWatchlists).values({
          id: crypto.randomUUID(),
          userId: petaniId,
          commodityId: berasId,
          level: "produsen",
          provinceCode: "35",
          targetMinPrice: 11000,
          targetMaxPrice: 13500,
          alertOnAnomaly: true,
        });
      }

      await db.insert(notifications).values([
        {
          id: crypto.randomUUID(),
          userId: petaniId,
          type: "anomaly_alert",
          title: "Peringatan Anomali Harga Cabai Rawit Merah",
          message: "Indeks IFPA Cabai Rawit Merah di Jawa Timur melonjak tajam (IFPA 17.8), status Waspada Disparitas Pasar.",
          linkUrl: "/komoditas/cabai-rawit-merah",
          isRead: false,
        },
        {
          id: crypto.randomUUID(),
          userId: petaniId,
          type: "sync_update",
          title: "Sinkronisasi Harga Pangan Produsen Selesai",
          message: "Data deret waktu harga gabah dan komoditas produsen telah diperbarui ke periode terbaru.",
          linkUrl: "/dashboard",
          isRead: true,
        },
      ]);
    }

    // 4b. Watchlists Pedagang
    if (pedagangId) {
      const cabaiKeritingId = commMap.get("cabai-merah-keriting");
      const bawangId = commMap.get("bawang-merah");
      const berasMediumId = commMap.get("beras-medium");

      if (cabaiKeritingId) {
        await db.insert(userWatchlists).values({
          id: crypto.randomUUID(),
          userId: pedagangId,
          commodityId: cabaiKeritingId,
          level: "konsumen",
          provinceCode: "32",
          targetMinPrice: 45000,
          targetMaxPrice: 60000,
          alertOnAnomaly: true,
        });
      }
      if (bawangId) {
        await db.insert(userWatchlists).values({
          id: crypto.randomUUID(),
          userId: pedagangId,
          commodityId: bawangId,
          level: "konsumen",
          provinceCode: "32",
          targetMinPrice: 30000,
          targetMaxPrice: 42000,
          alertOnAnomaly: true,
        });
      }
      if (berasMediumId) {
        await db.insert(userWatchlists).values({
          id: crypto.randomUUID(),
          userId: pedagangId,
          commodityId: berasMediumId,
          level: "konsumen",
          provinceCode: "32",
          targetMinPrice: 13000,
          targetMaxPrice: 15500,
          alertOnAnomaly: false,
        });
      }

      await db.insert(notifications).values([
        {
          id: crypto.randomUUID(),
          userId: pedagangId,
          type: "price_threshold",
          title: "Peringatan Ambang Batas: Bawang Merah",
          message: "Harga Bawang Merah di Jawa Barat mencapai Rp 38.200/kg mendekati batas target maksimal Anda.",
          linkUrl: "/komoditas/bawang-merah",
          isRead: false,
        },
        {
          id: crypto.randomUUID(),
          userId: pedagangId,
          type: "anomaly_alert",
          title: "Disparitas Regional Cabai Merah Keriting",
          message: "Spread produsen-konsumen melebar hingga 42% antara Jawa Timur dan Jawa Barat.",
          linkUrl: "/komoditas/cabai-merah-keriting",
          isRead: false,
        },
      ]);
    }

    // 4c. Watchlists Pembeli
    if (pembeliId) {
      const berasMediumId = commMap.get("beras-medium");
      const minyakId = commMap.get("minyak-goreng");
      const telurId = commMap.get("telur-ayam-ras");

      if (berasMediumId) {
        await db.insert(userWatchlists).values({
          id: crypto.randomUUID(),
          userId: pembeliId,
          commodityId: berasMediumId,
          level: "konsumen",
          provinceCode: "33",
          targetMinPrice: 12500,
          targetMaxPrice: 14500,
          alertOnAnomaly: true,
        });
      }
      if (minyakId) {
        await db.insert(userWatchlists).values({
          id: crypto.randomUUID(),
          userId: pembeliId,
          commodityId: minyakId,
          level: "konsumen",
          provinceCode: "33",
          targetMinPrice: 15000,
          targetMaxPrice: 18000,
          alertOnAnomaly: true,
        });
      }
      if (telurId) {
        await db.insert(userWatchlists).values({
          id: crypto.randomUUID(),
          userId: pembeliId,
          commodityId: telurId,
          level: "konsumen",
          provinceCode: "33",
          targetMinPrice: 26000,
          targetMaxPrice: 31000,
          alertOnAnomaly: true,
        });
      }

      await db.insert(notifications).values([
        {
          id: crypto.randomUUID(),
          userId: pembeliId,
          type: "sync_update",
          title: "Pembaruan Harga Pangan Nasional",
          message: "Harga rata-rata beras dan minyak goreng nasional bulan ini telah disinkronkan.",
          linkUrl: "/",
          isRead: false,
        },
      ]);
    }

    // -------------------------------------------------------------
    // 5. Seeding 5 Artikel Berita Analisis Pangan Awal
    // -------------------------------------------------------------
    console.log("📰 [4/4] Menyiapkan 5 Artikel Berita Analisis & Ketahanan Pangan...");

    const initialArticles = [
      {
        slug: "stabilitas-pasokan-dan-harga-beras-premium-nasional",
        title: "Stabilitas Pasokan dan Transmisi Harga Beras Premium Nasional",
        category: "Stabilitas Pasar",
        sourceName: "Badan Pangan Nasional (Bapanas)",
        content: "Berdasarkan data sinkronisasi API Indonesia, harga beras premium di tingkat konsumen relatif terkendali dengan rata-rata nasional berada pada batas HET. Transmisi harga dari penggilingan ke pasar induk menunjukkan efisiensi rantai distribusi pasok yang semakin solid pada kuartal berjalan.",
        commSlug: "beras-premium",
      },
      {
        slug: "mitigasi-tekanan-inflasi-cabai-rawit-merah-hbkn",
        title: "Mitigasi Tekanan Inflasi Cabai Rawit Merah Menjelang Hari Besar Keagamaan",
        category: "Prediksi Inflasi",
        sourceName: "Tim Riset PantauPangan",
        content: "Fluktuasi cuaca ekstrem di sentra hortikultura Jawa Timur dan Jawa Tengah memicu lonjakan indeks IFPA (Index Food Price Anomaly) cabai rawit merah. Pemerintah daerah bersama stakeholder menyiapkan program subsidi ongkos angkut antar-daerah surplus dan defisit guna menstabilkan harga eceran.",
        commSlug: "cabai-rawit-merah",
      },
      {
        slug: "evaluasi-fluktuasi-harga-bawang-merah-sentra-brebes-nganjuk",
        title: "Evaluasi Fluktuasi Harga Bawang Merah di Sentra Produksi Brebes & Nganjuk",
        category: "Sentra Produksi",
        sourceName: "Dinas Pertanian & Ketahanan Pangan",
        content: "Panen parsial di sentra bawang merah Brebes mulai mengisi stok pasar Johar dan Pasar Kramat Jati. Spread harga produsen-konsumen diperkirakan menyempit seiring dengan pemanfaatan teknologi Controlled Atmosphere Storage (CAS) di gudang logistik sentra produksi.",
        commSlug: "bawang-merah",
      },
      {
        slug: "distribusi-minyak-goreng-dan-minyakita-pasar-tradisional",
        title: "Distribusi Minyak Goreng Curah dan MinyaKita: Ketersediaan di Pasar Tradisional",
        category: "Kebijakan Distribusi",
        sourceName: "Kementerian Perdagangan RI",
        content: "Pemantauan berkala ketersediaan MinyaKita dan minyak goreng kemasan sederhana memastikan kepatuhan terhadap HET nasional sebesar Rp 15.700 per liter. Pengawasan rantai pasok Domestic Market Obligation (DMO) terus diperketat agar pasokan di pedagang eceran tetap terjamin.",
        commSlug: "minyak-goreng",
      },
      {
        slug: "analisis-biaya-pakan-jagung-transmisi-harga-telur-ayam-ras",
        title: "Analisis Biaya Pakan Jagung dan Transmisi ke Harga Telur Ayam Ras",
        category: "Analisis Biaya",
        sourceName: "Asosiasi Peternak Unggas Nusantara",
        content: "Pergerakan harga jagung pakan ternak di tingkat produsen berkorelasi langsung dengan biaya pokok produksi telur ayam ras di Blitar dan Sukabumi. Indeks harga konsumen terpantau stabil pada kisaran toleransi wajar berkat kelancaran panen jagung lokal.",
        commSlug: "telur-ayam-ras",
      },
    ];

    for (const a of initialArticles) {
      const cid = commMap.get(a.commSlug) || null;
      await db
        .insert(articles)
        .values({
          slug: a.slug,
          title: a.title,
          category: a.category,
          sourceName: a.sourceName,
          content: a.content,
          commodityId: cid,
          publishedAt: new Date(),
        })
        .onDuplicateKeyUpdate({
          set: {
            title: a.title,
            category: a.category,
            sourceName: a.sourceName,
            content: a.content,
            commodityId: cid,
          },
        });
    }

    console.log("\n=================================================================");
    console.log(" ✨ SEEDING AKUN UAT & KONTEN AWAL BERHASIL!");
    console.log("=================================================================");
    console.log(" Kredensial Akun Pengujian UAT:");
    console.log(" ---------------------------------------------------------------");
    console.log(" 1. ADMIN     : admin@pantaupangan.id        | Sandi: " + rawPassword);
    console.log(" 2. PETANI    : petani.jatim@pantaupangan.id | Sandi: " + rawPassword);
    console.log(" 3. PEDAGANG  : pedagang.jabar@pantaupangan.id | Sandi: " + rawPassword);
    console.log(" 4. PEMBELI   : pembeli.jateng@pantaupangan.id | Sandi: " + rawPassword);
    console.log("=================================================================\n");
  } catch (err) {
    console.error("❌ Terjadi kesalahan selama seeding user:", err);
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
