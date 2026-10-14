"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Calculator,
  TrendingUp,
  ExternalLink,
  Plus,
  Minus,
  Sparkles,
  Info,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface BuyerCommodityItem {
  id: number;
  name: string;
  slug: string;
  category: string;
  unit: string;
  icon: string | null;
  currentPrice: number | null;
  momChangePct: number | null;
  severity: "normal" | "warning" | "alert_low" | "alert_high";
}

export function BuyerPanel({
  provinceName,
  commodities = [],
}: {
  provinceName: string;
  commodities: BuyerCommodityItem[];
}) {
  // Alert High Price: Komoditas yang harganya sedang melonjak naik di pasar eceran
  const highPriceAlerts = commodities.filter(
    (item) =>
      item.severity === "alert_high" ||
      (item.momChangePct !== null && item.momChangePct > 5)
  );

  // Keranjang Belanja Bulanan (Simulasi Kalkulator)
  // Default kuantitas untuk kebutuhan standar keluarga per bulan
  const [quantities, setQuantities] = useState<Record<number, number>>(() => {
    const initial: Record<number, number> = {};
    commodities.forEach((c) => {
      // Set default wajar jika ada
      if (c.slug.includes("beras")) initial[c.id] = 20; // 20 kg
      else if (c.slug.includes("minyak")) initial[c.id] = 3; // 3 liter
      else if (c.slug.includes("telur")) initial[c.id] = 2; // 2 kg
      else if (c.slug.includes("ayam")) initial[c.id] = 2; // 2 kg
      else if (c.slug.includes("gula")) initial[c.id] = 2; // 2 kg
      else if (c.slug.includes("cabai")) initial[c.id] = 1; // 1 kg
      else if (c.slug.includes("bawang")) initial[c.id] = 1; // 1 kg
      else initial[c.id] = 0;
    });
    return initial;
  });

  const handleQuantityChange = (id: number, val: number) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(0, val),
    }));
  };

  // Hitung total estimasi belanja bulanan
  let totalMonthlyExpense = 0;
  const basketBreakdown = commodities
    .map((c) => {
      const qty = quantities[c.id] || 0;
      const price = c.currentPrice || 0;
      const subtotal = qty * price;
      totalMonthlyExpense += subtotal;
      return {
        ...c,
        qty,
        subtotal,
      };
    })
    .filter((item) => item.qty > 0);

  return (
    <div className="space-y-6">
      {/* Header Banner Pembeli */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-800 text-white p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/50 backdrop-blur-sm text-xs font-semibold mb-2">
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Workspace Konsumen & Rumah Tangga</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight">
              Panduan Belanja & Anggaran Pangan di {provinceName}
            </h3>
            <p className="text-blue-100 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Pantau harga eceran pasar harian, antisipasi lonjakan harga sembako, dan simulasikan estimasi anggaran belanja pangan keluarga Anda dengan harga riil.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto">
            <Badge className="bg-white/20 hover:bg-white/30 text-white text-xs border-0 px-3 py-1 font-semibold">
              Tingkat: Konsumen (Eceran) 🛒
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri (2 Kolom): Kalkulator Estimasi Pengeluaran Pangan Bulanan */}
        <Card className="lg:col-span-2 border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-indigo-600" />
                <CardTitle className="text-base font-bold">
                  Kalkulator Estimasi Pengeluaran Pangan Bulanan
                </CardTitle>
              </div>
              <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300">
                Data Riil {provinceName}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Sesuaikan kuantitas konsumsi bulanan (kg) keluarga Anda untuk melihat proyeksi anggaran belanja aktual
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* List input komoditas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
              {commodities.map((item) => {
                const qty = quantities[item.id] || 0;
                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl border border-border/70 bg-card hover:bg-muted/20 transition-colors flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-2xl shrink-0">{item.icon || "📦"}</span>
                      <div className="truncate">
                        <div className="font-semibold text-xs text-foreground truncate">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {item.currentPrice
                            ? `Rp ${item.currentPrice.toLocaleString("id-ID")}/${item.unit}`
                            : "Rp -"}
                        </div>
                      </div>
                    </div>

                    {/* Stepper Input */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleQuantityChange(item.id, qty - 1)}
                        className="h-7 w-7 rounded-lg"
                        disabled={qty <= 0}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <Input
                        type="number"
                        min="0"
                        value={qty}
                        onChange={(e) =>
                          handleQuantityChange(item.id, Number(e.target.value) || 0)
                        }
                        className="h-7 w-12 text-center text-xs p-1 font-semibold"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleQuantityChange(item.id, qty + 1)}
                        className="h-7 w-7 rounded-lg"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Ringkasan Tagihan */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/30 border border-indigo-200/80 dark:border-indigo-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Estimasi Total Pengeluaran Pokok / Bulan
                </span>
                <div className="text-2xl font-black text-foreground mt-0.5">
                  Rp {totalMonthlyExpense.toLocaleString("id-ID")}
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Berdasarkan {basketBreakdown.length} jenis komoditas yang Anda pilih
                </span>
              </div>

              <div className="text-xs text-muted-foreground text-left sm:text-right">
                <span className="block font-medium text-foreground">Harga Pasar Terverifikasi</span>
                <span className="text-[10px] text-muted-foreground">
                  Tanpa manipulasi angka • 100% Data API Indonesia
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Kolom Kanan: Daftar Komoditas Alert High Price */}
        <Card className="border-border/60 shadow-sm flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-rose-600" />
              <CardTitle className="text-base font-bold">
                Alert Lonjakan Harga
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Komoditas dengan inflasi tinggi bulanan (MoM) di {provinceName}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col justify-between">
            {highPriceAlerts.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/60 text-center my-auto">
                <ShoppingCart className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  Harga Eceran Terpantau Aman
                </h4>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Tidak ada komoditas dengan kenaikan harga signifikan di atas 5% pada bulan berjalan.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {highPriceAlerts.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl border border-rose-200 bg-rose-50/60 dark:bg-rose-950/30 dark:border-rose-900/60"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                        <span>{item.icon || "📦"}</span>
                        {item.name}
                      </span>
                      <Badge className="bg-rose-600 text-white text-[10px] px-1.5 py-0 font-bold">
                        {item.momChangePct ? `+${item.momChangePct}%` : "Lonjakan"}
                      </Badge>
                    </div>

                    <div className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
                      <span>Harga Eceran:</span>
                      <span className="font-bold text-foreground">
                        {item.currentPrice
                          ? `Rp ${item.currentPrice.toLocaleString("id-ID")}/${item.unit}`
                          : "-"}
                      </span>
                    </div>

                    <div className="mt-2 text-right">
                      <Link
                        href={`/komoditas/${item.slug}?tingkat=konsumen`}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 hover:text-rose-800 dark:text-rose-400"
                      >
                        Pantau Grafik Historis
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-border/60 text-[11px] text-muted-foreground flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span>Pertimbangkan mencari produk substitusi atau belanja di pasar sentra untuk menghemat.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
