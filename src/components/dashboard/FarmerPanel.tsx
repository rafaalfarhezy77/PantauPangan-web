"use client";

import Link from "next/link";
import {
  Sprout,
  AlertOctagon,
  ArrowDownRight,
  ExternalLink,
  Info,
  Scale,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface FarmerCommodityData {
  id: number;
  name: string;
  slug: string;
  unit: string;
  icon: string | null;
  producerPrice: number | null;
  consumerPrice: number | null;
  marginSpread: number | null;
  marginSpreadPct: number | null;
  anomalyStatus: string | null;
  severity: "normal" | "warning" | "alert_low" | "alert_high";
  qipa: number | null;
  ifpa: number | null;
}

export function FarmerPanel({
  provinceName,
  data = [],
}: {
  provinceName: string;
  data: FarmerCommodityData[];
}) {
  // Komoditas yang terindikasi anjlok harga (Alert Low Price atau QIPA/IFPA negatif tajam)
  const lowPriceAlerts = data.filter(
    (item) =>
      item.severity === "alert_low" ||
      (item.qipa !== null && item.qipa < -5) ||
      (item.ifpa !== null && item.ifpa < -5)
  );

  return (
    <div className="space-y-6">
      {/* Header Banner Petani */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600/60 backdrop-blur-sm text-xs font-semibold mb-2">
              <Sprout className="w-3.5 h-3.5" />
              <span>Workspace Petani & Produsen Pangan</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight">
              Kawal Hasil Panen di Wilayah {provinceName}
            </h3>
            <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Analisis harga tingkat produsen (farm-gate), peringatan dini anjlok harga saat panen raya, dan transparansi disparitas harga produsen-ke-konsumen.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto">
            <Badge className="bg-white/20 hover:bg-white/30 text-white text-xs border-0 px-3 py-1 font-semibold">
              Tingkat: Produsen 🌾
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri (2 Kolom): Perbandingan Harga Produsen vs Konsumen */}
        <Card className="lg:col-span-2 border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-emerald-600" />
                <CardTitle className="text-base font-bold">
                  Spread Harga Produsen vs Konsumen (Farm-gate vs Retail)
                </CardTitle>
              </div>
              <Badge variant="outline" className="text-xs">
                Wilayah: {provinceName}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Melihat berapa rupiah yang diterima petani dibanding harga akhir yang dibayar konsumen di pasar
            </CardDescription>
          </CardHeader>

          <CardContent>
            {data.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground">
                Belum ada data harga produsen untuk wilayah ini.
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {data.slice(0, 7).map((item) => (
                  <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{item.icon || "🌾"}</span>
                      <div>
                        <h4 className="font-semibold text-sm text-foreground">{item.name}</h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span>Satuan: /{item.unit}</span>
                          {item.marginSpreadPct !== null && (
                            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                              Margin Pasok: +{item.marginSpreadPct}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-center">
                      <div className="text-right">
                        <div className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">
                          Harga Petani (Produsen)
                        </div>
                        <div className="text-sm font-bold text-foreground">
                          {item.producerPrice
                            ? `Rp ${item.producerPrice.toLocaleString("id-ID")}`
                            : "-"}
                        </div>
                      </div>

                      <div className="h-8 w-px bg-border/60" />

                      <div className="text-right">
                        <div className="text-[10px] uppercase font-bold text-muted-foreground">
                          Harga Konsumen
                        </div>
                        <div className="text-sm font-bold text-foreground">
                          {item.consumerPrice
                            ? `Rp ${item.consumerPrice.toLocaleString("id-ID")}`
                            : "-"}
                        </div>
                      </div>

                      <Link href={`/komoditas/${item.slug}?tingkat=produsen`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:text-emerald-700">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Kolom Kanan: Early Warning Anjlok Harga (Low Price Alert) */}
        <Card className="border-border/60 shadow-sm flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-amber-600" />
              <CardTitle className="text-base font-bold">
                Peringatan Anjlok Harga
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Deteksi dini indeks QIPA/IFPA negatif ekstrem saat panen raya
            </CardDescription>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col justify-between">
            {lowPriceAlerts.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/60 text-center my-auto">
                <Sprout className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  Harga Petani Terpantau Stabil
                </h4>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Tidak terdeteksi anomali penurunan harga tajam atau anjlok drastis di tingkat produsen {provinceName}.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {lowPriceAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3 rounded-xl border border-amber-200 bg-amber-50/60 dark:bg-amber-950/30 dark:border-amber-900/60"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                        <span>{alert.icon || "🌾"}</span>
                        {alert.name}
                      </span>
                      <Badge className="bg-amber-600 text-white text-[10px] px-1.5 py-0 font-bold">
                        Waspada Anjlok
                      </Badge>
                    </div>

                    <div className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
                      <span>Harga Petani:</span>
                      <span className="font-bold text-foreground">
                        {alert.producerPrice ? `Rp ${alert.producerPrice.toLocaleString("id-ID")}` : "-"}
                      </span>
                    </div>

                    <div className="text-[11px] text-amber-800 dark:text-amber-300 mt-2 flex items-center gap-1 font-medium">
                      <ArrowDownRight className="w-3.5 h-3.5 text-amber-600" />
                      <span>Indeks Tekanan Panen: {alert.qipa ? `${alert.qipa}%` : "Negatif"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-border/60 text-[11px] text-muted-foreground flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span>Gunakan data ini untuk merencanakan waktu tunda jual atau lumbung pascapanen.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
