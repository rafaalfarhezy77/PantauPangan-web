"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Lock,
  User,
  Mail,
  MapPin,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Briefcase,
} from "lucide-react";

interface ProvinceOption {
  code: string;
  name: string;
}

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"petani" | "pedagang" | "pembeli">("petani");
  const [defaultProvinceCode, setDefaultProvinceCode] = useState("");

  const [provincesList, setProvincesList] = useState<ProvinceOption[]>([]);
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ambil daftar provinsi untuk dropdown domisili
  useEffect(() => {
    async function fetchProvinces() {
      try {
        const res = await fetch("/api/v1/provinces");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setProvincesList(json.data);
          if (json.data.length > 0) {
            setDefaultProvinceCode((prev) => prev || json.data[0].code);
          }
        }
      } catch (err) {
        console.warn("Gagal memuat provinsi:", err);
      } finally {
        setIsLoadingProvinces(false);
      }
    }
    fetchProvinces();
  }, []);

  // Indikator kekuatan kata sandi real-time (3-bar)
  const calculatePasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: "Belum diisi", color: "bg-slate-200" };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 8 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd) || pwd.length >= 12) score += 1;

    if (score === 1) return { score: 1, label: "Lemah", color: "bg-amber-500" };
    if (score === 2) return { score: 2, label: "Sedang", color: "bg-emerald-500" };
    return { score: 3, label: "Kuat", color: "bg-forest-700" };
  };

  const strength = calculatePasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !username || !email || !password) {
      toast.error("Mohon lengkapi seluruh formulir registrasi.");
      return;
    }

    if (password.length < 6) {
      toast.error("Kata sandi minimal 6 karakter.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          username,
          email,
          password,
          role,
          defaultProvinceCode: defaultProvinceCode || null,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.error || "Gagal melakukan registrasi.");
        setIsSubmitting(false);
        return;
      }

      toast.success("Akun berhasil didaftarkan! Selamat datang di PantauPangan.");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Terjadi kendala jaringan saat registrasi.");
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border border-cream-100/80 shadow-lg shadow-forest-900/5 bg-white/90 backdrop-blur-sm rounded-2xl my-4">
      <CardHeader className="space-y-1 pb-5">
        <div className="flex items-center gap-2 text-forest-700 font-semibold text-xs tracking-wider uppercase">
          <Briefcase className="h-4 w-4" />
          <span>Registrasi Akun</span>
        </div>
        <CardTitle className="font-serif text-2xl font-bold text-forest-900">
          Buat Akun PantauPangan
        </CardTitle>
        <CardDescription className="text-slate-600 text-xs sm:text-sm">
          Dapatkan akses data harga komoditas terverifikasi dan personalisasi pantauan pasar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nama Lengkap */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-forest-700" />
              Nama Lengkap
            </label>
            <Input
              type="text"
              placeholder="Contoh: Rahmat Hidayat"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              className="bg-cream-50/50 border-cream-100 focus-visible:ring-forest-700 h-10 text-sm rounded-xl"
              required
            />
          </div>

          {/* Username & Email Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Username</label>
              <Input
                type="text"
                placeholder="rahmat_h"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isSubmitting}
                className="bg-cream-50/50 border-cream-100 focus-visible:ring-forest-700 h-10 text-sm rounded-xl"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Mail className="h-3 w-3 text-forest-700" />
                Email
              </label>
              <Input
                type="email"
                placeholder="rahmat@mail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                className="bg-cream-50/50 border-cream-100 focus-visible:ring-forest-700 h-10 text-sm rounded-xl"
                required
              />
            </div>
          </div>

          {/* Kata Sandi & 3-Bar Strength Indicator */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-forest-700" />
              Kata Sandi
            </label>
            <Input
              type="password"
              placeholder="Minimal 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              className="bg-cream-50/50 border-cream-100 focus-visible:ring-forest-700 h-10 text-sm rounded-xl"
              required
            />
            {/* 3 Bar Indikator */}
            <div className="pt-1">
              <div className="flex items-center gap-1.5 h-1.5 w-full">
                <div
                  className={`h-full flex-1 rounded-full transition-all duration-300 ${
                    strength.score >= 1 ? strength.color : "bg-slate-200"
                  }`}
                />
                <div
                  className={`h-full flex-1 rounded-full transition-all duration-300 ${
                    strength.score >= 2 ? strength.color : "bg-slate-200"
                  }`}
                />
                <div
                  className={`h-full flex-1 rounded-full transition-all duration-300 ${
                    strength.score >= 3 ? strength.color : "bg-slate-200"
                  }`}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1">
                <span>Kekuatan sandi:</span>
                <span className="font-medium text-slate-700">{strength.label}</span>
              </div>
            </div>
          </div>

          {/* Pilihan Peran Interaktif */}
          <div className="space-y-2 pt-1">
            <label className="text-xs font-semibold text-slate-700 block">
              Pilih Peran Anda di Ekosistem Pangan:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  id: "petani",
                  icon: "🌾",
                  title: "Petani",
                  desc: "Produsen",
                },
                {
                  id: "pedagang",
                  icon: "🏪",
                  title: "Pedagang",
                  desc: "Distribusi",
                },
                {
                  id: "pembeli",
                  icon: "🛒",
                  title: "Pembeli",
                  desc: "Konsumen",
                },
              ].map((item) => {
                const isSelected = role === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setRole(item.id as "petani" | "pedagang" | "pembeli")}
                    className={`relative p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                      isSelected
                        ? "border-forest-700 bg-forest-500/10 text-forest-900 shadow-sm ring-1 ring-forest-700"
                        : "border-cream-100 bg-white/70 hover:bg-cream-50 text-slate-700"
                    }`}
                  >
                    {isSelected && (
                      <CheckCircle2 className="absolute top-1.5 right-1.5 h-3.5 w-3.5 text-forest-700" />
                    )}
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-xs font-bold leading-none">{item.title}</span>
                    <span className="text-[10px] text-slate-500">{item.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dropdown Provinsi Domisili */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-forest-700" />
              Provinsi Domisili (Personalisasi Pantauan)
            </label>
            <select
              value={defaultProvinceCode}
              onChange={(e) => setDefaultProvinceCode(e.target.value)}
              disabled={isSubmitting || isLoadingProvinces}
              className="w-full bg-cream-50/50 border border-cream-100 rounded-xl h-10 px-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest-700"
            >
              {isLoadingProvinces ? (
                <option value="">Memuat 38 provinsi...</option>
              ) : (
                provincesList.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Tombol Submit */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 bg-forest-700 hover:bg-forest-900 text-white font-medium rounded-xl transition-all shadow-md shadow-forest-900/10 gap-2 mt-4"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Mendaftarkan Akun...</span>
              </>
            ) : (
              <>
                <span>Daftar Akun Sekarang</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        <div className="mt-5 pt-3 border-t border-cream-100 text-center text-xs text-slate-600">
          Sudah memiliki akun terdaftar?{" "}
          <Link
            href="/login"
            className="font-semibold text-forest-700 hover:text-forest-900 hover:underline"
          >
            Masuk ke Portal
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
