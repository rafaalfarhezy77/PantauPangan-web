"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Wheat,
  RefreshCw,
  Package,
  Users,
  Newspaper,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AdminUserProps {
  id: string;
  name: string;
  username: string;
  email: string;
}

export function AdminNav({ user }: { user: AdminUserProps }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        toast.success("Berhasil keluar dari sesi admin.");
        router.push("/login");
        router.refresh();
      }
    } catch {
      toast.error("Gagal logout.");
    }
  };

  const menuItems = [
    {
      href: "/admin/sync",
      label: "Sync Control Center",
      icon: RefreshCw,
      badge: "API Indonesia",
    },
    {
      href: "/admin/komoditas",
      label: "Master Komoditas",
      icon: Package,
    },
    {
      href: "/admin/users",
      label: "Manajemen Pengguna",
      icon: Users,
    },
    {
      href: "/admin/berita",
      label: "CMS Berita Pangan",
      icon: Newspaper,
    },
  ];

  return (
    <aside className="w-full md:w-64 bg-slate-900 text-white shrink-0 md:min-h-screen flex flex-col justify-between border-r border-slate-800">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800">
          <Link href="/admin/sync" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-md shadow-purple-600/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight block">
                Pantau<span className="text-purple-400">Pangan</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-purple-300 block -mt-0.5">
                Admin Center
              </span>
            </div>
          </Link>

          {/* Current Admin Tag */}
          <div className="mt-4 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
            <div className="truncate">
              <div className="text-xs font-semibold text-slate-200 truncate">{user.name}</div>
              <div className="text-[10px] text-slate-400 truncate">@{user.username}</div>
            </div>
            <Badge className="bg-purple-900/80 text-purple-300 border-purple-700 text-[10px] px-2 py-0 uppercase font-mono">
              Admin
            </Badge>
          </div>
        </div>

        {/* Navigation Menus */}
        <div className="p-4 space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-3 py-1.5 block">
            Menu Administrasi
          </span>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-purple-600 text-white font-semibold shadow-xs"
                    : "text-slate-300 hover:text-white hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 font-mono">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer Quick Links & Logout */}
      <div className="p-4 border-t border-slate-800 space-y-1.5">
        <Link
          href="/dashboard"
          className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-3.5 h-3.5 text-emerald-400" />
            <span>Workspace User</span>
          </div>
          <ChevronRight className="w-3 h-3 text-slate-600" />
        </Link>

        <Link
          href="/"
          className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Wheat className="w-3.5 h-3.5 text-amber-400" />
            <span>Beranda Publik</span>
          </div>
          <ExternalLink className="w-3 h-3 text-slate-600" />
        </Link>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors font-medium mt-2"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Keluar Sesi Admin</span>
        </button>
      </div>
    </aside>
  );
}
