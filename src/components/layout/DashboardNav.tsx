"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import {
  Wheat,
  LayoutDashboard,
  ShieldCheck,
  LogOut,
  ChevronDown,
  TrendingUp,
  MapPin,
  Home,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SessionUserProps {
  id: string;
  name: string;
  username: string;
  email: string;
  role: "admin" | "petani" | "pedagang" | "pembeli";
  defaultProvinceCode: string | null;
}

export function DashboardNav({ user }: { user: SessionUserProps }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        toast.success("Berhasil keluar dari sesi akun.");
        router.push("/login");
        router.refresh();
      } else {
        toast.error("Gagal melakukan proses keluar.");
      }
    } catch {
      toast.error("Terjadi gangguan jaringan saat logout.");
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "petani":
        return {
          label: "Petani 🌾",
          className: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300",
        };
      case "pedagang":
        return {
          label: "Pedagang 🛒",
          className: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300",
        };
      case "pembeli":
        return {
          label: "Konsumen 🏠",
          className: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300",
        };
      case "admin":
        return {
          label: "Admin 🛡️",
          className: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300",
        };
      default:
        return { label: role, className: "bg-muted text-muted-foreground" };
    }
  };

  const roleInfo = getRoleBadge(user.role);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Left Navigation */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-lg text-emerald-700 dark:text-emerald-400 group">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-600/30 group-hover:scale-105 transition-transform">
              <Wheat className="w-5 h-5" />
            </div>
            <span className="tracking-tight text-foreground group-hover:text-emerald-700 transition-colors">
              Pantau<span className="text-emerald-600 dark:text-emerald-400">Pangan</span>
            </span>
          </Link>

          <Badge variant="outline" className={`hidden sm:inline-flex text-xs font-semibold px-2.5 py-0.5 border ${roleInfo.className}`}>
            {roleInfo.label}
          </Badge>

          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <Link
              href="/dashboard"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                pathname === "/dashboard"
                  ? "bg-emerald-50 text-emerald-700 font-semibold dark:bg-emerald-950/60 dark:text-emerald-300"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Workspace
            </Link>
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              <Home className="w-4 h-4" />
              Eksplorasi Publik
            </Link>
            {user.role === "admin" && (
              <Link
                href="/admin/sync"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  pathname.startsWith("/admin")
                    ? "bg-purple-50 text-purple-700 font-semibold dark:bg-purple-950/60 dark:text-purple-300"
                    : "text-purple-600 hover:text-purple-800 hover:bg-purple-50/60 dark:text-purple-400"
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                Panel Admin
              </Link>
            )}
          </nav>
        </div>

        {/* Right Nav: Province, User Menu */}
        <div className="flex items-center gap-3">
          {user.defaultProvinceCode && (
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full border border-border/50">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>Prov. #{user.defaultProvinceCode}</span>
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full hover:bg-muted cursor-pointer outline-none">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-semibold text-xs flex items-center justify-center">
                {user.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-semibold leading-tight text-foreground">{user.name}</div>
                <div className="text-[10px] text-muted-foreground leading-tight capitalize">@{user.username}</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-0.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-1.5">
              <DropdownMenuLabel className="font-normal px-2 py-1.5">
                <div className="text-sm font-semibold text-foreground">{user.name}</div>
                <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                <div className="mt-1">
                  <Badge variant="outline" className={`text-[10px] uppercase font-bold tracking-wider ${roleInfo.className}`}>
                    {user.role}
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                <LayoutDashboard className="w-4 h-4 mr-2 text-muted-foreground" />
                <span>Dashboard Saya</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/")}>
                <TrendingUp className="w-4 h-4 mr-2 text-muted-foreground" />
                <span>Eksplorasi Harga Publik</span>
              </DropdownMenuItem>
              {user.role === "admin" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/admin/sync")}>
                    <ShieldCheck className="w-4 h-4 mr-2 text-purple-600" />
                    <span>Control Center Admin</span>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/40">
                <LogOut className="w-4 h-4 mr-2" />
                <span>Keluar Akun</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
