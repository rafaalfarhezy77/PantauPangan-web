import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  provinces,
  commodities,
  commodityPrices,
  commodityAnomalies,
  userWatchlists,
  searchHistories,
  notifications,
} from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import {
  AlertTriangle,
  Bookmark,
  History,
  ShieldCheck,
  MapPin,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WatchlistSection } from "@/components/dashboard/WatchlistSection";
import { SearchHistorySection } from "@/components/dashboard/SearchHistorySection";
import { NotificationsSection } from "@/components/dashboard/NotificationsSection";
import { FarmerPanel, FarmerCommodityData } from "@/components/dashboard/FarmerPanel";
import { TraderPanel } from "@/components/dashboard/TraderPanel";
import { BuyerPanel, BuyerCommodityItem } from "@/components/dashboard/BuyerPanel";

export default async function DashboardPage() {
  const user = await getSession();

  if (!user) {
    redirect("/login?callbackUrl=/dashboard");
  }

  // 1. Ambil nama provinsi domisili user (jika ada)
  let provinceName = "Nasional (Seluruh Indonesia)";
  if (user.defaultProvinceCode) {
    const provRecord = await db
      .select({ name: provinces.name })
      .from(provinces)
      .where(eq(provinces.code, user.defaultProvinceCode))
      .limit(1);
    if (provRecord[0]?.name) {
      provinceName = provRecord[0].name;
    }
  }

  // 2. Metrik Ringkasan Pengguna
  // Total item di watchlist
  const watchlistCountRecord = await db
    .select({ count: sql<number>`count(*)` })
    .from(userWatchlists)
    .where(eq(userWatchlists.userId, user.id));
  const totalWatchlists = Number(watchlistCountRecord[0]?.count || 0);

  // Total riwayat pencarian
  const searchCountRecord = await db
    .select({ count: sql<number>`count(*)` })
    .from(searchHistories)
    .where(eq(searchHistories.userId, user.id));
  const totalSearches = Number(searchCountRecord[0]?.count || 0);

  // Total notifikasi belum dibaca
  const unreadNotifRecord = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, user.id),
        eq(notifications.isRead, false)
      )
    );
  const totalUnreadNotifs = Number(unreadNotifRecord[0]?.count || 0);

  // 3. Ambil data komoditas aktif untuk dropdown
  const allCommodities = await db
    .select({
      id: commodities.id,
      name: commodities.displayName,
      slug: commodities.slug,
      category: commodities.category,
      unit: commodities.unit,
      icon: commodities.icon,
    })
    .from(commodities)
    .where(eq(commodities.isActive, true));

  // 4. Hitung rata-rata inflasi MoM pangan & anomali aktif
  const latestAnomalies = await db
    .select({
      id: commodityAnomalies.id,
      severity: commodityAnomalies.severity,
      qipa: commodityAnomalies.qipa,
      ifpa: commodityAnomalies.ifpa,
      status: commodityAnomalies.status,
      commodityId: commodityAnomalies.commodityId,
    })
    .from(commodityAnomalies)
    .orderBy(desc(commodityAnomalies.periodMonth))
    .limit(30);

  const activeAnomaliesCount = latestAnomalies.filter(
    (a) => a.severity !== "normal"
  ).length;

  // 5. Data spesifik Petani: harga produsen vs konsumen
  const farmerData: FarmerCommodityData[] = await Promise.all(
    allCommodities.map(async (c) => {
      // Ambil harga produsen
      const prodConditions = [
        eq(commodityPrices.commodityId, c.id),
        eq(commodityPrices.level, "produsen"),
      ];
      if (user.defaultProvinceCode) {
        prodConditions.push(eq(commodityPrices.provinceCode, user.defaultProvinceCode));
      } else {
        prodConditions.push(eq(commodityPrices.regionScope, "nasional"));
      }

      const prodRecord = await db
        .select({ price: commodityPrices.price })
        .from(commodityPrices)
        .where(and(...prodConditions))
        .orderBy(desc(commodityPrices.periodMonth))
        .limit(1);

      // Ambil harga konsumen
      const consConditions = [
        eq(commodityPrices.commodityId, c.id),
        eq(commodityPrices.level, "konsumen"),
      ];
      if (user.defaultProvinceCode) {
        consConditions.push(eq(commodityPrices.provinceCode, user.defaultProvinceCode));
      } else {
        consConditions.push(eq(commodityPrices.regionScope, "nasional"));
      }

      const consRecord = await db
        .select({ price: commodityPrices.price })
        .from(commodityPrices)
        .where(and(...consConditions))
        .orderBy(desc(commodityPrices.periodMonth))
        .limit(1);

      const prodPrice = prodRecord[0]?.price ?? null;
      const consPrice = consRecord[0]?.price ?? null;

      let marginSpread: number | null = null;
      let marginSpreadPct: number | null = null;

      if (prodPrice && consPrice) {
        marginSpread = consPrice - prodPrice;
        marginSpreadPct = Number((((consPrice - prodPrice) / prodPrice) * 100).toFixed(1));
      }

      const anomaly = latestAnomalies.find((a) => a.commodityId === c.id);

      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        unit: c.unit,
        icon: c.icon,
        producerPrice: prodPrice,
        consumerPrice: consPrice,
        marginSpread,
        marginSpreadPct,
        anomalyStatus: anomaly?.status ?? null,
        severity: (anomaly?.severity as "normal" | "warning" | "alert_low" | "alert_high") || "normal",
        qipa: anomaly?.qipa ? Number(anomaly.qipa) : null,
        ifpa: anomaly?.ifpa ? Number(anomaly.ifpa) : null,
      };
    })
  );

  // 6. Data spesifik Pembeli: harga eceran konsumen
  const buyerData: BuyerCommodityItem[] = await Promise.all(
    allCommodities.map(async (c) => {
      const priceConditions = [
        eq(commodityPrices.commodityId, c.id),
        eq(commodityPrices.level, "konsumen"),
      ];
      if (user.defaultProvinceCode) {
        priceConditions.push(eq(commodityPrices.provinceCode, user.defaultProvinceCode));
      } else {
        priceConditions.push(eq(commodityPrices.regionScope, "nasional"));
      }

      const priceRecord = await db
        .select({
          price: commodityPrices.price,
          momChangePct: commodityPrices.momChangePct,
        })
        .from(commodityPrices)
        .where(and(...priceConditions))
        .orderBy(desc(commodityPrices.periodMonth))
        .limit(1);

      const anomaly = latestAnomalies.find((a) => a.commodityId === c.id);

      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        category: c.category,
        unit: c.unit,
        icon: c.icon,
        currentPrice: priceRecord[0]?.price ?? null,
        momChangePct: priceRecord[0]?.momChangePct ? Number(priceRecord[0].momChangePct) : null,
        severity: (anomaly?.severity as "normal" | "warning" | "alert_low" | "alert_high") || "normal",
      };
    })
  );

  return (
    <div className="space-y-8">
      {/* 1. Welcome Banner + Profil Domisili */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border/60 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Selamat datang, {user.name}! 👋
            </h1>
            <Badge
              variant="outline"
              className="capitalize text-xs font-semibold px-2.5 py-0.5 border-emerald-500/30 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
            >
              Role: {user.role}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>Domisili Utama: <b>{provinceName}</b></span>
          </p>
        </div>

        {user.role === "admin" && (
          <Link href="/admin/sync">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white font-medium gap-1.5 shadow-sm text-xs">
              <ShieldCheck className="w-4 h-4" />
              Buka Control Center Admin
            </Button>
          </Link>
        )}
      </div>

      {/* 2. 4 Kartu Ringkasan Metrik */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-border/70 bg-card shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Komoditas Dipantau</span>
            <Bookmark className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-foreground">{totalWatchlists}</div>
            <span className="text-[11px] text-muted-foreground">Di Watchlist Anda</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border/70 bg-card shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Anomali Terdeteksi</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-foreground">{activeAnomaliesCount}</div>
            <span className="text-[11px] text-amber-600 font-medium">Status Warning / Alert</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border/70 bg-card shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Notifikasi Baru</span>
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-foreground">{totalUnreadNotifs}</div>
            <span className="text-[11px] text-muted-foreground">Belum Anda baca</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border/70 bg-card shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Pencarian Tersimpan</span>
            <History className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-foreground">{totalSearches}</div>
            <span className="text-[11px] text-muted-foreground">Tersimpan di Database</span>
          </div>
        </div>
      </div>

      {/* 3. Panel Khusus Sesuai Role Pengguna */}
      <div>
        {user.role === "petani" && (
          <FarmerPanel provinceName={provinceName} data={farmerData} />
        )}

        {user.role === "pedagang" && <TraderPanel />}

        {user.role === "pembeli" && (
          <BuyerPanel provinceName={provinceName} commodities={buyerData} />
        )}

        {user.role === "admin" && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl border border-purple-200 bg-purple-50/50 dark:bg-purple-950/20 dark:border-purple-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-foreground text-base flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-purple-600" />
                  Mode Pratinjau Administrator
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Sebagai Administrator, Anda memiliki akses penuh ke seluruh workspace multi-peran dan kontrol sinkronisasi API Indonesia.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/admin/sync">
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white text-xs gap-1">
                    Control Center Sync
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Admin dapat melihat pratinjau Arbitrase Pedagang */}
            <TraderPanel />
          </div>
        )}
      </div>

      {/* 4. Watchlist 2.0 (Inti untuk Semua Role) */}
      <WatchlistSection
        availableCommodities={allCommodities.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
        }))}
      />

      {/* 5. Notifikasi & Riwayat Pencarian */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NotificationsSection />
        <SearchHistorySection />
      </div>
    </div>
  );
}
