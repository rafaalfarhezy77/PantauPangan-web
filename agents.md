# Konteks & Aturan Global Proyek: PantauPangan v2.0
- **Working Branch**: `pantaupangan-v02-dev` (Jangan pernah commit langsung ke `main` sebelum seluruh 6 Sprint lulus pengujian).
- **Tech Stack Utama**:
  - Framework: Next.js 15 (App Router, TypeScript 5, React 19, Server Components & Route Handlers)
  - Styling & UI: Tailwind CSS v4 + shadcn/ui + Lucide Icons + Sonner (Toast)
  - Database & ORM: TiDB Serverless (MySQL compatible) atau PostgreSQL + Drizzle ORM (`drizzle-kit`)
  - Caching & Rate Limit: Upstash Redis (`@upstash/redis`, `@upstash/ratelimit`)
  - Auth & RBAC: Better-Auth / Auth.js v5 (HttpOnly Session Cookie; role: `admin`, `petani`, `pedagang`, `pembeli`)
  - Charts & Maps: Recharts + React-Leaflet (GeoJSON 38 Provinsi)
  - Data Source Tunggal: API Indonesia (`https://use.apiindonesia.id/api/v1/harga-pangan`)
- **Pantangan Keras (Hard Constraints)**:
  1. DILARANG memanggil `https://use.apiindonesia.id` langsung dari client/browser (API key wajib di server `.env` sebagai `API_INDONESIA_KEY`).
  2. DILARANG menggunakan `Math.random()` atau konstanta multiplier statis untuk data harga maupun grafik.
  3. DILARANG membuat fitur upload CSV/XLSX manual untuk harga pangan di Admin Panel; seluruh data harga berasal dari Smart Delta Sync API Indonesia.
  4. DILARANG menyimpan status autentikasi atau role di `localStorage`; wajib menggunakan Server Session / HttpOnly Cookie.
  5. DILARANG menggunakan `window.alert()` atau `window.confirm()`; wajib menggunakan `sonner` toast dan `AlertDialog` shadcn/ui.
