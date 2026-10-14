"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  UserPlus,
  Trash2,
  Edit,
  Search,
  MapPin,
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

export interface UserItem {
  id: string;
  name: string;
  username: string;
  email: string;
  role: "admin" | "petani" | "pedagang" | "pembeli";
  defaultProvinceCode: string | null;
  provinceName: string | null;
  createdAt: string;
}

export function UserManagementClient({
  currentAdminId,
  provinces = [],
}: {
  currentAdminId: string;
  provinces: Array<{ code: string; name: string }>;
}) {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Create User Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "petani" | "pedagang" | "pembeli">("pembeli");
  const [newProvinceCode, setNewProvinceCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<"admin" | "petani" | "pedagang" | "pembeli">("pembeli");
  const [editProvinceCode, setEditProvinceCode] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete Alert Dialog State
  const [userToDelete, setUserToDelete] = useState<UserItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/admin/users");
      const json = await res.json();
      if (json.success) {
        setUsers(json.data);
      } else {
        toast.error(json.error || "Gagal memuat daftar pengguna.");
      }
    } catch {
      toast.error("Terjadi kegagalan jaringan saat memuat pengguna.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle Add User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const res = await fetch("/api/v1/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          username: newUsername,
          email: newEmail,
          password: newPassword,
          role: newRole,
          defaultProvinceCode: newProvinceCode || null,
        }),
      });
      const json = await res.json();

      if (json.success) {
        toast.success(json.message || "Pengguna berhasil ditambahkan!");
        setIsCreateOpen(false);
        setNewName("");
        setNewUsername("");
        setNewEmail("");
        setNewPassword("");
        setNewRole("pembeli");
        setNewProvinceCode("");
        fetchUsers();
      } else {
        toast.error(json.error || "Gagal membuat pengguna.");
      }
    } catch {
      toast.error("Terjadi masalah jaringan.");
    } finally {
      setIsCreating(false);
    }
  };

  // Open Edit User Modal
  const openEditModal = (user: UserItem) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditProvinceCode(user.defaultProvinceCode || "");
  };

  // Handle Edit User
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    // VALIDASI KEAMANAN FRONTEND: Admin tidak dapat menurunkan role akunnya sendiri
    if (editingUser.id === currentAdminId && editRole !== "admin") {
      toast.error("Peringatan: Anda tidak dapat menurunkan role akun admin Anda sendiri!");
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch("/api/v1/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingUser.id,
          name: editName,
          email: editEmail,
          role: editRole,
          defaultProvinceCode: editProvinceCode || null,
        }),
      });
      const json = await res.json();

      if (json.success) {
        toast.success(json.message || "Data pengguna berhasil diperbarui!");
        setEditingUser(null);
        fetchUsers();
      } else {
        toast.error(json.error || "Gagal memperbarui pengguna.");
      }
    } catch {
      toast.error("Terjadi masalah jaringan.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle Delete User Confirmation
  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    // VALIDASI KRITIS KEAMANAN FRONTEND: Admin tidak dapat menghapus akunnya sendiri
    if (userToDelete.id === currentAdminId) {
      toast.error("Dilarang keras menghapus akun admin yang sedang aktif digunakan!");
      setUserToDelete(null);
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/v1/admin/users?id=${userToDelete.id}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (json.success) {
        toast.success(json.message || "Pengguna berhasil dihapus!");
        setUserToDelete(null);
        fetchUsers();
      } else {
        toast.error(json.error || "Gagal menghapus pengguna.");
      }
    } catch {
      toast.error("Terjadi kegagalan jaringan saat menghapus pengguna.");
    } finally {
      setIsDeleting(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "petani":
        return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300";
      case "pedagang":
        return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300";
      case "pembeli":
        return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300";
      case "admin":
        return "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border/60 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-foreground tracking-tight">
              Manajemen Pengguna & Hak Akses (RBAC)
            </h1>
            <Badge className="bg-purple-600 text-white text-xs px-2 py-0.5">
              {users.length} User Terdaftar
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Pengelolaan akun multi-peran (Petani, Pedagang, Pembeli, Admin) dengan proteksi anti self-deletion dan log audit lengkap.
          </p>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white text-xs gap-1.5 shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          Tambah Pengguna Baru
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border/70">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Cari berdasarkan nama, username, email, role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs h-9"
          />
        </div>

        <div className="text-xs text-muted-foreground hidden sm:block">
          Akun Anda: <span className="font-semibold text-purple-600">ID #{currentAdminId.slice(0, 8)}...</span>
        </div>
      </div>

      {/* Users Table */}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Memuat data pengguna...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              Tidak ada pengguna yang sesuai dengan pencarian.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
                    <th className="py-3 px-4">Pengguna</th>
                    <th className="py-3 px-4">Kontak (Email)</th>
                    <th className="py-3 px-4">Role RBAC</th>
                    <th className="py-3 px-4">Provinsi Domisili</th>
                    <th className="py-3 px-4">Terdaftar Sejak</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredUsers.map((u) => {
                    const isSelf = u.id === currentAdminId;

                    return (
                      <tr
                        key={u.id}
                        className={`transition-colors ${
                          isSelf
                            ? "bg-purple-50/40 dark:bg-purple-950/20 hover:bg-purple-50/60"
                            : "hover:bg-muted/30"
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                              {u.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
                                {u.name}
                                {isSelf && (
                                  <Badge className="bg-purple-600 text-white text-[9px] px-1 py-0">
                                    Anda
                                  </Badge>
                                )}
                              </div>
                              <span className="text-[11px] text-muted-foreground font-mono">
                                @{u.username}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-muted-foreground">
                          {u.email}
                        </td>

                        <td className="py-3 px-4">
                          <Badge
                            variant="outline"
                            className={`capitalize text-[10px] font-bold px-2 py-0.5 border ${getRoleBadge(
                              u.role
                            )}`}
                          >
                            {u.role}
                          </Badge>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="w-3 h-3 text-emerald-600" />
                            <span>{u.provinceName || "Nasional"}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-muted-foreground font-mono text-[11px]">
                          {new Date(u.createdAt).toLocaleDateString("id-ID", {
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
                              onClick={() => openEditModal(u)}
                              className="h-8 text-xs text-purple-700 hover:text-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                              title="Edit Pengguna"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span className="hidden lg:inline ml-1">Edit</span>
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (isSelf) {
                                  toast.error("Dilarang menghapus akun Anda sendiri!");
                                  return;
                                }
                                setUserToDelete(u);
                              }}
                              disabled={isSelf}
                              className={`h-8 text-xs ${
                                isSelf
                                  ? "text-muted-foreground/40 cursor-not-allowed"
                                  : "text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                              }`}
                              title={
                                isSelf
                                  ? "Tidak dapat menghapus akun Anda sendiri"
                                  : "Hapus Pengguna"
                              }
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="hidden lg:inline ml-1">Hapus</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateUser}>
            <DialogHeader>
              <DialogTitle>Tambah Pengguna Baru</DialogTitle>
              <DialogDescription className="text-xs">
                Buat akun pengguna baru dan tentukan peran RBAC serta wilayah domisili.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3 text-sm">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Nama Lengkap
                </label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Misal: Budi Santoso"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Username
                  </label>
                  <Input
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="budisantoso"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Password
                  </label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 karakter"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Email
                </label>
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="budi@example.com"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Role Akun
                  </label>
                  <select
                    className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus:ring-2 focus:ring-purple-500 outline-none"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as "admin" | "petani" | "pedagang" | "pembeli")}
                  >
                    <option value="pembeli">Konsumen (Pembeli)</option>
                    <option value="petani">Petani (Produsen)</option>
                    <option value="pedagang">Pedagang (Distributor)</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Provinsi Domisili
                  </label>
                  <select
                    className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus:ring-2 focus:ring-purple-500 outline-none"
                    value={newProvinceCode}
                    onChange={(e) => setNewProvinceCode(e.target.value)}
                  >
                    <option value="">Nasional (Seluruh RI)</option>
                    {provinces.map((p) => (
                      <option key={p.code} value={p.code}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
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
                {isCreating ? "Menyimpan..." : "Simpan Pengguna"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleUpdateUser}>
            <DialogHeader>
              <DialogTitle>Edit Pengguna</DialogTitle>
              <DialogDescription className="text-xs">
                Perbarui nama, role RBAC, dan provinsi domisili pengguna
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3 text-sm">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Nama Lengkap
                </label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Email
                </label>
                <Input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Role Akun
                  </label>
                  <select
                    className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus:ring-2 focus:ring-purple-500 outline-none"
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as "admin" | "petani" | "pedagang" | "pembeli")}
                    disabled={editingUser?.id === currentAdminId}
                  >
                    <option value="pembeli">Konsumen (Pembeli)</option>
                    <option value="petani">Petani (Produsen)</option>
                    <option value="pedagang">Pedagang (Distributor)</option>
                    <option value="admin">Administrator</option>
                  </select>
                  {editingUser?.id === currentAdminId && (
                    <span className="text-[10px] text-amber-600 mt-1 block">
                      Role akun Anda terkunci sebagai Admin
                    </span>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Provinsi Domisili
                  </label>
                  <select
                    className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus:ring-2 focus:ring-purple-500 outline-none"
                    value={editProvinceCode}
                    onChange={(e) => setEditProvinceCode(e.target.value)}
                  >
                    <option value="">Nasional (Seluruh RI)</option>
                    {provinces.map((p) => (
                      <option key={p.code} value={p.code}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingUser(null)}
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

      {/* Delete User AlertDialog Confirmation */}
      <AlertDialog
        open={!!userToDelete}
        onOpenChange={(open) => !open && setUserToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-rose-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Hapus Pengguna Permanen?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Apakah Anda yakin ingin menghapus pengguna{" "}
              <b>{userToDelete?.name} (@{userToDelete?.username})</b>? Seluruh data pantauan watchlist, riwayat pencarian, dan preferensi akun ini akan dihapus secara permanen dari database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <Button
              onClick={confirmDeleteUser}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs"
            >
              {isDeleting ? "Menghapus..." : "Ya, Hapus Pengguna"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
