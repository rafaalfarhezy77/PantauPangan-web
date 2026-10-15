"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  Star,
  Download,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Layers,
  ShieldAlert,
  Loader2,
  Check,
  ChevronDown,
  ChevronUp,
  Wheat,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  Legend,
} from "recharts";

interface CommodityDetail {
  id: number;
  slug: string;
  displayName: string;
  apiName: string;
  category: string;
  unit: string;
  icon: string | null;
  latestPrice: {
    periodMonth: string;
    price: number | null;
    momChangePct: string | null;
    yoyChangePct: string | null;
  } | null;
  latestAnomaly: {
    periodMonth: string;
    qipa: string | null;
    aipa: string | null;
    ifpa: string | null;
    status: string | null;
    severity: string;
  } | null;
}

interface PricePoint {
  periodMonth: string;
  price: number | null;
}

interface CombinedTrendPoint {
  periodMonth: string;
  konsumen: number | null;
  produsen: number | null;
  forecast?: number | null;
}

interface ProvincePriceRow {
  provinceCode: string;
  provinceName: string;
  priceKonsumen: number | null;
  priceProdusen: number | null;
  momChangePct: string | null;
  diffFromNational: number | null;
}

function formatPeriod(period: string): string {
  if (!period || !period.includes("-")) return period;
  const [year, month] = period.split("-");
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];
  return `${monthNames[parseInt(month, 10) - 1] || month} ${year}`;
}

