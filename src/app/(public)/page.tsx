"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Wheat,
  MapPin,
  Search,
  Database,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldAlert,
  ChevronRight,
  Loader2,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  Zap,
  ArrowRight,
  ShieldCheck,
  Cpu,
  BarChart3,
  Gauge,
  Sparkles,
  Info,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapWrapper } from "@/components/map/MapWrapper";
import { ProvincePriceData } from "@/components/map/IndonesiaChoroplethMap";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from "recharts";

interface SummaryItem {
  id: number;
  level: string;
  regionScope: string;
  commodityCount: number;
  rowCount: number;
  periodFrom: string;
  periodTo: string;
  lastSyncedAt: string;
}

interface CommodityItem {
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

interface ProvinceItem {
  code: string;
  name: string;
  lat: number | null;
  lng: number | null;
}

interface PriceRecord {
  id: number;
  commodityId: number;
  commodityName: string;
  commoditySlug: string;
  level: string;
  regionScope: string;
  provinceCode: string | null;
  provinceName: string | null;
  periodMonth: string;
  price: number | null;
  momChangePct: string | null;
  yoyChangePct: string | null;
}

function formatPeriodLabel(periodMonth: string): string {
  if (!periodMonth || !periodMonth.includes("-")) return periodMonth;
  const [year, month] = periodMonth.split("-");
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
  const idx = parseInt(month, 10) - 1;
  return `${monthNames[idx] || month} ${year}`;
}

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL state untuk Saklar Tingkat Harga ('konsumen' | 'produsen')
  const tingkatParam = (searchParams.get("tingkat") as "konsumen" | "produsen") || "konsumen";
  const [tingkat, setTingkat] = useState<"konsumen" | "produsen">(tingkatParam);

  // Data states
  const [summaries, setSummaries] = useState<SummaryItem[]>([]);
  const [commoditiesList, setCommoditiesList] = useState<CommodityItem[]>([]);
  const [provincesList, setProvincesList] = useState<ProvinceItem[]>([]);

