"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Bookmark,
  Plus,
  Trash2,
  TrendingDown,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  MapPin,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export interface WatchlistItem {
  id: string;
  commodityId: number;
  commodityName: string;
  commoditySlug: string;
  commodityCategory: string;
  commodityUnit: string;
  commodityIcon: string | null;
  level: "konsumen" | "produsen";
  provinceCode: string | null;
  provinceName: string | null;
  targetMinPrice: number | null;
  targetMaxPrice: number | null;
  alertOnAnomaly: boolean;
  currentPrice: number | null;
  latestMonth: string | null;
  isPriceAlert: boolean;
  alertType: "min_breached" | "max_breached" | null;
}

export function WatchlistSection({
  initialItems = [],
  availableCommodities = [],
}: {
  initialItems?: WatchlistItem[];
  availableCommodities?: Array<{ id: number; name: string; slug: string }>;
}) {
  const [items, setItems] = useState<WatchlistItem[]>(initialItems);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form states
  const [newCommodityId, setNewCommodityId] = useState<string>("");
  const [newLevel, setNewLevel] = useState<"konsumen" | "produsen">("konsumen");
  const [newMinPrice, setNewMinPrice] = useState<string>("");
  const [newMaxPrice, setNewMaxPrice] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchWatchlist = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/watchlists");
      const json = await res.json();
      if (json.success) {
        setItems(json.data);
      }
    } catch {
      toast.error("Gagal memuat data pantauan komoditas.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialItems.length === 0) {
      fetchWatchlist();
    }
  }, [initialItems.length]);

  const handleDelete = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/v1/watchlists?id=${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        setItems((prev) => prev.filter((item) => item.id !== id));
        toast.success(`${name} dihapus dari daftar pantauan.`);
      } else {
        toast.error(json.error || "Gagal menghapus item.");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan.");
    }
  };

  const handleAddWatchlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommodityId) {
      toast.error("Pilih komoditas yang ingin dipantau.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/watchlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commodityId: Number(newCommodityId),
          level: newLevel,
          targetMinPrice: newMinPrice ? Number(newMinPrice) : null,
          targetMaxPrice: newMaxPrice ? Number(newMaxPrice) : null,
          alertOnAnomaly: true,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message || "Komoditas berhasil dipantau!");
        setIsDialogOpen(false);
        setNewCommodityId("");
        setNewMinPrice("");
        setNewMaxPrice("");
        fetchWatchlist();
      } else {
        toast.error(json.error || "Gagal menyimpan pantauan.");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-emerald-600" />
            <CardTitle className="text-lg font-bold">Watchlist Pantauan Saya (2.0)</CardTitle>
          </div>
          <CardDescription className="text-xs mt-1">
            Pantau komoditas prioritas dengan evaluasi ambang batas harga dan notifikasi otomatis
          </CardDescription>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger className="inline-flex items-center justify-center h-8 px-3 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-1.5 shadow-sm transition-colors cursor-pointer outline-none">
            <Plus className="w-4 h-4" />
            Tambah Pantauan
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleAddWatchlist}>
              <DialogHeader>
                <DialogTitle>Tambah Komoditas ke Watchlist</DialogTitle>
                <DialogDescription className="text-xs">
                  Atur ambang batas peringatan harga minimum dan maksimum untuk komoditas pilihan Anda.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4 text-sm">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Pilih Komoditas
                  </label>
                  <select
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={newCommodityId}
                    onChange={(e) => setNewCommodityId(e.target.value)}
                    required
                  >
                    <option value="">-- Pilih Komoditas --</option>
                    {availableCommodities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Tingkat Rantai Pasok
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewLevel("konsumen")}
                      className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                        newLevel === "konsumen"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-500 dark:bg-emerald-950 dark:text-emerald-300"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      🛒 Konsumen (Eceran)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewLevel("produsen")}
                      className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                        newLevel === "produsen"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-500 dark:bg-emerald-950 dark:text-emerald-300"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      🌾 Produsen (Tingkat Petani)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">
                      Target Min (Rp/kg)
                    </label>
                    <Input
                      type="number"
                      placeholder="Misal: 12000"
                      value={newMinPrice}
                      onChange={(e) => setNewMinPrice(e.target.value)}
                      className="text-sm"
                    />
                    <span className="text-[10px] text-muted-foreground mt-0.5 block">
                      Peringatan jika harga turun ke bawah nilai ini.
                    </span>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">
                      Target Maks (Rp/kg)
                    </label>
                    <Input
                      type="number"
                      placeholder="Misal: 18000"
                      value={newMaxPrice}
                      onChange={(e) => setNewMaxPrice(e.target.value)}
                      className="text-sm"
                    />
                    <span className="text-[10px] text-muted-foreground mt-0.5 block">
                      Peringatan jika harga naik melebihi nilai ini.
                    </span>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan ke Watchlist"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Memuat daftar pantauan Anda...
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-10 px-4 border border-dashed border-border rounded-xl bg-muted/20">
            <Bookmark className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
            <h4 className="font-semibold text-foreground text-sm">Belum Ada Komoditas Dipantau</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Simpan komoditas yang sering Anda beli atau jual untuk menerima peringatan dini saat harga mengalami lonjakan atau anjlok.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="group relative p-4 rounded-xl border border-border/70 bg-card hover:border-emerald-500/40 hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{item.commodityIcon || "🌾"}</span>
                      <div>
                        <h4 className="font-bold text-foreground text-sm leading-snug">
                          {item.commodityName}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge
                            variant="outline"
                            className={`text-[10px] uppercase font-semibold px-1.5 py-0 ${
                              item.level === "produsen"
                                ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300"
                            }`}
                          >
                            {item.level}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                            <MapPin className="w-3 h-3 text-muted-foreground/70" />
                            {item.provinceName || "Nasional"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(item.id, item.commodityName)}
                      className="h-7 w-7 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Hapus dari watchlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  {/* Current Price Display */}
                  <div className="mt-3 p-2.5 rounded-lg bg-muted/40 border border-border/50">
                    <div className="text-[11px] text-muted-foreground">Harga Terakhir:</div>
                    <div className="flex items-baseline justify-between mt-0.5">
                      <span className="text-lg font-bold text-foreground">
                        {item.currentPrice
                          ? `Rp ${item.currentPrice.toLocaleString("id-ID")}`
                          : "Menunggu Data"}
                      </span>
                      <span className="text-xs text-muted-foreground font-medium">
                        /{item.commodityUnit || "kg"}
                      </span>
                    </div>
                  </div>

                  {/* Threshold Evaluation Alert */}
                  {item.isPriceAlert && item.alertType === "max_breached" && (
                    <div className="mt-2.5 flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-300 p-2 rounded-lg border border-rose-200">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>Melebihi target maks: <b>Rp {item.targetMaxPrice?.toLocaleString("id-ID")}</b></span>
                    </div>
                  )}

                  {item.isPriceAlert && item.alertType === "min_breached" && (
                    <div className="mt-2.5 flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-300 p-2 rounded-lg border border-amber-200">
                      <TrendingDown className="w-4 h-4 shrink-0 text-amber-600" />
                      <span>Di bawah target min: <b>Rp {item.targetMinPrice?.toLocaleString("id-ID")}</b></span>
                    </div>
                  )}

                  {!item.isPriceAlert && (item.targetMinPrice || item.targetMaxPrice) && (
                    <div className="mt-2 text-[11px] text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Dalam batas aman (Min: {item.targetMinPrice ? `Rp ${item.targetMinPrice.toLocaleString("id-ID")}` : "-"} / Maks: {item.targetMaxPrice ? `Rp ${item.targetMaxPrice.toLocaleString("id-ID")}` : "-"})</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-muted-foreground">
                    Bulan: {item.latestMonth || "N/A"}
                  </span>
                  <Link
                    href={`/komoditas/${item.commoditySlug}`}
                    className="inline-flex items-center gap-1 font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 group-hover:underline"
                  >
                    Detail Historis
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
