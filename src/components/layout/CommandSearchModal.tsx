"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, ArrowRight, Loader2 } from "lucide-react";

interface SearchCommodity {
  id: number;
  slug: string;
  displayName: string;
  category: string;
  icon: string | null;
  unit: string;
  latestPrice: {
    price: number | null;
  } | null;
}

export function CommandSearchModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [commoditiesList, setCommoditiesList] = useState<SearchCommodity[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && commoditiesList.length === 0) {
      setIsLoading(true);
      fetch("/api/v1/commodities")
        .then((res) => res.json())
        .then((json) => {
          if (json.success && Array.isArray(json.data)) {
            setCommoditiesList(json.data);
          }
        })
        .catch(console.warn)
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, commoditiesList.length]);

  const filtered = query.trim()
    ? commoditiesList.filter(
        (c) =>
          c.displayName.toLowerCase().includes(query.toLowerCase()) ||
          c.category.toLowerCase().includes(query.toLowerCase()) ||
          c.slug.toLowerCase().includes(query.toLowerCase())
      )
    : commoditiesList.slice(0, 10);

  const handleSelect = (slug: string) => {
    onClose();
    router.push(`/komoditas/${slug}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden bg-white rounded-2xl border-cream-100 shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Pencarian Cepat Komoditas</DialogTitle>
        </DialogHeader>

        <div className="flex items-center px-4 border-b border-cream-100">
          <Search className="h-5 w-5 text-slate-400 mr-2 flex-shrink-0" />
          <Input
            autoFocus
            type="text"
            placeholder="Ketik nama komoditas (misal: Beras, Cabai, Bawang, Telur)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 shadow-none focus-visible:ring-0 text-base h-14 px-0 bg-transparent"
          />
          <kbd className="hidden sm:inline-block text-[10px] bg-cream-50 border border-slate-200 px-2 py-0.5 rounded text-slate-500 font-mono">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {isLoading ? (
            <div className="py-8 text-center text-slate-400 flex items-center justify-center gap-2 text-xs">
              <Loader2 className="h-4 w-4 animate-spin text-forest-700" />
              <span>Memuat data komoditas pangan...</span>
            </div>
          ) : filtered.length > 0 ? (
            filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.slug)}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-cream-50 text-left transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.icon || "📦"}</span>
                  <div>
                    <div className="font-semibold text-sm text-slate-800 group-hover:text-forest-700 transition-colors">
                      {item.displayName}
                    </div>
                    <div className="text-xs text-slate-400 capitalize">
                      Kategori {item.category} • Satuan {item.unit}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {item.latestPrice?.price ? (
                    <span className="font-mono text-xs font-bold text-slate-700 bg-white px-2 py-1 rounded-md border border-cream-100">
                      Rp {item.latestPrice.price.toLocaleString("id-ID")}
                    </span>
                  ) : null}
                  <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-forest-700 transition-colors" />
                </div>
              </button>
            ))
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              Tidak ada komoditas pangan yang cocok dengan kata kunci &quot;{query}&quot;.
            </div>
          )}
        </div>

        <div className="bg-cream-50/80 px-4 py-2 border-t border-cream-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Tekan panah atau klik untuk membuka detail harga</span>
          <span className="font-mono">API Indonesia / Bapanas</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