  // Search filter states
  const [searchScope, setSearchScope] = useState<"nasional" | "provinsi">("nasional");
  const [searchCommoditySlug, setSearchCommoditySlug] = useState("");
  const [searchProvinceCode, setSearchProvinceCode] = useState("");
  const [searchResults, setSearchResults] = useState<PriceRecord[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Map & Chart states
  const [selectedMapCommodity, setSelectedMapCommodity] = useState<CommodityItem | null>(null);
  const [mapProvincesData, setMapProvincesData] = useState<ProvincePriceData[]>([]);
  const [nationalTrend, setNationalTrend] = useState<Array<{ periodMonth: string; price: number | null }>>([]);
  const [chartRange, setChartRange] = useState<"6B" | "1T" | "3T" | "MAX">("1T");

  // State untuk Simulator Prediksi Inflasi Daerah
  const [predictProvinceCode, setPredictProvinceCode] = useState("32"); // Default Jawa Barat
  const [predictCommoditySlug, setPredictCommoditySlug] = useState("cabai-merah-keriting");
  const [predictProvincePrice, setPredictProvincePrice] = useState<number | null>(null);
  const [anomalyFilter, setAnomalyFilter] = useState<"all" | "alert" | "warning">("all");

  // Sinkronisasi URL parameter saat saklar tingkat harga diubah
  const handleTingkatChange = (newTingkat: "konsumen" | "produsen") => {
    setTingkat(newTingkat);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tingkat", newTingkat);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  // Muat data awal (Summary, Commodities, Provinces)
  useEffect(() => {
    async function init() {
      try {
        const [sumRes, comRes, provRes] = await Promise.all([
          fetch("/api/v1/summary").then((r) => r.json()),
          fetch("/api/v1/commodities").then((r) => r.json()),
          fetch("/api/v1/provinces").then((r) => r.json()),
        ]);

        if (sumRes.success && Array.isArray(sumRes.data)) {
          setSummaries(sumRes.data);
        }
        if (comRes.success && Array.isArray(comRes.data)) {
          setCommoditiesList(comRes.data);
          if (comRes.data.length > 0) {
            setSelectedMapCommodity(comRes.data[0]);
            setSearchCommoditySlug(comRes.data[0].slug);
            setPredictCommoditySlug(comRes.data[2]?.slug || comRes.data[0].slug);
          }
        }
        if (provRes.success && Array.isArray(provRes.data)) {
          setProvincesList(provRes.data);
        }
      } catch (err) {
        console.warn("Gagal memuat data awal:", err);
      }
    }
    init();
  }, []);

  // Metrik agregasi dari dataset summary
  const summaryMetrics = useMemo(() => {
    let totalRows = 0;
    let periodFrom = "2024-01";
    let periodTo = "2026-03";
    let comCount = 16;

    for (const s of summaries) {
      totalRows += s.rowCount || 0;
      if (s.periodFrom && s.periodFrom < periodFrom) periodFrom = s.periodFrom;
      if (s.periodTo && s.periodTo > periodTo) periodTo = s.periodTo;
      if (s.commodityCount && s.commodityCount > comCount) comCount = s.commodityCount;
    }

    return { totalRows, periodFrom, periodTo, comCount };
  }, [summaries]);

  // Muat data peta sebaran provinsi dan tren saat komoditas atau tingkat harga berganti
  useEffect(() => {
    if (!selectedMapCommodity) return;

    async function loadMapAndTrendData() {
      if (!selectedMapCommodity) return;
      try {
        // 1. Ambil harga provinsi untuk komoditas terpilih
        const provRes = await fetch(
          `/api/v1/prices?tingkat=${tingkat}&wilayah=provinsi&komoditas=${selectedMapCommodity.slug}&limit=100`
        ).then((r) => r.json());

        if (provRes.success && Array.isArray(provRes.data)) {
          const pMap = new Map<string, PriceRecord>();
          for (const item of provRes.data) {
            if (item.provinceCode && !pMap.has(item.provinceCode)) {
              pMap.set(item.provinceCode, item);
            }
          }

          const mapped: ProvincePriceData[] = provincesList.map((p) => {
            const rec = pMap.get(p.code);
            return {
              provinceCode: p.code,
              provinceName: p.name,
              lat: p.lat,
              lng: p.lng,
              price: rec?.price ?? null,
              momChangePct: rec?.momChangePct ?? null,
            };
          });

          setMapProvincesData(mapped);
        }

        // 2. Ambil tren historis nasional
        const natRes = await fetch(
          `/api/v1/prices?tingkat=${tingkat}&wilayah=nasional&komoditas=${selectedMapCommodity.slug}&limit=120`
        ).then((r) => r.json());

        if (natRes.success && Array.isArray(natRes.data)) {
          const sorted = natRes.data
            .map((d: PriceRecord) => ({
              periodMonth: d.periodMonth,
              price: d.price,
            }))
            .sort((a: { periodMonth: string }, b: { periodMonth: string }) =>
              a.periodMonth.localeCompare(b.periodMonth)
            );

          setNationalTrend(sorted);
        }
      } catch (err) {
        console.warn("Gagal memuat peta:", err);
      }
    }

    loadMapAndTrendData();
  }, [selectedMapCommodity, tingkat, provincesList]);

  // Muat harga provinsi spesifik untuk Simulator Prediksi Inflasi Daerah
  useEffect(() => {
    if (!predictProvinceCode || !predictCommoditySlug) return;
    async function loadPredictPrice() {
      try {
        const res = await fetch(
          `/api/v1/prices?tingkat=konsumen&wilayah=provinsi&komoditas=${predictCommoditySlug}&provinsi=${predictProvinceCode}&limit=1`
        ).then((r) => r.json());
        if (res.success && Array.isArray(res.data) && res.data[0]) {
          setPredictProvincePrice(res.data[0].price);
        } else {
          setPredictProvincePrice(null);
        }
      } catch {
        setPredictProvincePrice(null);
      }
    }
    loadPredictPrice();
  }, [predictProvinceCode, predictCommoditySlug]);

  // Filter data tren sesuai rentang waktu (6B, 1T, 3T, MAX)
  const filteredTrend = useMemo(() => {
    if (nationalTrend.length === 0) return [];
    let count = nationalTrend.length;
    if (chartRange === "6B") count = 6;
    if (chartRange === "1T") count = 12;
    if (chartRange === "3T") count = 36;
    return nationalTrend.slice(-count);
  }, [nationalTrend, chartRange]);

  // Eksekusi Pencarian
  const handleExecuteSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSearching(true);

    try {
      let url = `/api/v1/prices?tingkat=${tingkat}&wilayah=${searchScope}&limit=30`;
      if (searchCommoditySlug) url += `&komoditas=${searchCommoditySlug}`;
      if (searchScope === "provinsi" && searchProvinceCode) {
        url += `&provinsi=${searchProvinceCode}`;
      }

      const res = await fetch(url);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setSearchResults(json.data);
      }

      const selectedComm = commoditiesList.find((c) => c.slug === searchCommoditySlug);
      if (selectedComm) {
        fetch("/api/v1/search-history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            commodityId: selectedComm.id,
            level: tingkat,
            provinceCode: searchScope === "provinsi" ? searchProvinceCode : null,
          }),
        }).catch(() => {});
      }
    } catch (err) {
      console.warn("Gagal melakukan pencarian:", err);
    } finally {
      setIsSearching(false);
    }
  };

  // Komoditas Anomali (Early Warning System)
  const anomalyAlerts = useMemo(() => {
    return commoditiesList.filter(
      (c) =>
        c.latestAnomaly &&
        (c.latestAnomaly.severity === "alert_high" ||
          c.latestAnomaly.severity === "alert_low" ||
          c.latestAnomaly.severity === "warning")
    );
  }, [commoditiesList]);

  // Filter list anomali untuk tampilan section radar
  const filteredAnomalyCards = useMemo(() => {
    if (anomalyFilter === "alert") {
      return commoditiesList.filter((c) => c.latestAnomaly?.severity === "alert_high");
    }
    if (anomalyFilter === "warning") {
      return commoditiesList.filter((c) => c.latestAnomaly?.severity === "warning");
    }
    return anomalyAlerts;
  }, [commoditiesList, anomalyFilter, anomalyAlerts]);

  // Kalkulasi Simulator Prediksi Inflasi Daerah
  const predictionAnalysis = useMemo(() => {
    const selectedComm = commoditiesList.find((c) => c.slug === predictCommoditySlug);
    const selectedProv = provincesList.find((p) => p.code === predictProvinceCode);

    if (!selectedComm) return null;

    const natPrice = selectedComm.latestPrice?.price || 0;
    const provPrice = predictProvincePrice || natPrice;
    const diffPct = natPrice > 0 ? ((provPrice - natPrice) / natPrice) * 100 : 0;

    const ifpaScore = selectedComm.latestAnomaly?.ifpa ? parseFloat(selectedComm.latestAnomaly.ifpa) : 0;
    const qipaScore = selectedComm.latestAnomaly?.qipa ? parseFloat(selectedComm.latestAnomaly.qipa) : 0;
    const aipaScore = selectedComm.latestAnomaly?.aipa ? parseFloat(selectedComm.latestAnomaly.aipa) : 0;

    // Skor probabilitas inflasi daerah (0 - 100)
    // Formula komposit: IFPA (bobot 40%) + Disparitas Daerah (bobot 35%) + AIPA (bobot 25%)
    let riskScore = Math.min(
      99,
      Math.max(
        15,
        Math.round(
          Math.abs(ifpaScore) * 3.5 +
            Math.max(0, diffPct) * 1.8 +
            Math.abs(aipaScore) * 2.2 +
            20
        )
      )
    );

    let riskLevel: "Rendah" | "Waspada" | "Tinggi (Kritis)";
    let riskColor: string;
    let projectionText: string;
    let recommendation: string;

    if (ifpaScore >= 10 || diffPct > 15 || riskScore >= 70) {
      riskLevel = "Tinggi (Kritis)";
      riskColor = "text-red-700 bg-red-100 border-red-200";
      projectionText = `Potensi kenaikan harga +${(Math.abs(ifpaScore) * 0.8).toFixed(1)}% hingga +${(Math.abs(ifpaScore) * 1.4).toFixed(1)}% dalam 30-45 hari ke depan.`;
      recommendation = `Perlu intervensi operasi pasar murah oleh TPID ${selectedProv?.name || "Provinsi"} dan percepatan fasilitasi distribusi dari sentra produksi terdekat.`;
    } else if (ifpaScore >= 5 || diffPct > 5 || riskScore >= 45) {
      riskLevel = "Waspada";
      riskColor = "text-amber-700 bg-amber-100 border-amber-200";
      projectionText = `Tekanan harga moderat (+${(Math.abs(ifpaScore) * 0.5).toFixed(1)}% s/d +${(Math.abs(ifpaScore) * 0.9).toFixed(1)}%), fluktuasi pasokan mulai terdeteksi.`;
      recommendation = `Monitoring harian rantai pasok distributor dan penyiapan buffer stock cadangan pangan daerah.`;
    } else {
      riskLevel = "Rendah";
      riskColor = "text-emerald-700 bg-emerald-100 border-emerald-200";
      projectionText = "Harga relatif stabil dengan deviasi normal. Tidak ada sinyal tekanan inflasi pangan dalam waktu dekat.";
      recommendation = "Pertahankan kelancaran logistik dan pantau disparitas produsen-konsumen secara berkala.";
    }

    return {
      commodity: selectedComm,
      province: selectedProv,
      natPrice,
      provPrice,
      diffPct: diffPct.toFixed(1),
      ifpaScore: ifpaScore.toFixed(2),
      qipaScore: qipaScore.toFixed(2),
      aipaScore: aipaScore.toFixed(2),
      riskScore,
      riskLevel,
      riskColor,
      projectionText,
      recommendation,
    };
  }, [predictCommoditySlug, predictProvinceCode, predictProvincePrice, commoditiesList, provincesList]);

  return (
    <div className="space-y-16 pb-20">
      {/* 1. HERO SECTION DENGAN STORYTELLING DATA RESMI & PREDIKSI INFLASI */}
      <section className="relative overflow-hidden bg-gradient-to-b from-forest-900 via-forest-900 to-forest-700 text-cream-50 pt-12 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(#52B788_1px,transparent_1px)] [background-size:24px_24px] opacity-15"></div>
        <div className="max-w-7xl mx-auto relative z-10 text-center space-y-6">
          {/* Badge Navigasi & Transformasi Sistem */}
          <div className="inline-flex flex-wrap items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-forest-500/20 border border-mint-200/30 text-mint-200 text-xs font-semibold backdrop-blur-md shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-mint-200 animate-ping"></span>
            <span>Gateway API Resmi Bapanas via apiindonesia.id</span>
            <span className="text-white/40 hidden sm:inline">•</span>
            <span className="text-mint-100/90 hidden sm:inline">Migrasi Penuh dari Scraping PIHPS</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight max-w-5xl mx-auto leading-tight text-cream-50">
            Pantau Harga & Deteksi Dini Inflasi Pangan Daerah Sebelum Terjadi.
          </h1>

          <p className="text-sm sm:text-base text-mint-100/85 max-w-3xl mx-auto leading-relaxed">
            Sistem informasi pangan strategis 38 provinsi di Indonesia yang mengintegrasikan data resmi
            Badan Pangan Nasional (Bapanas). Didukung algoritma <strong>Early Warning System (EWS)</strong> berbasis
            indikator anomali kuantitatif (<strong>QIPA, AIPA, IFPA</strong>) untuk memprediksi lonjakan inflasi pangan lokal sebelum merembet ke pasar umum.
          </p>

          {/* SAKLAR GLOBAL TINGKAT HARGA (Konsumen vs Produsen) */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="bg-forest-900/95 border border-mint-200/30 p-1.5 rounded-2xl flex items-center gap-1 shadow-2xl backdrop-blur-md">
              <button
                type="button"
                onClick={() => handleTingkatChange("konsumen")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  tingkat === "konsumen"
                    ? "bg-mint-200 text-forest-900 shadow-md shadow-forest-900/30 scale-100"
                    : "text-mint-100 hover:text-white opacity-80"
                }`}
              >
                <span>🛒 Tingkat Konsumen</span>
                <span className="text-[10px] opacity-75 font-normal">
                  (Pasar Tradisional & Modern)
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleTingkatChange("produsen")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  tingkat === "produsen"
                    ? "bg-mint-200 text-forest-900 shadow-md shadow-forest-900/30 scale-100"
                    : "text-mint-100 hover:text-white opacity-80"
                }`}
              >
                <span>🌾 Tingkat Produsen</span>
                <span className="text-[10px] opacity-75 font-normal">
                  (Petani & Peternak Hulu)
                </span>
              </button>
            </div>
          </div>

          {/* Quick Action CTA Links */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs">
            <a
              href="#prediksi-inflasi"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-forest-700/80 hover:bg-forest-600 text-cream-50 font-semibold border border-mint-200/30 transition-all hover:scale-105"
            >
              <Zap className="h-4 w-4 text-amber-300" />
              <span>Simulator Prediksi Inflasi Daerah</span>
            </a>
            <a
              href="#sumber-data"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-mint-100 font-semibold border border-white/15 transition-all"
            >
              <Database className="h-4 w-4 text-mint-200" />
              <span>Mengapa Beralih dari Web Scraping PIHPS?</span>
            </a>
          </div>

          {/* METRIK REAL-TIME STATS GRID */}
          <div className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-5xl mx-auto">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-left transition-transform hover:-translate-y-1">
              <div className="flex items-center gap-2 text-mint-200 text-xs font-semibold mb-1">
                <MapPin className="h-4 w-4" />
                <span>Cakupan Wilayah</span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-serif">38 Provinsi</div>
              <div className="text-[11px] text-mint-100/70 mt-1">Sabang sampai Merauke</div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-left transition-transform hover:-translate-y-1">
              <div className="flex items-center gap-2 text-mint-200 text-xs font-semibold mb-1">
                <Wheat className="h-4 w-4" />
                <span>Komoditas Aktif</span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-serif">
                {commoditiesList.length > 0 ? commoditiesList.length : summaryMetrics.comCount} Ragam
              </div>
              <div className="text-[11px] text-mint-100/70 mt-1">Pokok, bumbu, protein, minyak</div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-left transition-transform hover:-translate-y-1">
              <div className="flex items-center gap-2 text-mint-200 text-xs font-semibold mb-1">
                <Database className="h-4 w-4" />
                <span>Titik Observasi Pasar</span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-serif font-mono">
                {summaryMetrics.totalRows > 0 ? summaryMetrics.totalRows.toLocaleString("id-ID") : "74.000+"}
              </div>
              <div className="text-[11px] text-mint-100/70 mt-1">Data historis Bapanas RI</div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-left transition-transform hover:-translate-y-1">
              <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold mb-1">
                <ShieldAlert className="h-4 w-4" />
                <span>EWS Anomali Aktif</span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-serif text-amber-300 font-mono">
                {anomalyAlerts.length} Sinyal
              </div>
              <div className="text-[11px] text-mint-100/70 mt-1">Early Warning inflasi daerah</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SECTION FITUR UTAMA: SIMULATOR & PREDIKSI INFLASI DAERAH BERBASIS ANOMALI BAPANAS */}
      <section id="prediksi-inflasi" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="rounded-3xl border border-forest-700/20 bg-gradient-to-br from-white via-white to-mint-100/20 p-6 sm:p-10 shadow-sm space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-cream-100 pb-6">
            <div className="space-y-2 max-w-3xl">
              <div className="inline-flex items-center gap-2 text-forest-700 font-bold text-xs uppercase tracking-wider bg-forest-50 px-3 py-1 rounded-full border border-forest-700/10">
                <Sparkles className="h-3.5 w-3.5 text-forest-700" />
                <span>Teknologi Prediksi Dini Inflasi Pangan Daerah</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-4xl font-bold text-forest-900 leading-tight">
                Bagaimana PantauPangan Memprediksi Inflasi Daerah Sebelum Terjadi?
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Kami memanfaatkan <strong>endpoint resmi Harga Anomali Bapanas</strong> dari gateway API Indonesia.
                Alih-alih menunggu rilis data inflasi bulanan resmi BPS yang bersifat <em>lagging</em> (terlambat 1 bulan),
                sistem mendeteksi 3 sinyal anomali kuantitatif di tingkat hulu & hilir daerah secara <em>leading</em> (mendahului).
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-600 bg-cream-50 p-3 rounded-2xl border border-cream-100 lg:self-start">
              <Gauge className="h-5 w-5 text-forest-700 flex-shrink-0" />
              <span>Akurasi deteksi dini berbasis formula disparitas kuantitas dan akselerasi harga pasar.</span>
            </div>
          </div>

          {/* 3 Pilar Formula Endpoint Harga Anomali Bapanas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-cream-50/70 rounded-2xl p-5 border border-cream-100 space-y-2 relative overflow-hidden">
              <div className="text-2xl font-bold font-mono text-forest-900">01. QIPA</div>
              <div className="font-bold text-sm text-slate-800">
                Quantity Indicator of Price Anomaly
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Mendeteksi ketidakseimbangan kuantitas pasokan atau hambatan distribusi antar-wilayah sebelum memicu kelangkaan di tingkat pasar konsumen.
              </p>
              <div className="pt-2 text-[11px] font-semibold text-forest-700">
                ✓ Sinyal: Defisit pasokan hulu
              </div>
            </div>

            <div className="bg-cream-50/70 rounded-2xl p-5 border border-cream-100 space-y-2 relative overflow-hidden">
              <div className="text-2xl font-bold font-mono text-forest-900">02. AIPA</div>
              <div className="font-bold text-sm text-slate-800">
                Acceleration Indicator of Price Anomaly
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Mengukur turunan kecepatan lonjakan harga harian/mingguan di suatu wilayah. Kenaikan tajam dalam durasi singkat menjadi indikator kuat potensi inflasi.
              </p>
              <div className="pt-2 text-[11px] font-semibold text-forest-700">
                ✓ Sinyal: Kecepatan lonjakan harga
              </div>
            </div>

            <div className="bg-cream-50/70 rounded-2xl p-5 border border-cream-100 space-y-2 relative overflow-hidden">
              <div className="text-2xl font-bold font-mono text-forest-900">03. IFPA</div>
              <div className="font-bold text-sm text-slate-800">
                Integrated Food Price Anomaly Index
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Indeks komposit gabungan Bapanas yang mengklasifikasikan status pasar: <strong>Normal</strong>, <strong>Warning (Waspada)</strong>, atau <strong>Alert (High/Low Price)</strong>.
              </p>
              <div className="pt-2 text-[11px] font-semibold text-forest-700">
                ✓ Sinyal: Level risiko inflasi gabungan
              </div>
            </div>
          </div>

          {/* SIMULATOR INTERAKTIF: PROYEKSI INFLASI PER PROVINSI & KOMODITAS */}
          <div className="rounded-2xl border border-mint-200/50 bg-white p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif text-lg sm:text-xl font-bold text-forest-900 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-500 fill-amber-500" />
                  <span>Simulator & Uji Deteksi Dini Inflasi Daerah</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Pilih provinsi dan komoditas pangan untuk melihat kalkulasi risiko inflasi serta rekomendasi mitigasi.
                </p>
              </div>

              {/* Selector Kontrol Provinsi & Komoditas */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">Pilih Provinsi:</label>
                  <select
                    value={predictProvinceCode}
                    onChange={(e) => setPredictProvinceCode(e.target.value)}
                    className="bg-cream-50 border border-cream-100 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-forest-700"
                  >
                    {provincesList.map((p) => (
                      <option key={p.code} value={p.code}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">Pilih Komoditas:</label>
                  <select
                    value={predictCommoditySlug}
                    onChange={(e) => setPredictCommoditySlug(e.target.value)}
                    className="bg-cream-50 border border-cream-100 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-forest-700"
                  >
                    {commoditiesList.map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.icon || "📦"} {c.displayName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Hasil Analisis Prediktif Inflasi */}
            {predictionAnalysis && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-cream-50/50 p-6 rounded-2xl border border-cream-100">
                {/* Metrik Kiri: Risk Score & Status */}
                <div className="lg:col-span-5 flex flex-col justify-between space-y-4 bg-white p-5 rounded-xl border border-cream-100 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Status Risiko Inflasi
                    </span>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full border ${predictionAnalysis.riskColor}`}
                    >
                      {predictionAnalysis.riskLevel}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs text-slate-500 font-medium">
                      Indeks Tekanan Inflasi Daerah ({predictionAnalysis.province?.name})
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl sm:text-5xl font-bold font-mono text-forest-900">
                        {predictionAnalysis.riskScore}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">/ 100</span>
                    </div>
                  </div>

                  {/* Progress Bar Risiko */}
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        predictionAnalysis.riskScore > 65
                          ? "bg-red-600"
                          : predictionAnalysis.riskScore > 40
                          ? "bg-amber-500"
                          : "bg-emerald-600"
                      }`}
                      style={{ width: `${predictionAnalysis.riskScore}%` }}
                    ></div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <span>Harga Daerah: <strong>Rp {predictionAnalysis.provPrice.toLocaleString("id-ID")}</strong></span>
                    <span>Nasional: <strong>Rp {predictionAnalysis.natPrice.toLocaleString("id-ID")}</strong></span>
                  </div>
                </div>

                {/* Penjelasan Kanan: Detail Anomali & Rekomendasi Mitigasi */}
                <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
                  {/* Grid 3 Skor Anomali Resmi Bapanas */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white p-3 rounded-xl border border-cream-100 text-center">
                      <div className="text-[10px] text-slate-500 font-semibold uppercase">IFPA Anomali</div>
                      <div className="text-base sm:text-lg font-bold font-mono text-slate-800 mt-0.5">
                        {predictionAnalysis.ifpaScore}
                      </div>
                      <div className="text-[10px] text-slate-400">Komposit Fluktuasi</div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-cream-100 text-center">
                      <div className="text-[10px] text-slate-500 font-semibold uppercase">QIPA Pasokan</div>
                      <div className="text-base sm:text-lg font-bold font-mono text-slate-800 mt-0.5">
                        {predictionAnalysis.qipaScore}
                      </div>
                      <div className="text-[10px] text-slate-400">Disparitas Kuantitas</div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-cream-100 text-center">
                      <div className="text-[10px] text-slate-500 font-semibold uppercase">AIPA Akselerasi</div>
                      <div className="text-base sm:text-lg font-bold font-mono text-slate-800 mt-0.5">
                        {predictionAnalysis.aipaScore}
                      </div>
                      <div className="text-[10px] text-slate-400">Laju Kenaikan</div>
                    </div>
                  </div>

                  {/* Proyeksi Teks */}
                  <div className="bg-white p-4 rounded-xl border border-cream-100 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-forest-900">
                      <Activity className="h-4 w-4 text-forest-700" />
                      <span>Proyeksi Tren Inflasi Daerah (30–60 Hari ke Depan):</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {predictionAnalysis.projectionText}
                    </p>
                  </div>

                  {/* Rekomendasi Kebijakan TPID & Pelaku Usaha */}
                  <div className="bg-forest-50 p-4 rounded-xl border border-forest-700/20 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-forest-900">
                      <ShieldCheck className="h-4 w-4 text-forest-700" />
                      <span>Rekomendasi Tindakan Cepat (TPID & Pelaku Pasar):</span>
                    </div>
                    <p className="text-xs text-forest-800 leading-relaxed">
                      {predictionAnalysis.recommendation}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. SECTION EVOLUSI DATA: DARI PIHPS SCRAPING KE API BAPANAS (APIINDONESIA.ID) */}
      <section id="sumber-data" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="rounded-3xl border border-cream-100 bg-white p-6 sm:p-10 shadow-sm space-y-8">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 text-forest-700 font-bold text-xs uppercase tracking-wider bg-forest-50 px-3 py-1 rounded-full border border-forest-700/10">
              <Database className="h-3.5 w-3.5 text-forest-700" />
              <span>Transparansi Arsitektur Data</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-forest-900">
              Evolusi Sumber Data: Mengapa Beralih dari Web Scraping PIHPS ke Gateway API Bapanas?
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Pada pengembangan sebelumnya, sistem mengandalkan teknik web scraping dari portal PIHPS (Bank Indonesia).
              Kini PantauPangan v2.0 telah bertransformasi total menggunakan integrasi API resmi Badan Pangan Nasional melalui gateway <strong>apiindonesia.id</strong>.
            </p>
          </div>

          {/* Tabel / Grid Komparasi Berdampingan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Kartu Kiri: Web Scraping PIHPS Lama */}
            <div className="rounded-2xl border border-red-200 bg-red-50/40 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-800 border border-red-200 uppercase">
                  Metode Sebelumnya
                </span>
                <span className="text-xs text-slate-500 font-medium">Arsitektur Legacy</span>
              </div>

              <h3 className="font-serif text-lg font-bold text-slate-900">
                Web Scraping Situs PIHPS Bank Indonesia
              </h3>

              <ul className="space-y-3 text-xs text-slate-700">
                <li className="flex items-start gap-2.5">
                  <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <span><strong>Rentan Rusak (Fragile):</strong> Setiap kali pengelola web PIHPS mengubah struktur DOM/HTML atau class CSS, script scraper otomatis error dan gagal mengambil data.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <span><strong>Pembatasan IP & Bot Blocker:</strong> Request scraping sering terblokir firewall atau terkena captcha saat serverless melakukan query paralel.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <span><strong>Tidak Ada Indikator Anomali:</strong> Hanya menyajikan angka harga historis statis tanpa metrik matematis untuk memprediksi inflasi ke depan.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <span><strong>Hanya Konsumen Eceran:</strong> Tidak menyediakan data komparasi harga hulu tingkat produsen petani/peternak.</span>
                </li>
              </ul>
            </div>

            {/* Kartu Kanan: Modern API Bapanas via apiindonesia.id */}
            <div className="rounded-2xl border-2 border-forest-500 bg-gradient-to-br from-mint-100/30 to-white p-6 space-y-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-forest-700 text-white shadow-xs uppercase">
                  PantauPangan v2.0 (Modern)
                </span>
                <span className="text-xs text-forest-700 font-bold">Resmi & Stabil</span>
              </div>

              <h3 className="font-serif text-lg font-bold text-forest-900">
                Integrasi Gateway API Bapanas (apiindonesia.id)
              </h3>

              <ul className="space-y-3 text-xs text-slate-700">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-forest-700 flex-shrink-0 mt-0.5" />
                  <span><strong>Koneksi API Key Terlisensi:</strong> Terhubung resmi via <code>x-api-key</code> server-to-server berformat JSON terstandarisasi yang stabil dan terjamin uptime-nya.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-forest-700 flex-shrink-0 mt-0.5" />
                  <span><strong>Endpoint Harga Anomali Khusus:</strong> Memiliki akses ke <code>/api/v1/harga-pangan/anomali</code> (QIPA, AIPA, IFPA) sebagai pondasi sistem prediksi dini inflasi daerah.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-forest-700 flex-shrink-0 mt-0.5" />
                  <span><strong>Dual-Level Transmisi Harga:</strong> Menghimpun 38 provinsi di dua tingkat simultan: <strong>Tingkat Konsumen</strong> dan <strong>Tingkat Produsen</strong>.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-forest-700 flex-shrink-0 mt-0.5" />
                  <span><strong>Smart Delta Sync Engine:</strong> Hanya menyinkronkan data pembaruan baru, mencegah duplikasi, dan menjamin 100% data asli tanpa manipulasi Math.random.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECTION RADAR ANOMALI HARGA PANGAN (EARLY WARNING SYSTEM) */}
      <section id="radar" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-red-200/80 bg-red-50/50 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-red-700 font-bold text-xs tracking-wider uppercase">
                <ShieldAlert className="h-4 w-4" />
                <span>Early Warning System (EWS)</span>
              </div>
              <h2 className="font-serif text-2xl font-bold text-slate-900">
                Radar Sinyal Anomali Pangan Bapanas
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
                Daftar komoditas strategis yang terdeteksi mengalami anomali harga pada bulan laporan terbaru.
                Sinyal waspada ini digunakan untuk mengantisipasi rembetan inflasi ke daerah konsumen lainnya.
              </p>
            </div>

            {/* Quick Filter Buttons */}
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-red-200 text-xs font-semibold self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setAnomalyFilter("all")}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  anomalyFilter === "all" ? "bg-red-700 text-white" : "text-slate-600 hover:text-red-700"
                }`}
              >
                Semua ({anomalyAlerts.length})
              </button>
              <button
                type="button"
                onClick={() => setAnomalyFilter("alert")}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  anomalyFilter === "alert" ? "bg-red-700 text-white" : "text-slate-600 hover:text-red-700"
                }`}
              >
                Alert Tinggi
              </button>
              <button
                type="button"
                onClick={() => setAnomalyFilter("warning")}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  anomalyFilter === "warning" ? "bg-red-700 text-white" : "text-slate-600 hover:text-red-700"
                }`}
              >
                Waspada
              </button>
            </div>
          </div>

          {/* Grid Anomaly Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredAnomalyCards.slice(0, 6).map((item) => {
              const a = item.latestAnomaly!;
              const isAlertHigh = a.severity === "alert_high";
              return (
                <Card
                  key={item.id}
                  className="border border-red-200 bg-white shadow-sm hover:shadow-md transition-all rounded-2xl group"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl">{item.icon || "📦"}</span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                          isAlertHigh
                            ? "bg-red-100 text-red-800 border-red-200 animate-pulse"
                            : "bg-amber-100 text-amber-800 border-amber-200"
                        }`}
                      >
                        {a.status || "Peringatan"}
                      </span>
                    </div>
                    <CardTitle className="font-bold text-base text-slate-900 mt-2">
                      {item.displayName}
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      Bulan Laporan: {formatPeriodLabel(a.periodMonth)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <div className="grid grid-cols-3 gap-2 bg-cream-50 p-2.5 rounded-xl border border-cream-100 text-center">
                      <div>
                        <div className="text-[10px] text-slate-500 font-medium">QIPA (Pasokan)</div>
                        <div className="font-mono font-bold text-xs text-slate-800">
                          {a.qipa ? parseFloat(a.qipa).toFixed(2) : "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-medium">AIPA (Laju)</div>
                        <div className="font-mono font-bold text-xs text-slate-800">
                          {a.aipa ? parseFloat(a.aipa).toFixed(2) : "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-medium">IFPA (Indeks)</div>
                        <div className="font-mono font-bold text-xs text-red-600">
                          {a.ifpa ? parseFloat(a.ifpa).toFixed(2) : "-"}
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                      <span>Harga Rata-rata:</span>
                      <span className="font-mono font-bold text-slate-900">
                        Rp {item.latestPrice?.price?.toLocaleString("id-ID") || "-"}
                      </span>
                    </div>

                    <Link
                      href={`/komoditas/${item.slug}`}
                      className="w-full flex items-center justify-between text-xs h-9 px-3 rounded-xl border border-cream-100 hover:bg-cream-50 text-slate-700 font-medium transition-colors"
                    >
                      <span>Analisis Prediksi Inflasi</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. SECTION PETA CHOROPLETH 38 PROVINSI & GRAFIK TREN */}
      <section id="peta" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-forest-700 font-bold text-xs tracking-wider uppercase">
              <Layers className="h-4 w-4" />
              <span>Visualisasi Geografis & Tren</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-forest-900 mt-1">
              Peta Sebaran Disparitas Harga di 38 Provinsi
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Menampilkan disparitas harga komoditas pada tingkat <strong>{tingkat}</strong> dibandingkan rata-rata nasional.
            </p>
          </div>

          {/* Pemilih Komoditas untuk Peta */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">Komoditas:</span>
            <select
              value={selectedMapCommodity?.slug || ""}
              onChange={(e) => {
                const found = commoditiesList.find((c) => c.slug === e.target.value);
                if (found) setSelectedMapCommodity(found);
              }}
              className="bg-white border border-cream-100 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 shadow-sm focus:ring-2 focus:ring-forest-700"
            >
              {commoditiesList.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.icon || "📦"} {c.displayName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Layout Grid: Peta (Kiri) + Grafik Tren Historis (Kanan) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Peta Sebaran 38 Provinsi */}
          <div className="lg:col-span-7">
            <MapWrapper
              provincesData={mapProvincesData}
              nationalAverage={selectedMapCommodity?.latestPrice?.price ?? null}
              commodityName={selectedMapCommodity?.displayName || "Komoditas"}
              level={tingkat}
            />
          </div>

          {/* Grafik Tren Historis Non-Duplicated Date */}
          <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-cream-100 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-cream-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Tren Harga Nasional: {selectedMapCommodity?.displayName}
                </h3>
                <p className="text-xs text-slate-500">
                  Data resmi Badan Pangan Nasional (Tingkat {tingkat})
                </p>
              </div>

              {/* Range Selector */}
              <div className="flex items-center gap-1 bg-cream-50 p-1 rounded-lg border border-cream-100 text-[10px] font-bold">
                {(["6B", "1T", "3T", "MAX"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setChartRange(r)}
                    className={`px-2 py-1 rounded cursor-pointer transition-colors ${
                      chartRange === r
                        ? "bg-forest-700 text-white shadow-xs"
                        : "text-slate-600 hover:text-forest-700"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Recharts Area */}
            <div className="h-64 sm:h-72 w-full">
              {filteredTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={filteredTrend} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0EBE0" vertical={false} />
                    <XAxis
                      dataKey="periodMonth"
                      tickFormatter={formatPeriodLabel}
                      tick={{ fontSize: 11, fill: "#475569" }}
                      axisLine={{ stroke: "#F0EBE0" }}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(val) => `Rp ${(val / 1000).toFixed(0)}rb`}
                      tick={{ fontSize: 11, fill: "#475569" }}
                      axisLine={false}
                      tickLine={false}
                      domain={["auto", "auto"]}
                    />
                    <RechartsTooltip
                      formatter={(val: unknown) => [
                        val ? `Rp ${Number(val).toLocaleString("id-ID")}` : "-",
                        "Harga Rata-rata",
                      ]}
                      labelFormatter={(label: unknown) => formatPeriodLabel(String(label))}
                      contentStyle={{
                        backgroundColor: "#FFFFFF",
                        borderColor: "#F0EBE0",
                        borderRadius: "0.75rem",
                        fontSize: "12px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke={tingkat === "konsumen" ? "#2D6A4F" : "#52B788"}
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 5, fill: "#1A3A2A" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Data deret waktu sedang disiapkan.
                </div>
              )}
            </div>

            {/* Info Footer Card */}
            <div className="p-3 bg-cream-50 rounded-xl text-xs text-slate-600 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800">
                  Rp {selectedMapCommodity?.latestPrice?.price?.toLocaleString("id-ID") || "-"}
                </span>{" "}
                <span className="text-[11px] text-slate-500">{selectedMapCommodity?.unit}</span>
              </div>
              <Link
                href={`/komoditas/${selectedMapCommodity?.slug || ""}`}
                className="inline-flex items-center gap-1 text-xs text-forest-700 hover:text-forest-900 font-semibold"
              >
                <span>Buka Detail Lengkap</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. SECTION PENCARIAN HARGA MULTI-FILTER (#cari) */}
      <section id="cari" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="rounded-3xl border border-cream-100 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-forest-700 font-bold text-xs tracking-wider uppercase">
              <Search className="h-4 w-4" />
              <span>Eksplorasi Data</span>
            </div>
            <h2 className="font-serif text-2xl font-bold text-forest-900">
              Pencarian & Filter Multi-Parameter Harga Pangan
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Saring basis data pangan berdasarkan cakupan wilayah nasional atau provinsi spesifik.
            </p>
          </div>

          {/* Form Multi-Filter */}
          <form onSubmit={handleExecuteSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Wilayah Scope */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Cakupan Wilayah</label>
              <select
                value={searchScope}
                onChange={(e) => setSearchScope(e.target.value as "nasional" | "provinsi")}
                className="w-full bg-cream-50/60 border border-cream-100 rounded-xl h-11 px-3 text-xs text-slate-800 focus:ring-2 focus:ring-forest-700"
              >
                <option value="nasional">Rata-rata Nasional (38 Provinsi)</option>
                <option value="provinsi">Spesifik Provinsi</option>
              </select>
            </div>

            {/* 2. Komoditas */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Komoditas</label>
              <select
                value={searchCommoditySlug}
                onChange={(e) => setSearchCommoditySlug(e.target.value)}
                className="w-full bg-cream-50/60 border border-cream-100 rounded-xl h-11 px-3 text-xs text-slate-800 focus:ring-2 focus:ring-forest-700"
              >
                <option value="">Semua Komoditas</option>
                {commoditiesList.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.displayName}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Provinsi (jika scope provinsi) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Pilih Provinsi {searchScope === "nasional" && "(Hanya jika spesifik)"}
              </label>
              <select
                value={searchProvinceCode}
                onChange={(e) => setSearchProvinceCode(e.target.value)}
                disabled={searchScope === "nasional"}
                className={`w-full border border-cream-100 rounded-xl h-11 px-3 text-xs text-slate-800 focus:ring-2 focus:ring-forest-700 ${
                  searchScope === "nasional" ? "bg-slate-100 opacity-60" : "bg-cream-50/60"
                }`}
              >
                <option value="">Semua Provinsi</option>
                {provincesList.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Tombol Cari */}
            <div className="flex items-end">
              <Button
                type="submit"
                disabled={isSearching}
                className="w-full h-11 bg-forest-700 hover:bg-forest-900 text-white font-semibold rounded-xl gap-2 shadow-sm cursor-pointer"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Mencari Data...</span>
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    <span>Terapkan Filter</span>
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Grid Hasil Pencarian */}
          {searchResults.length > 0 && (
            <div className="pt-4 border-t border-cream-100 space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Ditemukan {searchResults.length} hasil pencarian</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {searchResults.map((row) => (
                  <Card key={row.id} className="border border-cream-100 rounded-xl p-4 bg-cream-50/40">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-sm text-slate-900">{row.commodityName}</span>
                      <span className="text-xs bg-forest-50 text-forest-700 font-bold px-2 py-0.5 rounded">
                        {row.regionScope === "provinsi" ? row.provinceName : "Nasional"}
                      </span>
                    </div>
                    <div className="font-mono text-xl font-bold text-slate-900 mb-1">
                      {row.price ? `Rp ${row.price.toLocaleString("id-ID")}` : "-"}
                    </div>
                    <div className="text-xs text-slate-500 flex justify-between">
                      <span>Periode: {formatPeriodLabel(row.periodMonth)}</span>
                      {row.momChangePct && (
                        <span className={parseFloat(row.momChangePct) > 0 ? "text-red-600 font-bold" : "text-emerald-700 font-bold"}>
                          MoM: {row.momChangePct}%
                        </span>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-cream-50">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-forest-700" />
            <p className="text-sm font-medium text-slate-600">
              Memuat data pasar pangan & sistem prediksi inflasi...
            </p>
          </div>
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  );
}
