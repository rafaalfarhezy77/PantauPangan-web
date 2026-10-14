"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Edit, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CommodityItem {
  id: number;
  slug: string;
  name: string;
  displayName: string;
  category: "pokok" | "bumbu" | "protein" | "minyak_gula";
  unit: string;
  icon: string | null;
  isActive: boolean;
}

export default function AdminKomoditasPage() {
  const [items, setItems] = useState<CommodityItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<CommodityItem | null>(null);
  const [editCategory, setEditCategory] = useState<"pokok" | "bumbu" | "protein" | "minyak_gula">("pokok");
  const [editUnit, setEditUnit] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchCommodities = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/admin/commodities");
      const json = await res.json();
      if (json.success) {
        setItems(json.data);
      } else {
        toast.error(json.error || "Gagal memuat master komoditas.");
      }
    } catch {
      toast.error("Terjadi kegagalan jaringan.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCommodities();
  }, []);

  const openEditModal = (item: CommodityItem) => {
    setEditingItem(item);
    setEditCategory(item.category);
    setEditUnit(item.unit);
    setEditIcon(item.icon || "🌾");
    setEditIsActive(item.isActive);
    setEditDisplayName(item.displayName);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setIsSaving(true);
    try {
      const res = await fetch("/api/v1/admin/commodities", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingItem.id,
          category: editCategory,
          unit: editUnit,
          icon: editIcon,
          isActive: editIsActive,
          displayName: editDisplayName,
        }),
      });
      const json = await res.json();

      if (json.success) {
        toast.success(json.message || "Master komoditas berhasil diperbarui!");
        setEditingItem(null);
        fetchCommodities();
      } else {
        toast.error(json.error || "Gagal memperbarui komoditas.");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan.");
    } finally {
      setIsSaving(false);
    }
  };

  // Filter list
  const filteredItems = items.filter((item) => {
    const matchSearch =
      item.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat =
      selectedCategory === "all" || item.category === selectedCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border/60 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-foreground tracking-tight">
              Manajemen Master Komoditas
            </h1>
            <Badge className="bg-purple-600 text-white text-xs px-2 py-0.5">
              {items.length} Komoditas
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Atur metadata kategori, satuan ukur, ikon visual, dan status keaktifan komoditas hasil sinkronisasi API Indonesia.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border/70">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Cari komoditas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs h-9"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "Semua Kategori" },
            { id: "pokok", label: "🌾 Pokok" },
            { id: "bumbu", label: "🌶️ Bumbu" },
            { id: "protein", label: "🥩 Protein" },
            { id: "minyak_gula", label: "🫒 Minyak & Gula" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? "bg-purple-600 text-white shadow-xs"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table of Commodities */}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Memuat data komoditas...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              Tidak ada komoditas yang cocok dengan kriteria pencarian.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
                    <th className="py-3 px-4">Komoditas & Ikon</th>
                    <th className="py-3 px-4">Slug Sistem</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Satuan</th>
                    <th className="py-3 px-4 text-center">Status Aktif</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl p-1 rounded-lg bg-muted/50 border border-border/40">
                            {item.icon || "📦"}
                          </span>
                          <div>
                            <span className="font-bold text-sm text-foreground block">
                              {item.displayName}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              Nama Baku: {item.name}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-muted-foreground text-[11px]">
                        {item.slug}
                      </td>

                      <td className="py-3 px-4">
                        <Badge
                          variant="outline"
                          className="capitalize text-[10px] font-semibold bg-muted"
                        >
                          {item.category.replace("_", " & ")}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 font-medium text-foreground">
                        /{item.unit}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {item.isActive ? (
                          <Badge className="bg-emerald-600 text-white text-[10px] px-2 py-0">
                            Aktif
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground text-[10px] px-2 py-0">
                            Nonaktif
                          </Badge>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(item)}
                          className="h-8 text-xs text-purple-700 hover:text-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 gap-1"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Commodity Dialog */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSaveEdit}>
            <DialogHeader>
              <DialogTitle>Edit Master Komoditas</DialogTitle>
              <DialogDescription className="text-xs">
                Perbarui tampilan nama, kategori, unit, dan ikon komoditas
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 text-sm">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Nama Tampilan (Display Name)
                </label>
                <Input
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Ikon Emoji
                  </label>
                  <Input
                    value={editIcon}
                    onChange={(e) => setEditIcon(e.target.value)}
                    placeholder="Misal: 🌾"
                    className="text-lg"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Satuan Ukur
                  </label>
                  <Input
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                    placeholder="kg, liter, dll"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Kategori
                </label>
                <select
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:ring-2 focus:ring-purple-500 outline-none"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as "pokok" | "bumbu" | "protein" | "minyak_gula")}
                >
                  <option value="pokok">Pokok (Beras, Jagung, dll)</option>
                  <option value="bumbu">Bumbu (Cabai, Bawang, dll)</option>
                  <option value="protein">Protein (Daging, Telur, dll)</option>
                  <option value="minyak_gula">Minyak & Gula</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  className="rounded border-border text-purple-600 focus:ring-purple-500 h-4 w-4"
                />
                <label htmlFor="isActiveCheck" className="text-xs font-medium text-foreground cursor-pointer">
                  Tampilkan komoditas ini di antarmuka publik dan ticker
                </label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingItem(null)}
                disabled={isSaving}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700 text-white"
                disabled={isSaving}
              >
                {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
