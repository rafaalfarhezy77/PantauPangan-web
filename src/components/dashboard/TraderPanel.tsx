"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Truck,
  ExternalLink,
  RefreshCw,
  Compass,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface ArbitrageItem {
  commodityId: number;
  commodityName: string;
  commoditySlug: string;
  commodityCategory: string;
  commodityUnit: string;
  commodityIcon: string | null;
  minPrice: number;
  cheapestProvince: string;
  cheapestCode: string;
  maxPrice: number;
  highestProvince: string;
  highestCode: string;
  absoluteSpread: number;
  spreadPct: number;
  totalProvincesRecorded: number;
}

export function TraderPanel() {
  const [level, setLevel] = useState<"konsumen" | "produsen">("konsumen");
  const [items, setItems] = useState<ArbitrageItem[]>([]);
  const [periodMonth, setPeriodMonth] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchArbitrage = async (selectedLevel: "konsumen" | "produsen") => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/arbitrage?level=${selectedLevel}`);
      const json = await res.json();
      if (json.success) {
        setItems(json.data);
        setPeriodMonth(json.periodMonth);
      }
    } catch {
      toast.error("Gagal mengambil data disparitas wilayah.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArbitrage(level);
  }, [level]);

  return (
    <div className="space-y-6">
      {/* Header Banner Pedagang */}
      <div className="rounded-2xl bg-gradient-to-r from-amber-700 via-amber-600 to-orange-700 text-white p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/50 backdrop-blur-sm text-xs font-semibold mb-2">
              <Truck className="w-3.5 h-3.5" />
              <span>Workspace Pedagang & Distributor Logistik</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight">
              Radar Arbitrase & Disparitas Harga Antar-Provinsi
            </h3>
            <p className="text-amber-100 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Analisis selisih harga antar 38 provinsi di Indonesia untuk menemukan sentra pasokan termurah dan pasar tujuan dengan margin distribusi tertinggi.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-black/20 p-1.5 rounded-xl backdrop-blur-sm self-start md:self-auto">
            <button
              onClick={() => setLevel("konsumen")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                level === "konsumen"
                  ? "bg-white text-amber-900 shadow-sm"
                  : "text-amber-100 hover:text-white"
              }`}
            >
              Pasar Eceran (Konsumen)
            </button>
            <button
              onClick={() => setLevel("produsen")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                level === "produsen"
                  ? "bg-white text-amber-900 shadow-sm"
                  : "text-amber-100 hover:text-white"
              }`}
            >
              Sentra Tani (Produsen)
            </button>
          </div>
        </div>
      </div>

      {/* Main Arbitrage Table */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-amber-600" />
              <CardTitle className="text-base font-bold">
                Peringkat Margin Disparitas Harga Wilayah
              </CardTitle>
            </div>
            <CardDescription className="text-xs mt-1">
              Data periode: {periodMonth || "Terbaru"} — Disortir berdasarkan persentase selisih harga tertinggi
            </CardDescription>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchArbitrage(level)}
            disabled={isLoading}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Perbarui Data
          </Button>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Menghitung disparitas harga 38 provinsi...
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              Tidak ada data harga provinsi yang mencukupi untuk analisis disparitas.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
                    <th className="py-2.5 px-3">Komoditas</th>
                    <th className="py-2.5 px-3">Provinsi Termurah (Sentra Asal)</th>
                    <th className="py-2.5 px-3">Provinsi Termahal (Pasar Tujuan)</th>
                    <th className="py-2.5 px-3 text-right">Selisih (Spread Rp)</th>
                    <th className="py-2.5 px-3 text-right">Potensi Margin (%)</th>
                    <th className="py-2.5 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {items.map((item) => (
                    <tr key={item.commodityId} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-3 font-semibold text-foreground">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{item.commodityIcon || "📦"}</span>
                          <div>
                            <div className="font-bold text-sm text-foreground">{item.commodityName}</div>
                            <span className="text-[10px] text-muted-foreground capitalize">
                              {item.commodityCategory} • {item.totalProvincesRecorded} Prov
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-emerald-700 dark:text-emerald-400">
                          {item.cheapestProvince}
                        </div>
                        <div className="text-foreground font-bold">
                          Rp {item.minPrice.toLocaleString("id-ID")}
                          <span className="text-muted-foreground font-normal text-[10px]">/{item.commodityUnit}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-rose-700 dark:text-rose-400">
                          {item.highestProvince}
                        </div>
                        <div className="text-foreground font-bold">
                          Rp {item.maxPrice.toLocaleString("id-ID")}
                          <span className="text-muted-foreground font-normal text-[10px]">/{item.commodityUnit}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <span className="font-bold text-foreground text-sm">
                          +Rp {item.absoluteSpread.toLocaleString("id-ID")}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <Badge
                          variant="outline"
                          className="bg-amber-50 text-amber-800 border-amber-300 font-bold dark:bg-amber-950 dark:text-amber-300 text-xs"
                        >
                          +{item.spreadPct}%
                        </Badge>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <Link href={`/komoditas/${item.commoditySlug}?tingkat=${level}`}>
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-amber-700 hover:text-amber-800 gap-1">
                            Peta & Detail
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
