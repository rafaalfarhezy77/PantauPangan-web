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
    let periodFrom = "2021-01";
    let periodTo = "2026-03";
    let comCount = 46;

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
          // Petakan ke format Map
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

      // Catat pencarian di background jika sudah login
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

  return (
    <div className="space-y-16 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-forest-900 via-forest-900 to-forest-700 text-cream-50 pt-12 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(#52B788_1px,transparent_1px)] [background-size:24px_24px] opacity-10"></div>
        <div className="max-w-7xl mx-auto relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-500/20 border border-mint-200/30 text-mint-200 text-xs font-semibold backdrop-blur-sm">
            <Wheat className="h-4 w-4" />
            <span>Integrasi Langsung Data API Indonesia (Bapanas)</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight max-w-4xl mx-auto leading-tight">
            Pantau Harga Komoditas Pangan Strategis Nasional Secara Real-Time.
          </h1>

          <p className="text-sm sm:text-base text-mint-100/80 max-w-2xl mx-auto leading-relaxed">
            Menghadirkan transparansi harga pangan di 38 provinsi tanpa rekayasa
            data. Dilengkapi Radar Anomali Pasar (QIPA, AIPA, IFPA) untuk
            keamanan pangan masyarakat dan kesejahteraan petani.
          </p>

          {/* SAKLAR GLOBAL TINGKAT HARGA (Konsumen vs Produsen) */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="bg-forest-900/90 border border-mint-200/30 p-1.5 rounded-2xl flex items-center gap-1 shadow-xl">
              <button
                type="button"
                onClick={() => handleTingkatChange("konsumen")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  tingkat === "konsumen"
                    ? "bg-mint-200 text-forest-900 shadow-md shadow-forest-900/20"
                    : "text-mint-100 hover:text-white"
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
                    ? "bg-mint-200 text-forest-900 shadow-md shadow-forest-900/20"
                    : "text-mint-100 hover:text-white"
                }`}
              >
                <span>🌾 Tingkat Produsen</span>
                <span className="text-[10px] opacity-75 font-normal">
                  (Tingkat Petani & Peternak)
                </span>
              </button>
            </div>
          </div>

          {/* METRIK REAL-TIME STATS GRID */}
          <div className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-left">
              <div className="flex items-center gap-2 text-mint-200 text-xs font-semibold mb-1">
                <MapPin className="h-4 w-4" />
                <span>Wilayah NKRI</span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-serif">38 Provinsi</div>
              <div className="text-[11px] text-mint-100/70 mt-1">Sabang s/d Merauke</div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-left">
              <div className="flex items-center gap-2 text-mint-200 text-xs font-semibold mb-1">
                <Wheat className="h-4 w-4" />
                <span>Komoditas Aktif</span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-serif">
                {commoditiesList.length > 0 ? commoditiesList.length : summaryMetrics.comCount} Ragam
              </div>
              <div className="text-[11px] text-mint-100/70 mt-1">Pokok, bumbu, protein</div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-left">
              <div className="flex items-center gap-2 text-mint-200 text-xs font-semibold mb-1">
                <Database className="h-4 w-4" />
                <span>Data Tersimpan</span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold font-serif font-mono">
                {summaryMetrics.totalRows > 0 ? summaryMetrics.totalRows.toLocaleString("id-ID") : "100.000+"}
              </div>
              <div className="text-[11px] text-mint-100/70 mt-1">Titik observasi pasar</div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-left">
              <div className="flex items-center gap-2 text-mint-200 text-xs font-semibold mb-1">
                <Calendar className="h-4 w-4" />
                <span>Rentang Waktu</span>
              </div>
              <div className="text-lg sm:text-xl font-bold font-serif truncate">
                {formatPeriodLabel(summaryMetrics.periodFrom)} - {formatPeriodLabel(summaryMetrics.periodTo)}
              </div>
              <div className="text-[11px] text-mint-100/70 mt-1">Historis Bapanas RI</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SECTION RADAR ANOMALI HARGA PANGAN (Early Warning System) */}
      <section id="radar" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-red-200/80 bg-red-50/50 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-red-700 font-bold text-xs tracking-wider uppercase">
                <ShieldAlert className="h-4 w-4" />
                <span>Early Warning System (EWS)</span>
              </div>
              <h2 className="font-serif text-2xl font-bold text-slate-900">
                Radar Anomali Harga Pangan Strategis
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
                Deteksi fluktuasi tak wajar menggunakan parameter kuantitatif:{" "}
                <strong>QIPA</strong> (Disparitas Kuantitas), <strong>AIPA</strong> (Akselerasi Inflasi), dan{" "}
                <strong>IFPA</strong> (Indeks Fluktuasi Gabungan).
              </p>
            </div>
            <Badge variant="outline" className="border-red-300 text-red-700 bg-white font-semibold text-xs py-1 px-3 self-start sm:self-auto">
              {anomalyAlerts.length} Sinyal Waspada Terdeteksi
            </Badge>
          </div>

          {/* Grid Anomaly Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {anomalyAlerts.slice(0, 6).map((item) => {
              const a = item.latestAnomaly!;
              const isAlertHigh = a.severity === "alert_high";
              return (
                <Card
                  key={item.id}
                  className="border border-red-200 bg-white shadow-sm hover:shadow-md transition-shadow rounded-2xl"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{item.icon || "📦"}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isAlertHigh
                            ? "bg-red-100 text-red-800 border-red-200"
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
                        <div className="text-[10px] text-slate-500 font-medium">QIPA</div>
                        <div className="font-mono font-bold text-xs text-slate-800">
                          {a.qipa ? parseFloat(a.qipa).toFixed(2) : "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-medium">AIPA</div>
                        <div className="font-mono font-bold text-xs text-slate-800">
                          {a.aipa ? parseFloat(a.aipa).toFixed(2) : "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-medium">IFPA</div>
                        <div className="font-mono font-bold text-xs text-red-600">
                          {a.ifpa ? parseFloat(a.ifpa).toFixed(2) : "-"}
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/komoditas/${item.slug}`}
                      className="w-full flex items-center justify-between text-xs h-9 px-3 rounded-xl border border-cream-100 hover:bg-cream-50 text-slate-700 font-medium transition-colors"
                    >
                      <span>Analisis Komoditas</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. SECTION PETA CHOROPLETH 38 PROVINSI & GRAFIK TREN */}
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

      {/* 4. SECTION PENCARIAN HARGA MULTI-FILTER (#cari) */}
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
                className="w-full h-11 bg-forest-700 hover:bg-forest-900 text-white font-semibold rounded-xl gap-2 shadow-sm"
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
              Memuat data pasar pangan nasional...
            </p>
          </div>
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  );
}
