"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface CommodityTickerItem {
  id: number;
  slug: string;
  displayName: string;
  icon: string | null;
  unit: string;
  latestPrice: {
    periodMonth: string;
    price: number | null;
    momChangePct: string | null;
  } | null;
  latestAnomaly: {
    severity: string;
  } | null;
}

export function PriceTicker({
  tingkat = "konsumen",
}: {
  tingkat?: "konsumen" | "produsen";
}) {
  const [items, setItems] = useState<CommodityTickerItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/v1/commodities");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setItems(json.data);
        }
      } catch (err) {
        console.warn("Gagal memuat ticker komoditas:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading && items.length === 0) {
    return (
      <div className="bg-forest-900/95 text-white/70 text-xs py-2 px-4 border-b border-forest-700/50 flex items-center justify-between">
        <span className="flex items-center gap-1.5 animate-pulse">
          <span className="inline-block h-2 w-2 rounded-full bg-mint-200"></span>
          Menghubungkan ke aliran harga pangan nasional...
        </span>
      </div>
    );
  }

  // Komoditas yang memiliki harga terbaru
  const activeItems = items.filter((i) => i.latestPrice?.price);

  return (
    <div className="bg-forest-900 text-cream-50 text-xs py-2 border-b border-forest-700/60 overflow-hidden relative select-none">
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-4">
        {/* Label Badge */}
        <div className="flex-shrink-0 flex items-center gap-1.5 font-bold tracking-wide uppercase text-[10px] bg-forest-700 text-mint-100 px-2 py-0.5 rounded shadow-sm border border-mint-200/20">
          <span className="h-1.5 w-1.5 rounded-full bg-mint-200 animate-ping"></span>
          <span>Harga Pasar {tingkat === "produsen" ? "Produsen" : "Konsumen"}</span>
        </div>

        {/* Ticker Row */}
        <div className="flex-1 overflow-x-auto no-scrollbar flex items-center gap-6 scroll-smooth">
          {activeItems.length > 0 ? (
            activeItems.map((item) => {
              const mom = item.latestPrice?.momChangePct
                ? parseFloat(item.latestPrice.momChangePct)
                : 0;

              // Standarisasi warna ekonomi pangan
              let isAlert = false;
              let isGood = false;

              if (tingkat === "konsumen") {
                isAlert = mom > 0 || item.latestAnomaly?.severity === "alert_high";
                isGood = mom < 0;
              } else {
                isAlert = mom < 0;
                isGood = mom > 0;
              }

              return (
                <Link
                  key={item.id}
                  href={`/komoditas/${item.slug}`}
                  className="flex items-center gap-2 hover:text-mint-200 transition-colors whitespace-nowrap flex-shrink-0 group"
                >
                  <span className="text-sm">{item.icon || "📦"}</span>
                  <span className="font-medium text-cream-50 group-hover:underline">
                    {item.displayName}
                  </span>
                  {item.latestAnomaly?.severity === "alert_high" && (
                    <span className="bg-red-500/30 text-red-300 border border-red-400/40 text-[9px] px-1 py-0.2 rounded font-bold uppercase animate-pulse">
                      Alert Inflasi
                    </span>
                  )}
                  <span className="text-white/80 font-mono">
                    Rp {item.latestPrice?.price?.toLocaleString("id-ID")}
                  </span>

                  {mom !== 0 ? (
                    <span
                      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        isAlert
                          ? "bg-red-500/20 text-red-300 border border-red-400/30"
                          : isGood
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                          : "bg-white/10 text-white/80"
                      }`}
                    >
                      {mom > 0 ? (
                        <TrendingUp className="h-2.5 w-2.5" />
                      ) : (
                        <TrendingDown className="h-2.5 w-2.5" />
                      )}
                      <span>
                        {mom > 0 ? `+${mom}%` : `${mom}%`}
                      </span>
                    </span>
                  ) : (
                    <span className="text-white/40 text-[10px] flex items-center">
                      <Minus className="h-2 w-2" /> 0%
                    </span>
                  )}
                </Link>
              );
            })
          ) : (
            <span className="text-white/50 text-xs italic">
              Data harga terbaru sedang disinkronisasikan dari Badan Pangan Nasional.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
