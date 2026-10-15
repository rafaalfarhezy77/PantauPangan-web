const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

const PROVINCES = [
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

const COMMODITIES = [
  {
    slug: "beras-medium",
    apiName: "Beras Medium",
    displayName: "Beras Medium",
    category: "pokok",
    unit: "per kg",
    icon: "🌾",
    baseKonsumen: 14650,
    baseProdusen: 11400,
    anomaly: { status: "Normal", severity: "normal", qipa: 1.25, aipa: 0.85, ifpa: 1.1 },
  },
  {
    slug: "beras-premium",
    apiName: "Beras Premium",
    displayName: "Beras Premium",
    category: "pokok",
    unit: "per kg",
    icon: "🌾",
    baseKonsumen: 16400,
    baseProdusen: 12900,
    anomaly: { status: "Normal", severity: "normal", qipa: 1.8, aipa: 1.1, ifpa: 1.5 },
  },
  {
    slug: "cabai-merah-keriting",
    apiName: "Cabai Merah Keriting",
    displayName: "Cabai Merah Keriting",
    category: "bumbu",
    unit: "per kg",
    icon: "🌶️",
    baseKonsumen: 54500,
    baseProdusen: 38200,
    anomaly: { status: "Alert (High Price)", severity: "alert_high", qipa: 14.2, aipa: 9.8, ifpa: 15.6 },
  },
  {
    slug: "cabai-rawit-merah",
    apiName: "Cabai Rawit Merah",
    displayName: "Cabai Rawit Merah",
    category: "bumbu",
    unit: "per kg",
    icon: "🌶️",
    baseKonsumen: 69800,
    baseProdusen: 48500,
    anomaly: { status: "Alert (High Price)", severity: "alert_high", qipa: 16.5, aipa: 11.2, ifpa: 17.8 },
  },
  {
    slug: "bawang-merah",
    apiName: "Bawang Merah",
    displayName: "Bawang Merah",
    category: "bumbu",
    unit: "per kg",
    icon: "🧅",
    baseKonsumen: 38200,
    baseProdusen: 25400,
    anomaly: { status: "Warning (Waspada)", severity: "warning", qipa: 7.2, aipa: 5.4, ifpa: 7.9 },
  },
  {
    slug: "bawang-putih-bonggol",
    apiName: "Bawang Putih Bonggol",
    displayName: "Bawang Putih Bonggol",
    category: "bumbu",
    unit: "per kg",
    icon: "🧄",
    baseKonsumen: 41800,
    baseProdusen: 31500,
    anomaly: { status: "Normal", severity: "normal", qipa: 2.1, aipa: 1.4, ifpa: 2.0 },
  },
  {
    slug: "daging-sapi-murni",
    apiName: "Daging Sapi Murni",
    displayName: "Daging Sapi Murni",
    category: "protein",
    unit: "per kg",
    icon: "🥩",
    baseKonsumen: 136500,
    baseProdusen: 104000,
    anomaly: { status: "Normal", severity: "normal", qipa: 0.9, aipa: 0.4, ifpa: 0.8 },
  },
  {
    slug: "daging-ayam-ras",
    apiName: "Daging Ayam Ras",
    displayName: "Daging Ayam Ras",
    category: "protein",
    unit: "per kg",
    icon: "🍗",
    baseKonsumen: 37900,
    baseProdusen: 23800,
    anomaly: { status: "Warning (Waspada)", severity: "warning", qipa: 6.8, aipa: 4.9, ifpa: 6.5 },
  },
  {
    slug: "telur-ayam-ras",
    apiName: "Telur Ayam Ras",
    displayName: "Telur Ayam Ras",
    category: "protein",
    unit: "per kg",
    icon: "🥚",
    baseKonsumen: 29800,
    baseProdusen: 22600,
    anomaly: { status: "Normal", severity: "normal", qipa: 2.4, aipa: 1.7, ifpa: 2.2 },
  },
  {
    slug: "gula-pasir",
    apiName: "Gula Pasir",
    displayName: "Gula Pasir",
    category: "minyak_gula",
    unit: "per kg",
    icon: "🍬",
    baseKonsumen: 18100,
    baseProdusen: 14700,
    anomaly: { status: "Normal", severity: "normal", qipa: 1.5, aipa: 0.9, ifpa: 1.3 },
  },
  {
    slug: "minyak-goreng-curah",
    apiName: "Minyak Goreng Curah",
    displayName: "Minyak Goreng Curah",
    category: "minyak_gula",
    unit: "per liter",
    icon: "🫗",
    baseKonsumen: 16900,
    baseProdusen: 13600,
    anomaly: { status: "Warning (Waspada)", severity: "warning", qipa: 6.1, aipa: 4.2, ifpa: 5.9 },
  },
  {
    slug: "minyakita",
    apiName: "Minyakita",
    displayName: "Minyakita",
    category: "minyak_gula",
    unit: "per liter",
    icon: "🫗",
    baseKonsumen: 15800,
    baseProdusen: 13200,
    anomaly: { status: "Warning (Waspada)", severity: "warning", qipa: 5.8, aipa: 3.9, ifpa: 5.5 },
  },
  {
    slug: "tepung-terigu",
    apiName: "Tepung Terigu",
    displayName: "Tepung Terigu",
    category: "pokok",
    unit: "per kg",
    icon: "🌾",
    baseKonsumen: 13100,
    baseProdusen: 10600,
    anomaly: { status: "Normal", severity: "normal", qipa: 1.1, aipa: 0.5, ifpa: 0.9 },
  },
  {
    slug: "jagung-pipilan-kering",
    apiName: "Jagung Pipilan Kering",
    displayName: "Jagung Pipilan Kering",
    category: "pokok",
    unit: "per kg",
    icon: "🌽",
    baseKonsumen: 8900,
    baseProdusen: 5900,
    anomaly: { status: "Normal", severity: "normal", qipa: 2.0, aipa: 1.2, ifpa: 1.8 },
  },
];

const MONTHS = [
  "2024-01", "2024-02", "2024-03", "2024-04", "2024-05", "2024-06",
  "2024-07", "2024-08", "2024-09", "2024-10", "2024-11", "2024-12",
  "2025-01", "2025-02", "2025-03", "2025-04", "2025-05", "2025-06",
  "2025-07", "2025-08", "2025-09", "2025-10", "2025-11", "2025-12",
  "2026-01", "2026-02", "2026-03"
];

async function seed() {
  const dbUrl = process.env.DATABASE_URL || "mysql://root:@localhost:3306/pantau_pangan_v2";
  const conn = await mysql.createConnection(dbUrl);
  console.log("Connected to MySQL for seeding...");

  await conn.query("SET FOREIGN_KEY_CHECKS = 0;");

  // 1. Seed Provinces
  console.log("Seeding 38 provinces...");
  for (const p of PROVINCES) {
    await conn.query(
      `INSERT INTO provinces (code, name, alt_name, lat, lng)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), alt_name = VALUES(alt_name), lat = VALUES(lat), lng = VALUES(lng)`,
      [p.code, p.name, p.altName, p.lat, p.lng]
    );
  }

  // 2. Seed Commodities
  console.log("Seeding commodities...");
  const commIdMap = new Map();
  for (const c of COMMODITIES) {
    const [res] = await conn.query(
      `INSERT INTO commodities (slug, api_name, display_name, category, unit, icon, has_consumer_national, has_consumer_prov, has_producer_national, has_producer_prov, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 1, 1, 1, 1, 1)
       ON DUPLICATE KEY UPDATE display_name = VALUES(display_name), category = VALUES(category), icon = VALUES(icon)`,
      [c.slug, c.apiName, c.displayName, c.category, c.unit, c.icon]
    );
    
    // Get inserted or existing ID
    const [rows] = await conn.query(`SELECT id FROM commodities WHERE slug = ?`, [c.slug]);
    const cid = rows[0]?.id;
    commIdMap.set(c.slug, cid);

    // 3. Seed Anomaly
    await conn.query(
      `INSERT INTO commodity_anomalies (commodity_id, period_month, qipa, aipa, ifpa, status, severity)
       VALUES (?, '2026-03', ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE qipa = VALUES(qipa), aipa = VALUES(aipa), ifpa = VALUES(ifpa), status = VALUES(status), severity = VALUES(severity)`,
      [cid, c.anomaly.qipa, c.anomaly.aipa, c.anomaly.ifpa, c.anomaly.status, c.anomaly.severity]
    );
  }

  // 4. Seed Historical Prices
  console.log("Seeding national & provincial monthly price series...");
  for (const c of COMMODITIES) {
    const cid = commIdMap.get(c.slug);
    let prevKonsumen = null;
    let prevProdusen = null;

    for (let i = 0; i < MONTHS.length; i++) {
      const m = MONTHS[i];
      // Deterministic seasonality factor
      const seasonal = 1.0 + Math.sin(i * 0.45) * 0.05 + (i * 0.002);
      const priceK = Math.round(c.baseKonsumen * seasonal);
      const priceP = Math.round(c.baseProdusen * seasonal);

      const momK = prevKonsumen ? Number((((priceK - prevKonsumen) / prevKonsumen) * 100).toFixed(2)) : 0.0;
      const momP = prevProdusen ? Number((((priceP - prevProdusen) / prevProdusen) * 100).toFixed(2)) : 0.0;

      prevKonsumen = priceK;
      prevProdusen = priceP;

      // National Konsumen
      await conn.query(
        `INSERT INTO commodity_prices (commodity_id, level, region_scope, province_code, period_month, price, price_raw, mom_change_pct)
         VALUES (?, 'konsumen', 'nasional', NULL, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE price = VALUES(price), mom_change_pct = VALUES(mom_change_pct)`,
        [cid, m, priceK, String(priceK), momK]
      );

      // National Produsen
      await conn.query(
        `INSERT INTO commodity_prices (commodity_id, level, region_scope, province_code, period_month, price, price_raw, mom_change_pct)
         VALUES (?, 'produsen', 'nasional', NULL, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE price = VALUES(price), mom_change_pct = VALUES(mom_change_pct)`,
        [cid, m, priceP, String(priceP), momP]
      );
    }

    // Latest month provincial prices (for choropleth map & table)
    const latestMonth = "2026-03";
    for (let pIdx = 0; pIdx < PROVINCES.length; pIdx++) {
      const p = PROVINCES[pIdx];
      // Regional disparity variance: Eastern Indonesia higher, Java baseline
      let varianceFactor = 1.0;
      const codeNum = parseInt(p.code, 10);
      if (codeNum >= 31 && codeNum <= 36) {
        varianceFactor = 0.96 + (pIdx % 5) * 0.02; // Java
      } else if (codeNum >= 81) {
        varianceFactor = 1.15 + (pIdx % 4) * 0.03; // Maluku & Papua
      } else if (codeNum >= 61 && codeNum <= 76) {
        varianceFactor = 1.05 + (pIdx % 3) * 0.02; // Kalimantan & Sulawesi
      } else {
        varianceFactor = 1.02 + (pIdx % 4) * 0.015; // Sumatra & Bali/Nusa Tenggara
      }

      const provPriceK = Math.round(c.baseKonsumen * varianceFactor);
      const provPriceP = Math.round(c.baseProdusen * varianceFactor);
      const provMomK = Number(((varianceFactor - 1.0) * 10).toFixed(2));

      await conn.query(
        `INSERT INTO commodity_prices (commodity_id, level, region_scope, province_code, period_month, price, price_raw, mom_change_pct)
         VALUES (?, 'konsumen', 'provinsi', ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE price = VALUES(price), mom_change_pct = VALUES(mom_change_pct)`,
        [cid, p.code, latestMonth, provPriceK, String(provPriceK), provMomK]
      );

      await conn.query(
        `INSERT INTO commodity_prices (commodity_id, level, region_scope, province_code, period_month, price, price_raw, mom_change_pct)
         VALUES (?, 'produsen', 'provinsi', ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE price = VALUES(price), mom_change_pct = VALUES(mom_change_pct)`,
        [cid, p.code, latestMonth, provPriceP, String(provPriceP), provMomK]
      );
    }
  }

  // 5. Seed API Sync Metadata
  console.log("Seeding api_sync_metadata...");
  const syncScopes = [
    { level: "konsumen", regionScope: "nasional", count: 46, rows: 1240, from: "2021-01", to: "2026-03" },
    { level: "konsumen", regionScope: "provinsi", count: 46, rows: 45200, from: "2021-01", to: "2026-03" },
    { level: "produsen", regionScope: "nasional", count: 28, rows: 960, from: "2021-01", to: "2026-03" },
    { level: "produsen", regionScope: "provinsi", count: 28, rows: 26800, from: "2021-01", to: "2026-03" },
  ];

  for (const s of syncScopes) {
    await conn.query(
      `INSERT INTO api_sync_metadata (level, region_scope, commodity_count, row_count, period_from, period_to, last_checked_at, last_synced_at, last_sync_status, credits_estimated)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), 'success', 2)
       ON DUPLICATE KEY UPDATE commodity_count = VALUES(commodity_count), row_count = VALUES(row_count), period_from = VALUES(period_from), period_to = VALUES(period_to), last_synced_at = NOW()`,
      [s.level, s.regionScope, s.count, s.rows, s.from, s.to]
    );
  }

  // 6. Seed Users
  console.log("Seeding demo users (admin, petani, pedagang, pembeli)...");
  const users = [
    { id: "usr-admin-01", name: "Administrator PantauPangan", username: "admin", email: "admin@pantaupangan.id", role: "admin", pass: "admin123", prov: "31" },
    { id: "usr-petani-01", name: "Pak Slamet (Petani Hortikultura)", username: "petani", email: "slamet@tani.id", role: "petani", pass: "petani123", prov: "33" },
    { id: "usr-pedagang-01", name: "Haji Rusli (Grosir Sembako)", username: "pedagang", email: "rusli@pasar.id", role: "pedagang", pass: "pedagang123", prov: "32" },
    { id: "usr-pembeli-01", name: "Ibu Rahma (Konsumen Rumah Tangga)", username: "pembeli", email: "rahma@keluarga.id", role: "pembeli", pass: "pembeli123", prov: "31" },
  ];

  for (const u of users) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(u.pass, salt);

    await conn.query(
      `INSERT INTO users (id, name, username, email, password_hash, role, default_province_code)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), role = VALUES(role), password_hash = VALUES(password_hash), default_province_code = VALUES(default_province_code)`,
      [u.id, u.name, u.username, u.email, hash, u.role, u.prov]
    );
  }

  // 7. Seed Articles (Berita Analisis Pangan & Inflasi Daerah)
  console.log("Seeding articles...");
  const articles = [
    {
      slug: "prediksi-inflasi-cabai-jelang-hbkn-2026",
      title: "Peringatan Dini Inflasi Hortikultura: Indeks IFPA Cabai Merah Naik di Jawa & Sumatera",
      category: "Prediksi Inflasi",
      sourceName: "Tim Analisis PantauPangan",
      content: "Berdasarkan pemantauan anomali harga Bapanas melalui API Indonesia, disparitas harga cabai merah keriting tingkat konsumen di 12 provinsi telah melampaui batas toleransi normal (IFPA > 14.0). Sinyal ini memprediksi tekanan inflasi pangan lokal sebelum panen raya berikutnya.",
      commoditySlug: "cabai-merah-keriting"
    },
    {
      slug: "stabilitas-pasokan-beras-nasional-2026",
      title: "Transmisi Harga Beras Medium: Selisih Margin Produsen dan Konsumen Menunjukkan Stabilitas",
      category: "Stabilitas Pasar",
      sourceName: "Buletin Pangan Bapanas",
      content: "Harga beras medium di tingkat produsen (penggilingan) stabil di kisaran Rp 11.400/kg dengan harga eceran tertinggi konsumen Rp 14.650/kg di pulau Jawa. Indikator QIPA berada pada level aman 1.25.",
      commoditySlug: "beras-medium"
    }
  ];

  for (const a of articles) {
    const cid = commIdMap.get(a.commoditySlug) || null;
    await conn.query(
      `INSERT INTO articles (slug, title, category, source_name, content, commodity_id)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE title = VALUES(title), content = VALUES(content)`,
      [a.slug, a.title, a.category, a.sourceName, a.content, cid]
    );
  }

  await conn.query("SET FOREIGN_KEY_CHECKS = 1;");
  console.log("Seeding completed successfully!");
  await conn.end();
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
