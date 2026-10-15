# 🌾 PantauPangan v2.0
> **Platform Intelijen Harga Komoditas Pangan & Deteksi Dini Inflasi Daerah**  
> Mengintegrasikan data resmi Badan Pangan Nasional (Bapanas) melalui **API Indonesia** dengan arsitektur modern Next.js 15, Drizzle ORM, Upstash Redis, dan Microservice AI Forecasting bulanan.

---

## 📋 Daftar Isi
1. [Ringkasan Arsitektur & Tech Stack](#-ringkasan-arsitektur--tech-stack)
2. [Matriks Peran Pengguna & Kredensial UAT](#-matriks-peran-pengguna--kredensial-uat)
3. [Integrasi API Indonesia & Smart Delta Sync](#-integrasi-api-indonesia--smart-delta-sync)
4. [Instalasi Lokal & Variabel Lingkungan](#-instalasi-lokal--variabel-lingkungan)
5. [Skrip Otomasi & Perintah CLI](#-skrip-otomasi--perintah-cli)
6. [Peta Roadmap Sprint 0 – Sprint 10](#-peta-roadmap-sprint-0--sprint-10)
7. [Keamanan & Standar Kepatuhan](#-keamanan--standar-kepatuhan)

---

## 🏗️ Ringkasan Arsitektur & Tech Stack

PantauPangan v2.0 dibangun dari awal untuk menggantikan sistem legacy PHP prosedural dengan arsitektur *cloud-native* berkinerja tinggi:

- **Framework Web**: [Next.js 15](https://nextjs.org/) (App Router, React 19, TypeScript 5, Server Components & Route Handlers).
- **Styling & UI**: Tailwind CSS v4, [shadcn/ui](https://ui.shadcn.com/), Lucide Icons, dan Sonner Toast (*AgriModern Design System*).
- **Database & ORM**: TiDB Serverless / MySQL 8.0 dengan [Drizzle ORM](https://orm.drizzle.team/) (`drizzle-kit`).
- **Caching & Rate Limiting**: [Upstash Redis](https://upstash.com/) (`@upstash/redis`, `@upstash/ratelimit`).
- **Autentikasi & RBAC**: Sesi terenkripsi berbasis HttpOnly Cookie dengan Middleware Role-Based Access Control (`admin`, `petani`, `pedagang`, `pembeli`).
- **Visualisasi Data**: [Recharts](https://recharts.org/) (Grafik deret waktu & disparitas) + [Leaflet](https://leafletjs.com/) (Peta Koroplet Interaktif 38 Provinsi).
- **Microservice AI Forecasting**: Python [FastAPI](https://fastapi.tiangolo.com/) + Prophet / StatsForecast untuk prediksi deret waktu harga 3–6 bulan ke depan.
- **PWA Mobile**: Progressive Web App manifest (`src/app/manifest.ts`) untuk akses cepat di perangkat mobile petani & pedagang pasar tradisional.

---

## 👥 Matriks Peran Pengguna & Kredensial UAT

Sistem menerapkan hak akses berbasis peran (RBAC) pada level server middleware dan route handlers:

| Peran (Role) | Ruang Lingkup & Kemampuan Utama | Akun Pengujian UAT | Kata Sandi Standar |
| :--- | :--- | :--- | :--- |
| **Admin** | Control Center Sync API Indonesia, manajemen pengguna (anti-lockout), publikasi artikel, dan monitoring audit log. | `admin@pantaupangan.id` | `PantauPangan2026!` |
| **Petani** | Default ke tingkat **Produsen** daerah asal (Jawa Timur), pemantauan anjlok harga panen raya, dan kalkulasi spread penggilingan-eceran. | `petani.jatim@pantaupangan.id` | `PantauPangan2026!` |
| **Pedagang** | Radar disparitas antar-provinsi (peluang arbitrase pasokan), pantauan margin kotor, dan peringatan batas harga grosir. | `pedagang.jabar@pantaupangan.id` | `PantauPangan2026!` |
| **Pembeli** | Default ke tingkat **Konsumen** (eceran), keranjang pantauan sembako (Watchlist), riwayat pencarian permanen DB, dan deteksi anomali. | `pembeli.jateng@pantaupangan.id` | `PantauPangan2026!` |

> 💡 *Akun di atas dapat diinisialisasi kapan saja menggunakan perintah `npm run db:seed:users`.*

---

## 🌐 Integrasi API Indonesia & Smart Delta Sync

Seluruh data harga dan anomali pangan bersumber resmi dari **API Indonesia (`https://use.apiindonesia.id`)**:

1. **Hemat Kredit API**: Setiap panggilan endpoint berbiaya **2 kredit** (dengan rate limit 20 req/s). Seeder dan engine sinkronisasi dilengkapi `CreditTracker` guard untuk mencegah habisnya kuota.
2. **Smart Delta Sync**: Memeriksa metadata `period_to` dan `row_count` sebelum menarik dataset harga. Jika dataset belum diperbarui di hulu, sinkronisasi dilewati (**0 kredit terpakai**).
3. **Anti-Math.random**: Dilarang keras menggunakan data acak, derau buatan, maupun konstanta multiplier statis. Seluruh angka harga, metrik MoM/YoY, dan anomali berasal murni dari kalkulasi data historis Bapanas.
4. **Keamanan Kunci**: Kunci `API_INDONESIA_KEY` disimpan secara ketat di server environment dan **tidak pernah diekspos ke client/browser**.

---

## ⚙️ Instalasi Lokal & Variabel Lingkungan

### 1. Kloning Repositori
```bash
git clone https://github.com/<organisasi>/sistem-informasi-harga-komoditas.git
cd sistem-informasi-harga-komoditas
git checkout pantaupangan-v02-dev
```

### 2. Instal Dependensi
```bash
npm install
```

### 3. Konfigurasi Lingkungan (`.env.local`)
Salin templat konfigurasi dan sesuaikan kredensial Anda:
```env
# Database TiDB Serverless / MySQL
DATABASE_URL="mysql://root:password@gateway.tidbcloud.com:4000/pantau_pangan_v2?ssl=true"

# API Indonesia Resmi (Bapanas)
API_INDONESIA_BASE_URL="https://use.apiindonesia.id"
API_INDONESIA_KEY="your_api_indonesia_key_here"

# Upstash Redis
UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your_upstash_token_here"

# Autentikasi Sesi & Cron
BETTER_AUTH_SECRET="minimal_32_karakter_acak_rahasia_untuk_enkripsi_sesi"
CRON_SECRET="minimal_16_karakter_rahasia_untuk_vercel_cron"

# Microservice AI Forecasting
ML_SERVICE_URL="http://localhost:8000"
```

### 4. Menjalankan Verifikasi Kesiapan Lingkungan
Pastikan seluruh komponen cloud (Database, Redis, dan API Indonesia) terhubung:
```bash
npm run verify:env
```

---

## 🛠️ Skrip Otomasi & Perintah CLI

Proyek ini dilengkapi serangkaian perintah CLI untuk verifikasi keamanan, seeding, dan pengujian:

| Perintah | Deskripsi |
| :--- | :--- |
| `npm run dev` | Menjalankan server pengembangan Next.js 15 dengan Turbopack (`http://localhost:3000`). |
| `npm run verify:secrets` | Audit keamanan statis untuk mendeteksi kredensial hardcoded, kunci bocor, dan variabel publik rentan. |
| `npm run verify:env` | Verifikasi runtime format env schema (Zod) dan live ping latensi ke DB, Upstash Redis, dan API Indonesia. |
| `npm run db:seed:users` | Inisialisasi 4 akun UAT multi-peran, pantauan awal, notifikasi, dan 5 artikel analisis pangan. |
| `npm run db:seed:prod` | Sinkronisasi komprehensif data produksi API Indonesia yang dibatasi kredit aman (`--max-credits=300`). |
| `npm run test` | Menjalankan suite pengujian unit Vitest (normalisasi harga, margin spread, edge-cases 402/429, anomaly mapping). |
| `npm run test:e2e` | Menjalankan skenario pengujian E2E Playwright untuk 4 peran pengguna dan proteksi RBAC. |
| `npm run lint` | Analisis kode statis dengan ESLint dan TypeScript compiler. |
| `npm run build` | Kompilasi produksi Next.js 15 dengan Turbopack. |

---

## 🚀 Peta Roadmap Sprint 0 – Sprint 10

Eksekusi proyek dijalankan secara ketat pada branch kerja `pantaupangan-v02-dev`:

- **Sprint 0**: Pembuatan branch `pantaupangan-v02-dev`, pembersihan kode legacy PHP/HTML, dan sanitasi repositori.
- **Sprint 1**: Setup Next.js 15 App Router, Tailwind CSS v4, AgriModern Design System, dan skema Drizzle ORM 11 tabel.
- **Sprint 2**: Integrasi resmi client API Indonesia, rate-limiter, dan Smart Delta Sync Engine.
- **Sprint 3**: Sistem autentikasi server-side HttpOnly Cookie session, hashing bcrypt, dan middleware RBAC 4 peran.
- **Sprint 4**: Rombak UI publik, saklar Konsumen/Produsen, Radar Anomali IFPA/QIPA, dan Peta Koroplet 38 Provinsi.
- **Sprint 5**: Workspace dashboard per peran (Petani, Pedagang, Pembeli), Watchlist 2.0, purge riwayat pencarian, dan Admin Sync Center.
- **Sprint 6**: Integrasi microservice FastAPI Prophet AI Forecasting bulanan dan setup pengujian otomatis awal.
- **Sprint 7**: Hardening keamanan pra-rilis, CLI secret scanner, verifier env cloud, dan HTTP security headers produksi.
- **Sprint 8**: Seeder data produksi hemat kredit (`seed-production.ts`), seeder akun UAT (`seed-users.ts`), dan konten artikel pangan awal.
- **Sprint 9**: Vitest edge-case suite (penanganan string `"-"`, respons 402 Insufficient Credits, 429 backoff retry) dan Playwright UAT specs.
- **Sprint 10**: PWA manifest mobile, unified healthcheck endpoint (`/api/health`), Vercel cron 2x harian, dan dokumentasi cutover v2.0.

---

## 🔒 Keamanan & Standar Kepatuhan

PantauPangan v2.0 mematuhi standar keamanan aplikasi web modern:
- **HTTP Security Headers**: Dilengkapi `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, dan `Permissions-Policy`.
- **Anti-Lockout Protection**: Administrator tidak dapat menghapus atau menurunkan level akunnya sendiri melalui UI maupun endpoint API.
- **Sanitasi Input**: Seluruh parameter pencarian dan payload transaksi divalidasi ketat menggunakan skema Zod.
- **Audit Logging**: Setiap eksekusi sinkronisasi data dicatat ke dalam tabel `audit_logs` bersama metadata detail respons.

---

**PantauPangan v2.0** — Didedikasikan untuk transparansi pasar, ketahanan pangan, dan kesejahteraan petani & konsumen Indonesia.
