"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Wheat,
  Search,
  LogOut,
  LayoutDashboard,
  Shield,
  Menu,
  X,
} from "lucide-react";
import { CommandSearchModal } from "./CommandSearchModal";

interface SessionData {
  id: string;
  name: string;
  username: string;
  email: string;
  role: "admin" | "petani" | "pedagang" | "pembeli";
}

export function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<SessionData | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.user) {
            setUser(json.user);
          }
        }
      } catch {
        setUser(null);
      }
    }
    checkAuth();
  }, []);

  // Keyboard shortcut Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      toast.success("Anda berhasil keluar dari sistem");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Gagal melakukan logout");
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "petani":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "pedagang":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-sky-100 text-sky-800 border-sky-200";
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-cream-100/90 bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Brand Logo */}
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest-700 text-white shadow-sm shadow-forest-900/10">
                <Wheat className="h-5 w-5 text-mint-100" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-lg font-bold text-forest-900 leading-tight">
                  PantauPangan
                </span>
                <span className="text-[10px] text-slate-500 font-medium tracking-tight">
                  Harga Pangan Nasional
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-700">
              <Link
                href="/"
                className="hover:text-forest-700 transition-colors py-1"
              >
                Beranda
              </Link>
              <Link
                href="/#cari"
                className="hover:text-forest-700 transition-colors py-1"
              >
                Eksplorasi Harga
              </Link>
              <Link
                href="/#radar"
                className="hover:text-forest-700 transition-colors py-1"
              >
                Radar Anomali
              </Link>
              <Link
                href="/#peta"
                className="hover:text-forest-700 transition-colors py-1"
              >
                Peta 38 Provinsi
              </Link>
            </nav>

            {/* Right Action Area */}
            <div className="flex items-center gap-2.5">
              {/* Cmd+K Search Trigger */}
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="hidden sm:flex items-center gap-2 bg-cream-50 hover:bg-cream-100/80 text-slate-500 border border-cream-100 text-xs px-3 py-1.5 rounded-xl transition-all"
              >
                <Search className="h-3.5 w-3.5 text-slate-400" />
                <span>Cari komoditas...</span>
                <kbd className="ml-1 text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-400 font-mono">
                  ⌘K
                </kbd>
              </button>

              {/* User Auth Profile / Login Button */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full border border-cream-100 bg-cream-50/70 hover:bg-cream-100 transition-all text-xs cursor-pointer">
                    <div className="h-7 w-7 rounded-full bg-forest-700 text-white flex items-center justify-center font-bold text-xs">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left hidden sm:block">
                      <div className="font-semibold text-slate-800 leading-tight">
                        {user.name}
                      </div>
                      <span
                        className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold border uppercase ${getRoleBadge(
                          user.role
                        )}`}
                      >
                        {user.role}
                      </span>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 rounded-xl p-1.5 bg-white shadow-lg border border-cream-100">
                    <div className="px-2 py-1.5 border-b border-slate-100 mb-1">
                      <p className="text-xs font-semibold text-slate-900">{user.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    </div>

                    {user.role === "admin" && (
                      <DropdownMenuItem
                        onClick={() => router.push("/admin/sync")}
                        className="cursor-pointer text-xs flex items-center gap-2 text-purple-700 p-2 rounded-lg hover:bg-purple-50"
                      >
                        <Shield className="h-3.5 w-3.5" />
                        <span>Admin Smart Sync</span>
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuItem
                      onClick={() => router.push("/dashboard")}
                      className="cursor-pointer text-xs flex items-center gap-2 p-2 rounded-lg hover:bg-cream-50"
                    >
                      <LayoutDashboard className="h-3.5 w-3.5 text-forest-700" />
                      <span>Dashboard Saya</span>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="my-1 border-t border-slate-100" />

                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="cursor-pointer text-xs flex items-center gap-2 text-red-600 hover:bg-red-50 p-2 rounded-lg"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Keluar (Logout)</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center text-xs h-9 px-3 text-slate-700 hover:text-forest-900 hover:bg-cream-50 rounded-lg transition-colors font-medium"
                  >
                    Masuk
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center text-xs h-9 px-3.5 bg-forest-700 hover:bg-forest-900 text-white rounded-xl shadow-sm transition-colors font-medium"
                  >
                    Daftar
                  </Link>
                </div>
              )}

              {/* Mobile menu toggle */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-cream-50"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-cream-100 bg-white px-4 pt-2 pb-4 space-y-2">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-slate-800 hover:text-forest-700"
            >
              Beranda
            </Link>
            <Link
              href="/#cari"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-slate-800 hover:text-forest-700"
            >
              Eksplorasi Harga
            </Link>
            <Link
              href="/#radar"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-slate-800 hover:text-forest-700"
            >
              Radar Anomali
            </Link>
            <Link
              href="/#peta"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-slate-800 hover:text-forest-700"
            >
              Peta 38 Provinsi
            </Link>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsSearchOpen(true);
              }}
              className="w-full flex items-center gap-2 bg-cream-50 text-slate-600 text-xs px-3 py-2 rounded-xl mt-2"
            >
              <Search className="h-4 w-4 text-slate-400" />
              <span>Cari komoditas pangan...</span>
            </button>
          </div>
        )}
      </header>

      {/* Command Search Modal Dialog */}
      <CommandSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
}
