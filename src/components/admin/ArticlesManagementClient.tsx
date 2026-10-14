"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Edit,
  Search,
  AlertTriangle,
} from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface ArticleItem {
  id: number;
  slug: string;
  title: string;
  category: string;
  sourceName: string;
  content: string;
  commodityId: number | null;
  commodityName: string | null;
  publishedAt: string;
}

export function ArticlesManagementClient({
  commodities = [],
}: {
  commodities: Array<{ id: number; name: string }>;
}) {
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newCategory, setNewCategory] = useState("Pasar & Kebijakan");
  const [newSource, setNewSource] = useState("Kementerian Perdagangan / Bapanas");
  const [newCommodityId, setNewCommodityId] = useState("");
  const [newContent, setNewContent] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Edit Modal
  const [editingArticle, setEditingArticle] = useState<ArticleItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editSource, setEditSource] = useState("");
  const [editCommodityId, setEditCommodityId] = useState("");
  const [editContent, setEditContent] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete Alert
  const [articleToDelete, setArticleToDelete] = useState<ArticleItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchArticles = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/admin/articles");
      const json = await res.json();
      if (json.success) {
        setArticles(json.data);
      } else {
        toast.error(json.error || "Gagal memuat artikel.");
      }
    } catch {
      toast.error("Terjadi masalah jaringan.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const res = await fetch("/api/v1/admin/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          slug: newSlug || undefined,
          category: newCategory,
          sourceName: newSource,
          commodityId: newCommodityId ? Number(newCommodityId) : null,
          content: newContent,
        }),
      });
      const json = await res.json();

      if (json.success) {
        toast.success(json.message || "Artikel berhasil diterbitkan!");
        setIsCreateOpen(false);
        setNewTitle("");
        setNewSlug("");
        setNewContent("");
        setNewCommodityId("");
        fetchArticles();
      } else {
        toast.error(json.error || "Gagal menerbitkan artikel.");
      }
    } catch {
      toast.error("Terjadi masalah jaringan.");
    } finally {
      setIsCreating(false);
    }
  };

  const openEditModal = (art: ArticleItem) => {
    setEditingArticle(art);
    setEditTitle(art.title);
    setEditSlug(art.slug);
    setEditCategory(art.category);
    setEditSource(art.sourceName);
    setEditCommodityId(art.commodityId ? String(art.commodityId) : "");
    setEditContent(art.content);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArticle) return;

    setIsUpdating(true);
    try {
      const res = await fetch("/api/v1/admin/articles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingArticle.id,
          title: editTitle,
          slug: editSlug,
          category: editCategory,
          sourceName: editSource,
          commodityId: editCommodityId ? Number(editCommodityId) : null,
          content: editContent,
        }),
      });
      const json = await res.json();

      if (json.success) {
        toast.success(json.message || "Artikel berhasil diperbarui!");
        setEditingArticle(null);
        fetchArticles();
      } else {
        toast.error(json.error || "Gagal memperbarui artikel.");
      }
    } catch {
      toast.error("Terjadi masalah jaringan.");
    } finally {
      setIsUpdating(false);
    }
  };

  const confirmDelete = async () => {
    if (!articleToDelete) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/v1/admin/articles?id=${articleToDelete.id}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (json.success) {
        toast.success(json.message || "Artikel berhasil dihapus!");
        setArticleToDelete(null);
        fetchArticles();
      } else {
        toast.error(json.error || "Gagal menghapus artikel.");
      }
    } catch {
      toast.error("Terjadi masalah jaringan.");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredArticles = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.commodityName && a.commodityName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border/60 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-foreground tracking-tight">
              CMS Berita & Wawasan Pangan
            </h1>
            <Badge className="bg-purple-600 text-white text-xs px-2 py-0.5">
              {articles.length} Artikel
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Publikasikan artikel berita pangan yang terhubung langsung dengan tag komoditas untuk tampil di Beranda dan Halaman Detail.
          </p>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white text-xs gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Tulis Berita Baru
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border/70">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Cari berita berdasarkan judul, tag komoditas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs h-9"
          />
        </div>
      </div>

      {/* Table of Articles */}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Memuat data artikel berita...
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              Belum ada artikel berita yang diterbitkan.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
                    <th className="py-3 px-4">Judul Artikel</th>
                    <th className="py-3 px-4">Tag Komoditas</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Sumber</th>
                    <th className="py-3 px-4">Tanggal Rilis</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredArticles.map((art) => (
                    <tr key={art.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 max-w-sm">
                        <div className="font-bold text-sm text-foreground line-clamp-1">
                          {art.title}
                        </div>
                        <span className="text-[11px] text-muted-foreground font-mono block">
                          /{art.slug}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {art.commodityName ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 text-[10px]">
                            {art.commodityName}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">Umum / Makro</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-[10px] bg-muted">
                          {art.category}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-muted-foreground text-[11px]">
                        {art.sourceName}
                      </td>

                      <td className="py-3 px-4 text-muted-foreground font-mono text-[11px]">
                        {new Date(art.publishedAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(art)}
                            className="h-8 text-xs text-purple-700 hover:text-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setArticleToDelete(art)}
                            className="h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Tulis Berita Pangan Baru</DialogTitle>
              <DialogDescription className="text-xs">
                Hubungkan berita dengan komoditas agar otomatis tampil pada halaman detail komoditas bersangkutan
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3 text-sm">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Judul Berita
                </label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Misal: Pasokan Beras Nasional Aman Menjelang Panen Raya Maret"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Tag Komoditas
                  </label>
                  <select
                    className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus:ring-2 focus:ring-purple-500 outline-none"
                    value={newCommodityId}
                    onChange={(e) => setNewCommodityId(e.target.value)}
                  >
                    <option value="">Umum (Semua Komoditas)</option>
                    {commodities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Kategori Berita
                  </label>
                  <Input
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Kebijakan / Pasar / Pasokan"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Sumber Berita
                </label>
                <Input
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  placeholder="Badan Pangan Nasional, BPS, dll"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Isi Konten Artikel
                </label>
                <textarea
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus:ring-2 focus:ring-purple-500 outline-none min-h-[140px] leading-relaxed"
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Tulis ringkasan atau artikel lengkap mengenai dinamika harga pangan..."
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={isCreating}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700 text-white"
                disabled={isCreating}
              >
                {isCreating ? "Menerbitkan..." : "Terbitkan Berita"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!editingArticle} onOpenChange={(open) => !open && setEditingArticle(null)}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Edit Berita Pangan</DialogTitle>
              <DialogDescription className="text-xs">
                Perbarui isi konten, sumber, atau komoditas tertaut
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3 text-sm">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Judul Berita
                </label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Tag Komoditas
                  </label>
                  <select
                    className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus:ring-2 focus:ring-purple-500 outline-none"
                    value={editCommodityId}
                    onChange={(e) => setEditCommodityId(e.target.value)}
                  >
                    <option value="">Umum (Semua Komoditas)</option>
                    {commodities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Kategori Berita
                  </label>
                  <Input
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Sumber Berita
                </label>
                <Input
                  value={editSource}
                  onChange={(e) => setEditSource(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Isi Konten Artikel
                </label>
                <textarea
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus:ring-2 focus:ring-purple-500 outline-none min-h-[140px] leading-relaxed"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingArticle(null)}
                disabled={isUpdating}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700 text-white"
                disabled={isUpdating}
              >
                {isUpdating ? "Memperbarui..." : "Simpan Perubahan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!articleToDelete}
        onOpenChange={(open) => !open && setArticleToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-rose-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Hapus Artikel Berita?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Apakah Anda yakin ingin menghapus artikel <b>{articleToDelete?.title}</b>? Artikel ini tidak akan tampil lagi di portal publik.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <Button
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs"
            >
              {isDeleting ? "Menghapus..." : "Ya, Hapus Artikel"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
