"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  History,
  Trash2,
  ExternalLink,
  MapPin,
  Clock,
  Search,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface SearchHistoryItem {
  id: number;
  commodityId: number;
  commodityName: string;
  commoditySlug: string;
  commodityCategory: string;
  commodityUnit: string;
  commodityIcon: string | null;
  level: string | null;
  provinceCode: string | null;
  provinceName: string | null;
  periodFrom: string | null;
  periodTo: string | null;
  searchedAt: string;
  latestPrice: number | null;
  latestMonth: string | null;
}

export function SearchHistorySection() {
  const [items, setItems] = useState<SearchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/search-history");
      const json = await res.json();
      if (json.success) {
        setItems(json.data);
      }
    } catch {
      toast.error("Gagal memuat riwayat pencarian.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDeleteItem = async (id: number) => {
    try {
      const res = await fetch(`/api/v1/search-history?id=${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        setItems((prev) => prev.filter((item) => item.id !== id));
        toast.success("Riwayat pencarian berhasil dihapus dari database.");
      } else {
        toast.error(json.error || "Gagal menghapus riwayat.");
      }
    } catch {
      toast.error("Terjadi masalah jaringan saat menghapus riwayat.");
    }
  };

  const handleClearAll = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch("/api/v1/search-history?all=true", {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        setItems([]);
        toast.success("Seluruh riwayat pencarian Anda berhasil dihapus permanen.");
      } else {
        toast.error(json.error || "Gagal mengosongkan riwayat.");
      }
    } catch {
      toast.error("Terjadi masalah jaringan.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-amber-600" />
            <CardTitle className="text-lg font-bold">Riwayat Pencarian Komoditas</CardTitle>
          </div>
          <CardDescription className="text-xs mt-1">
            Daftar komoditas dan filter wilayah yang pernah Anda eksplorasi (tersimpan permanen di DB)
          </CardDescription>
        </div>

        {items.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            disabled={isDeleting}
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 text-xs gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {isDeleting ? "Menghapus..." : "Bersihkan Semua"}
          </Button>
        )}
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Memuat riwayat pencarian...
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 px-4 border border-dashed border-border rounded-xl bg-muted/20">
            <Search className="w-9 h-9 text-muted-foreground/40 mx-auto mb-2" />
            <h4 className="font-semibold text-foreground text-sm">Belum Ada Riwayat Pencarian</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Setiap kali Anda meneliti harga komoditas di Beranda atau Detail Komoditas, riwayatnya akan dicatat di sini.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/70">
            {items.map((item) => {
              const queryParams = new URLSearchParams();
              if (item.level) queryParams.set("tingkat", item.level);
              if (item.provinceCode) queryParams.set("provinsi", item.provinceCode);
              const linkUrl = `/komoditas/${item.commoditySlug}?${queryParams.toString()}`;

              return (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 hover:bg-muted/40 transition-colors gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.commodityIcon || "📦"}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={linkUrl}
                          className="font-semibold text-sm text-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
                        >
                          {item.commodityName}
                          <ExternalLink className="w-3 h-3 text-muted-foreground" />
                        </Link>
                        <Badge
                          variant="outline"
                          className="text-[10px] capitalize font-medium px-1.5 py-0 bg-muted"
                        >
                          {item.level || "konsumen"}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-600" />
                          {item.provinceName || "Nasional"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          {new Date(item.searchedAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {item.latestPrice && (
                          <span className="font-semibold text-foreground">
                            Harga: Rp {item.latestPrice.toLocaleString("id-ID")}/{item.commodityUnit || "kg"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Link href={linkUrl}>
                      <Button variant="ghost" size="sm" className="text-xs text-emerald-600 hover:text-emerald-700 h-8">
                        Buka Filter
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteItem(item.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      title="Hapus item riwayat"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