export default function CommodityDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [commodity, setCommodity] = useState<CommodityDetail | null>(null);
  const [similarCommodities, setSimilarCommodities] = useState<CommodityDetail[]>([]);
  const [combinedTrends, setCombinedTrends] = useState<CombinedTrendPoint[]>([]);
  const [provincialRows, setProvincialRows] = useState<ProvincePriceRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Watchlist modal state
  const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const [targetMinPrice, setTargetMinPrice] = useState("");
  const [targetMaxPrice, setTargetMaxPrice] = useState("");
  const [alertOnAnomaly, setAlertOnAnomaly] = useState(true);
  const [isSavingWatchlist, setIsSavingWatchlist] = useState(false);

  // Table sorting
  const [sortField, setSortField] = useState<"name" | "konsumen" | "produsen">("konsumen");
  const [sortAsc, setSortAsc] = useState(false);

  // Fetch commodity details and trends
  useEffect(() => {
    async function loadCommodityData() {
      try {
        setLoading(true);

        // 1. Ambil data komoditas
        let currentItem: CommodityDetail | null = null;
        const comRes = await fetch("/api/v1/commodities").then((r) => r.json());
        if (comRes.success && Array.isArray(comRes.data)) {
          const current = comRes.data.find((c: CommodityDetail) => c.slug === slug);
          if (current) {
            currentItem = current;
            setCommodity(current);
            setSimilarCommodities(
              comRes.data.filter(
                (c: CommodityDetail) => c.category === current.category && c.slug !== current.slug
              )
            );
          }
        }

        // 2. Ambil tren konsumen & produsen nasional
        const [konsumenRes, produsenRes] = await Promise.all([
          fetch(`/api/v1/prices?tingkat=konsumen&wilayah=nasional&komoditas=${slug}&limit=48`).then((r) => r.json()),
          fetch(`/api/v1/prices?tingkat=produsen&wilayah=nasional&komoditas=${slug}&limit=48`).then((r) => r.json()),
        ]);

        const kPoints: PricePoint[] = konsumenRes.success ? konsumenRes.data : [];
        const pPoints: PricePoint[] = produsenRes.success ? produsenRes.data : [];

        // Gabungkan berdasarkan periodMonth
        const monthMap = new Map<string, { konsumen: number | null; produsen: number | null }>();

        for (const k of kPoints) {
          if (!monthMap.has(k.periodMonth)) {
            monthMap.set(k.periodMonth, { konsumen: k.price, produsen: null });
          } else {
            monthMap.get(k.periodMonth)!.konsumen = k.price;
          }
        }

        for (const p of pPoints) {
          if (!monthMap.has(p.periodMonth)) {
            monthMap.set(p.periodMonth, { konsumen: null, produsen: p.price });
          } else {
            monthMap.get(p.periodMonth)!.produsen = p.price;
          }
        }

        const sortedTrend: CombinedTrendPoint[] = Array.from(monthMap.entries())
          .map(([periodMonth, val]) => ({
            periodMonth,
            konsumen: val.konsumen,
            produsen: val.produsen,
          }))
          .sort((a, b) => a.periodMonth.localeCompare(b.periodMonth));

        setCombinedTrends(sortedTrend);

        // 3. Ambil data sebaran 38 provinsi (Konsumen & Produsen)
        const [provKRes, provPRes] = await Promise.all([
          fetch(`/api/v1/prices?tingkat=konsumen&wilayah=provinsi&komoditas=${slug}&limit=100`).then((r) => r.json()),
          fetch(`/api/v1/prices?tingkat=produsen&wilayah=provinsi&komoditas=${slug}&limit=100`).then((r) => r.json()),
        ]);

        const provKMap = new Map<string, { price: number | null; name: string; mom: string | null }>();
        if (provKRes.success && Array.isArray(provKRes.data)) {
          for (const item of provKRes.data) {
            if (item.provinceCode && !provKMap.has(item.provinceCode)) {
              provKMap.set(item.provinceCode, {
                price: item.price,
                name: item.provinceName || item.provinceCode,
                mom: item.momChangePct,
              });
            }
          }
        }

        const provPMap = new Map<string, number | null>();
        if (provPRes.success && Array.isArray(provPRes.data)) {
          for (const item of provPRes.data) {
            if (item.provinceCode && !provPMap.has(item.provinceCode)) {
              provPMap.set(item.provinceCode, item.price);
            }
          }
        }

        // Ambil harga nasional untuk perbandingan
        const nationalPrice = currentItem?.latestPrice?.price || null;

        const pRows: ProvincePriceRow[] = [];
        provKMap.forEach((kVal, code) => {
          const pPrice = provPMap.get(code) ?? null;
          const diff =
            kVal.price && nationalPrice ? kVal.price - nationalPrice : null;

          pRows.push({
            provinceCode: code,
            provinceName: kVal.name,
            priceKonsumen: kVal.price,
            priceProdusen: pPrice,
            momChangePct: kVal.mom,
            diffFromNational: diff,
          });
        });

        setProvincialRows(pRows);

        // 4. Periksa apakah sudah ada di watchlist user
        fetch("/api/v1/watchlist")
          .then((r) => r.json())
          .then((res) => {
            if (res.success && Array.isArray(res.data) && currentItem) {
              const matched = res.data.find((w: { commodityId: number }) => w.commodityId === currentItem!.id);
              if (matched) {
                setIsWatching(true);
                setTargetMinPrice(matched.targetMinPrice ? String(matched.targetMinPrice) : "");
                setTargetMaxPrice(matched.targetMaxPrice ? String(matched.targetMaxPrice) : "");
                setAlertOnAnomaly(matched.alertOnAnomaly ?? true);
              }
            }
          })
          .catch(() => {});
      } catch (err) {
        console.warn("Gagal memuat detail komoditas:", err);
      } finally {
        setLoading(false);
      }
    }

    loadCommodityData();
  }, [slug]);

  // Kalkulasi 5 STAT PILLS berbasis data riil
  const statPills = useMemo(() => {
    if (!provincialRows.length || !commodity) {
      return {
        highest: null,
        lowest: null,
        average12M: null,
        spread: null,
        anomaliIndex: commodity?.latestAnomaly?.ifpa || null,
      };
    }

    const validKonsumen = provincialRows.filter((r) => r.priceKonsumen && r.priceKonsumen > 0);

    const sortedByPrice = [...validKonsumen].sort(
      (a, b) => (b.priceKonsumen || 0) - (a.priceKonsumen || 0)
    );

    const highest = sortedByPrice[0] || null;
    const lowest = sortedByPrice[sortedByPrice.length - 1] || null;

    // Rata-rata 12 bulan terakhir dari tren nasional
    const last12M = combinedTrends
      .slice(-12)
      .map((t) => t.konsumen)
      .filter((p): p is number => p !== null && p > 0);

    const average12M =
      last12M.length > 0
        ? Math.round(last12M.reduce((acc, v) => acc + v, 0) / last12M.length)
        : null;

    // Spread Produsen - Konsumen pada bulan terbaru
    const latestKonsumen = commodity.latestPrice?.price;
    const latestTrendPoint = combinedTrends[combinedTrends.length - 1];
    const latestProdusen = latestTrendPoint?.produsen;

    let spread = null;
    if (latestKonsumen && latestProdusen && latestKonsumen > 0 && latestProdusen > 0) {
      const diffRp = latestKonsumen - latestProdusen;
      const pct = Math.round((diffRp / latestProdusen) * 100);
      spread = { diffRp, pct, produsen: latestProdusen, konsumen: latestKonsumen };
    }

    return {
      highest,
      lowest,
      average12M,
      spread,
      anomaliIndex: commodity.latestAnomaly?.ifpa || null,
    };
  }, [provincialRows, commodity, combinedTrends]);

  // Handler Simpan Watchlist
  const handleSaveWatchlist = async () => {
    if (!commodity) return;
    setIsSavingWatchlist(true);

    try {
      const res = await fetch("/api/v1/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commodityId: commodity.id,
          level: "konsumen",
          targetMinPrice: targetMinPrice ? parseInt(targetMinPrice, 10) : null,
          targetMaxPrice: targetMaxPrice ? parseInt(targetMaxPrice, 10) : null,
          alertOnAnomaly,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error || "Gagal menyimpan pantauan.");
        setIsSavingWatchlist(false);
        return;
      }

      setIsWatching(true);
      toast.success(json.message || "Komoditas berhasil ditambahkan ke daftar pantauan!");
      setIsWatchlistOpen(false);
    } catch {
      toast.error("Terjadi kendala jaringan saat menyimpan pantauan.");
    } finally {
      setIsSavingWatchlist(false);
    }
  };

  // Unduh CSV Data Sebaran Provinsi
  const handleDownloadCsv = () => {
    if (!commodity || provincialRows.length === 0) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Kode Provinsi,Nama Provinsi,Harga Konsumen (Rp),Harga Produsen (Rp),MoM Change (%),Selisih vs Rata-rata Nasional (Rp)\n";

    provincialRows.forEach((r) => {
      csvContent += `"${r.provinceCode}","${r.provinceName}",${r.priceKonsumen || ""},${r.priceProdusen || ""},"${r.momChangePct || 0}","${r.diffFromNational || 0}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `pantaupangan_${commodity.slug}_sebaran_provinsi_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("File CSV data provinsi berhasil diunduh.");
  };

  // Sort Table
  const sortedProvincialRows = useMemo(() => {
    return [...provincialRows].sort((a, b) => {
      if (sortField === "name") {
        return sortAsc
          ? a.provinceName.localeCompare(b.provinceName)
          : b.provinceName.localeCompare(a.provinceName);
      }
      if (sortField === "konsumen") {
        const pA = a.priceKonsumen || 0;
        const pB = b.priceKonsumen || 0;
        return sortAsc ? pA - pB : pB - pA;
      }
      if (sortField === "produsen") {
        const pA = a.priceProdusen || 0;
        const pB = b.priceProdusen || 0;
        return sortAsc ? pA - pB : pB - pA;
      }
      return 0;
    });
  }, [provincialRows, sortField, sortAsc]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-forest-700" />
        <p className="text-sm font-medium text-slate-600">
          Memuat analisis data harga komoditas pangan...
        </p>
      </div>
    );
  }

  if (!commodity) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center space-y-4">
        <div className="text-4xl">🌾</div>
        <h1 className="font-serif text-2xl font-bold text-slate-800">
          Komoditas Tidak Ditemukan
        </h1>
        <p className="text-sm text-slate-500">
          Komoditas dengan slug &quot;{slug}&quot; belum terdaftar di basis data kami.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-4 py-2 bg-forest-700 hover:bg-forest-900 text-white rounded-xl text-sm font-medium"
        >
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  const mom = commodity.latestPrice?.momChangePct ? parseFloat(commodity.latestPrice.momChangePct) : 0;
  const yoy = commodity.latestPrice?.yoyChangePct ? parseFloat(commodity.latestPrice.yoyChangePct) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Tombol Kembali & Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/" className="hover:text-forest-700 flex items-center gap-1 font-medium">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Beranda</span>
        </Link>
        <span>/</span>
        <span className="capitalize">{commodity.category}</span>
        <span>/</span>
        <span className="font-semibold text-slate-800">{commodity.displayName}</span>
      </div>

      {/* 1. HERO DETAIL KOMODITAS */}
      <div className="rounded-3xl border border-cream-100 bg-white p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-cream-50 text-4xl sm:text-5xl border border-cream-100 flex-shrink-0">
            {commodity.icon || "📦"}
          </div>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-forest-700/30 text-forest-700 bg-forest-50/50 uppercase text-[10px] font-bold">
                Kategori {commodity.category}
              </Badge>
              {commodity.latestAnomaly && (
                <Badge
                  className={`text-[10px] font-bold ${
                    commodity.latestAnomaly.severity === "alert_high"
                      ? "bg-red-100 text-red-800 border-red-200"
                      : commodity.latestAnomaly.severity === "alert_low"
                      ? "bg-amber-100 text-amber-800 border-amber-200"
                      : "bg-emerald-100 text-emerald-800 border-emerald-200"
                  }`}
                >
                  Status {commodity.latestAnomaly.status || "Normal"}
                </Badge>
              )}
            </div>

            <h1 className="font-serif text-2xl sm:text-4xl font-bold text-forest-900">
              {commodity.displayName}
            </h1>
            <p className="text-xs text-slate-500 font-mono">
              Nama Sumber API: {commodity.apiName} • Satuan: {commodity.unit}
            </p>
          </div>
        </div>

        {/* Harga & Tombol Watchlist */}
        <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between gap-4 border-t md:border-t-0 pt-4 md:pt-0 border-cream-100">
          <div className="text-left md:text-right">
            <div className="text-xs text-slate-500 font-medium">Rata-rata Nasional (Konsumen)</div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 mt-0.5">
              {commodity.latestPrice?.price
                ? `Rp ${commodity.latestPrice.price.toLocaleString("id-ID")}`
                : "Belum rilis"}
              <span className="text-xs font-normal text-slate-500 font-sans ml-1">
                {commodity.unit}
              </span>
            </div>

            {/* MoM & YoY Delta Badges */}
            <div className="flex items-center gap-2 mt-1 md:justify-end text-xs font-semibold">
              <span className={`inline-flex items-center gap-0.5 ${mom > 0 ? "text-red-600" : "text-emerald-700"}`}>
                {mom > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                MoM: {mom > 0 ? `+${mom}%` : `${mom}%`}
              </span>
              <span className="text-slate-300">•</span>
              <span className={`inline-flex items-center gap-0.5 ${yoy > 0 ? "text-red-600" : "text-emerald-700"}`}>
                YoY: {yoy > 0 ? `+${yoy}%` : `${yoy}%`}
              </span>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => setIsWatchlistOpen(true)}
            className={`gap-2 h-10 px-4 rounded-xl text-xs font-semibold shadow-sm transition-all ${
              isWatching
                ? "bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300"
                : "bg-forest-700 hover:bg-forest-900 text-white"
            }`}
          >
            <Star className={`h-4 w-4 ${isWatching ? "fill-amber-500 text-amber-500" : ""}`} />
            <span>{isWatching ? "Sedang Dipantau" : "⭐ Pantau Komoditas"}</span>
          </Button>
        </div>
      </div>

      {/* 2. LIMA STAT PILLS BERBASIS DATA RIIL */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Pill 1: Harga Tertinggi */}
        <div className="bg-white rounded-2xl p-4 border border-cream-100 shadow-xs space-y-1">
          <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
            <ArrowUpRight className="h-3.5 w-3.5 text-red-600" />
            <span>Provinsi Tertinggi</span>
          </div>
          <div className="font-mono text-base sm:text-lg font-bold text-slate-900">
            {statPills.highest?.priceKonsumen
              ? `Rp ${statPills.highest.priceKonsumen.toLocaleString("id-ID")}`
              : "-"}
          </div>
          <div className="text-[11px] text-slate-500 truncate">
            {statPills.highest?.provinceName || "-"}
          </div>
        </div>

        {/* Pill 2: Harga Terendah */}
        <div className="bg-white rounded-2xl p-4 border border-cream-100 shadow-xs space-y-1">
          <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
            <ArrowDownRight className="h-3.5 w-3.5 text-emerald-600" />
            <span>Provinsi Terendah</span>
          </div>
          <div className="font-mono text-base sm:text-lg font-bold text-slate-900">
            {statPills.lowest?.priceKonsumen
              ? `Rp ${statPills.lowest.priceKonsumen.toLocaleString("id-ID")}`
              : "-"}
          </div>
          <div className="text-[11px] text-slate-500 truncate">
            {statPills.lowest?.provinceName || "-"}
          </div>
        </div>

        {/* Pill 3: Rata-rata 12 Bulan */}
        <div className="bg-white rounded-2xl p-4 border border-cream-100 shadow-xs space-y-1">
          <div className="text-[11px] font-semibold text-slate-500">Rata-rata 12 Bulan</div>
          <div className="font-mono text-base sm:text-lg font-bold text-slate-900">
            {statPills.average12M ? `Rp ${statPills.average12M.toLocaleString("id-ID")}` : "-"}
          </div>
          <div className="text-[11px] text-slate-500">Benchmark Historis</div>
        </div>

        {/* Pill 4: Spread Produsen-Konsumen */}
        <div className="bg-white rounded-2xl p-4 border border-cream-100 shadow-xs space-y-1">
          <div className="text-[11px] font-semibold text-slate-500">Margin Produsen-Konsumen</div>
          <div className="font-mono text-base sm:text-lg font-bold text-forest-700">
            {statPills.spread ? `+${statPills.spread.pct}%` : "-"}
          </div>
          <div className="text-[11px] text-slate-500 truncate">
            {statPills.spread ? `Selisih Rp ${statPills.spread.diffRp.toLocaleString("id-ID")}` : "Data produsen lengkap"}
          </div>
        </div>

        {/* Pill 5: Indeks Anomali IFPA */}
        <div className="bg-white rounded-2xl p-4 border border-cream-100 shadow-xs space-y-1 col-span-2 lg:col-span-1">
          <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
            <ShieldAlert className="h-3.5 w-3.5 text-red-600" />
            <span>Indeks Anomali (IFPA)</span>
          </div>
          <div className="font-mono text-base sm:text-lg font-bold text-red-600">
            {statPills.anomaliIndex ? parseFloat(statPills.anomaliIndex).toFixed(2) : "0.00"}
          </div>
          <div className="text-[11px] text-slate-500 truncate">
            QIPA: {commodity.latestAnomaly?.qipa || "-"} • AIPA: {commodity.latestAnomaly?.aipa || "-"}
          </div>
        </div>
      </div>

      {/* 2.5 ANALISIS PREDIKSI INFLASI & DETEKSI DINI ANOMALI PASAR (BAPANAS) */}
      <div className="rounded-3xl border border-forest-700/20 bg-gradient-to-br from-white via-cream-50/40 to-mint-100/20 p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-forest-700 font-bold text-xs uppercase tracking-wider bg-forest-50 px-3 py-1 rounded-full border border-forest-700/10">
              <ShieldAlert className="h-3.5 w-3.5 text-forest-700" />
              <span>Early Warning System (EWS) Inflasi Bapanas</span>
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-forest-900">
              Diagnosis Prediksi Inflasi Komoditas: {commodity.displayName}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Evaluasi potensi kenaikan harga pangan di daerah sebelum rilis resmi data inflasi BPS melalui metrik harga anomali resmi Bapanas via gateway API Indonesia.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${
                commodity.latestAnomaly?.severity === "alert_high"
                  ? "bg-red-100 text-red-800 border-red-300 animate-pulse"
                  : commodity.latestAnomaly?.severity === "warning"
                  ? "bg-amber-100 text-amber-800 border-amber-300"
                  : "bg-emerald-100 text-emerald-800 border-emerald-300"
              }`}
            >
              Status: {commodity.latestAnomaly?.status || "Normal"}
            </Badge>
          </div>
        </div>

        {/* 3 Indikator & Insight */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="bg-white p-4 rounded-2xl border border-cream-100 shadow-xs space-y-1">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">QIPA (Disparitas Pasokan)</div>
            <div className="text-xl font-bold font-mono text-slate-900">
              {commodity.latestAnomaly?.qipa ? parseFloat(commodity.latestAnomaly.qipa).toFixed(2) : "0.00"}
            </div>
            <p className="text-[11px] text-slate-600 leading-tight">
              {commodity.latestAnomaly?.qipa && parseFloat(commodity.latestAnomaly.qipa) > 5
                ? "Terindikasi ketimpangan kuantitas pasokan atau hambatan distribusi dari daerah sentra produksi."
                : "Distribusi volume pasokan antar wilayah terpantau lancar dan seimbang."}
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-cream-100 shadow-xs space-y-1">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">AIPA (Akselerasi Harga)</div>
            <div className="text-xl font-bold font-mono text-slate-900">
              {commodity.latestAnomaly?.aipa ? parseFloat(commodity.latestAnomaly.aipa).toFixed(2) : "0.00"}
            </div>
            <p className="text-[11px] text-slate-600 leading-tight">
              {commodity.latestAnomaly?.aipa && parseFloat(commodity.latestAnomaly.aipa) > 5
                ? "Percepatan kenaikan harga harian meningkat pesat mendahului tren historis bulanan."
                : "Laju pergerakan harga berada dalam batas fluktuasi wajar harian."}
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-cream-100 shadow-xs space-y-1">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">IFPA (Indeks Fluktuasi Komposit)</div>
            <div className="text-xl font-bold font-mono text-red-600">
              {commodity.latestAnomaly?.ifpa ? parseFloat(commodity.latestAnomaly.ifpa).toFixed(2) : "0.00"}
            </div>
            <p className="text-[11px] text-slate-600 leading-tight">
              {commodity.latestAnomaly?.ifpa && parseFloat(commodity.latestAnomaly.ifpa) > 8
                ? "Sinyal waspada tinggi: Berpotensi kuat menjadi kontributor utama inflasi harga bergejolak (volatile foods)."
                : "Indeks komposit stabil, risiko inflasi komoditas ini tergolong rendah."}
            </p>
          </div>
        </div>

        {/* Banner Insight Metodologi Bapanas vs PIHPS */}
        <div className="p-3.5 bg-forest-900 text-cream-50 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Wheat className="h-4 w-4 text-mint-200 flex-shrink-0" />
            <span>
              <strong>Metodologi Prediktif Resmi:</strong> Seluruh indikator diambil langsung dari endpoint harga anomali Badan Pangan Nasional melalui gateway API Indonesia (menggantikan scraping PIHPS).
            </span>
          </div>
          <span className="text-[11px] text-mint-200/90 whitespace-nowrap bg-forest-700/60 px-2 py-0.5 rounded border border-mint-200/20">
            Terverifikasi Bapanas RI
          </span>
        </div>
      </div>

      {/* 3. GRAFIK MULTI-LAYER (Konsumen vs Produsen) */}
      <div className="rounded-3xl border border-cream-100 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cream-100">
          <div>
            <div className="flex items-center gap-2 text-forest-700 font-bold text-xs uppercase tracking-wider">
              <Layers className="h-4 w-4" />
              <span>Dinamika Harga Antar Tingkat</span>
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-forest-900 mt-1">
              Perbandingan Rata-rata Nasional: Konsumen vs Produsen
            </h2>
            <p className="text-xs text-slate-500">
              Menilai transmisi harga dari petani produsen hingga konsumen pasar eceran.
            </p>
          </div>
        </div>

        <div className="h-72 sm:h-80 w-full">
          {combinedTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={combinedTrends} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EBE0" vertical={false} />
                <XAxis
                  dataKey="periodMonth"
                  tickFormatter={formatPeriod}
                  tick={{ fontSize: 11, fill: "#475569" }}
                  axisLine={{ stroke: "#F0EBE0" }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => `Rp ${(v / 1000).toFixed(0)}rb`}
                  tick={{ fontSize: 11, fill: "#475569" }}
                  axisLine={false}
                  tickLine={false}
                  domain={["auto", "auto"]}
                />
                <RechartsTooltip
                  formatter={(val: unknown, name: unknown) => [
                    val ? `Rp ${Number(val).toLocaleString("id-ID")}` : "-",
                    name === "konsumen" ? "Tingkat Konsumen" : "Tingkat Produsen",
                  ]}
                  labelFormatter={(l: unknown) => formatPeriod(String(l))}
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderColor: "#F0EBE0",
                    borderRadius: "0.75rem",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ fontSize: "12px", paddingBottom: "10px" }}
                />
                <Line
                  type="monotone"
                  dataKey="konsumen"
                  name="Tingkat Konsumen"
                  stroke="#1A3A2A"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="produsen"
                  name="Tingkat Produsen"
                  stroke="#52B788"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              Data deret historis multi-layer sedang diproses.
            </div>
          )}
        </div>
      </div>

      {/* 4. TABEL PERBANDINGAN 38 PROVINSI */}
      <div className="rounded-3xl border border-cream-100 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-cream-100">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-forest-900">
              Disparitas Harga di 38 Provinsi Indonesia
            </h2>
            <p className="text-xs text-slate-500">
              Membandingkan harga komoditas antar wilayah pada bulan laporan terbaru.
            </p>
          </div>

          <Button
            type="button"
            onClick={handleDownloadCsv}
            variant="outline"
            size="sm"
            className="border-cream-100 hover:bg-cream-50 text-slate-700 text-xs h-9 gap-2 rounded-xl"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Unduh CSV Data 38 Provinsi</span>
          </Button>
        </div>

        {/* Tabel */}
        <div className="overflow-x-auto rounded-xl border border-cream-100">
          <table className="w-full text-xs text-left">
            <thead className="bg-cream-50/70 border-b border-cream-100 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">No</th>
                <th
                  onClick={() => {
                    setSortField("name");
                    setSortAsc(!sortAsc);
                  }}
                  className="py-3 px-4 cursor-pointer hover:text-forest-700"
                >
                  <div className="flex items-center gap-1">
                    <span>Provinsi</span>
                    {sortField === "name" && (sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </th>
                <th
                  onClick={() => {
                    setSortField("konsumen");
                    setSortAsc(!sortAsc);
                  }}
                  className="py-3 px-4 text-right cursor-pointer hover:text-forest-700"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Harga Konsumen</span>
                    {sortField === "konsumen" && (sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </th>
                <th
                  onClick={() => {
                    setSortField("produsen");
                    setSortAsc(!sortAsc);
                  }}
                  className="py-3 px-4 text-right cursor-pointer hover:text-forest-700"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Harga Produsen</span>
                    {sortField === "produsen" && (sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </th>
                <th className="py-3 px-4 text-center">MoM (%)</th>
                <th className="py-3 px-4 text-right">Selisih vs Nasional</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-100">
              {sortedProvincialRows.map((row, idx) => (
                <tr key={row.provinceCode} className="hover:bg-cream-50/50 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-400">{idx + 1}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{row.provinceName}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    {row.priceKonsumen ? `Rp ${row.priceKonsumen.toLocaleString("id-ID")}` : "-"}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-700">
                    {row.priceProdusen ? `Rp ${row.priceProdusen.toLocaleString("id-ID")}` : "-"}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {row.momChangePct ? (
                      <span className={`font-bold ${parseFloat(row.momChangePct) > 0 ? "text-red-600" : "text-emerald-700"}`}>
                        {parseFloat(row.momChangePct) > 0 ? `+${row.momChangePct}%` : `${row.momChangePct}%`}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-mono">
                    {row.diffFromNational !== null ? (
                      <span className={row.diffFromNational > 0 ? "text-red-600 font-bold" : "text-emerald-700 font-bold"}>
                        {row.diffFromNational > 0
                          ? `+Rp ${row.diffFromNational.toLocaleString("id-ID")}`
                          : `-Rp ${Math.abs(row.diffFromNational).toLocaleString("id-ID")}`}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. KOMODITAS SERUPA */}
      {similarCommodities.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-serif text-xl font-bold text-forest-900">
            Komoditas Lainnya dalam Kategori {commodity.category}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {similarCommodities.slice(0, 4).map((sim) => (
              <Card key={sim.id} className="border border-cream-100 bg-white rounded-2xl hover:shadow-md transition-shadow">
                <CardHeader className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{sim.icon || "📦"}</span>
                    <span className="text-xs font-semibold text-slate-400 capitalize">{sim.unit}</span>
                  </div>
                  <CardTitle className="text-sm font-bold text-slate-800 mt-2">
                    {sim.displayName}
                  </CardTitle>
                  <CardDescription className="font-mono text-xs text-slate-700 font-bold">
                    {sim.latestPrice?.price ? `Rp ${sim.latestPrice.price.toLocaleString("id-ID")}` : "-"}
                  </CardDescription>
                  <Link
                    href={`/komoditas/${sim.slug}`}
                    className="inline-flex items-center gap-1 text-xs text-forest-700 hover:text-forest-900 font-semibold mt-3"
                  >
                    <span>Lihat Analisis</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* MODAL DIALOG PANTAU KOMODITAS (Watchlist) */}
      <Dialog open={isWatchlistOpen} onOpenChange={setIsWatchlistOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl border-cream-100 shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-serif text-lg text-forest-900">
              <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
              <span>Pantau {commodity.displayName}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Dapatkan notifikasi perubahan harga target dan sinyal anomali pasar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Target Min (Rp)</label>
                <Input
                  type="number"
                  placeholder="Contoh: 12000"
                  value={targetMinPrice}
                  onChange={(e) => setTargetMinPrice(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Target Max (Rp)</label>
                <Input
                  type="number"
                  placeholder="Contoh: 16000"
                  value={targetMaxPrice}
                  onChange={(e) => setTargetMaxPrice(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-cream-50 border border-cream-100">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-slate-800">Notifikasi Anomali</span>
                <p className="text-[11px] text-slate-500">Kirim sinyal saat status Alert High / Low</p>
              </div>
              <input
                type="checkbox"
                checked={alertOnAnomaly}
                onChange={(e) => setAlertOnAnomaly(e.target.checked)}
                className="h-4 w-4 rounded text-forest-700 focus:ring-forest-700"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-cream-100">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsWatchlistOpen(false)}
              className="text-xs h-9"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleSaveWatchlist}
              disabled={isSavingWatchlist}
              className="bg-forest-700 hover:bg-forest-900 text-white text-xs h-9 rounded-xl gap-2"
            >
              {isSavingWatchlist ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              <span>Simpan Pantauan</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
