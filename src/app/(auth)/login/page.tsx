"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, User, ArrowRight, Loader2, Sparkles } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      toast.error("Mohon isi username/email dan kata sandi.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(
          data.error || "Gagal masuk. Periksa kembali kredensial Anda."
        );
        setIsLoading(false);
        return;
      }

      toast.success(`Selamat datang kembali, ${data.user.name}!`);

      if (data.user.role === "admin" && callbackUrl === "/dashboard") {
        router.push("/admin/sync");
      } else {
        router.push(callbackUrl);
      }
      router.refresh();
    } catch {
      toast.error("Terjadi kesalahan jaringan. Silakan coba lagi.");
      setIsLoading(false);
    }
  };

  return (
    <Card className="border border-cream-100/80 shadow-lg shadow-forest-900/5 bg-white/90 backdrop-blur-sm rounded-2xl">
      <CardHeader className="space-y-1 pb-6">
        <div className="flex items-center gap-2 text-forest-700 font-semibold text-xs tracking-wider uppercase">
          <Sparkles className="h-4 w-4" />
          <span>Akses Portal</span>
        </div>
        <CardTitle className="font-serif text-2xl font-bold text-forest-900">
          Masuk ke Akun Anda
        </CardTitle>
        <CardDescription className="text-slate-600 text-sm">
          Pantau harga komoditas pangan terkini dengan akurasi data API
          Indonesia.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-forest-700" />
              Username atau Email
            </label>
            <Input
              type="text"
              placeholder="Contoh: budi_santoso atau budi@example.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              disabled={isLoading}
              className="bg-cream-50/50 border-cream-100 focus-visible:ring-forest-700 h-11 text-sm rounded-xl"
              required
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-forest-700" />
                Kata Sandi
              </label>
            </div>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="bg-cream-50/50 border-cream-100 focus-visible:ring-forest-700 h-11 text-sm rounded-xl"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 bg-forest-700 hover:bg-forest-900 text-white font-medium rounded-xl transition-all shadow-md shadow-forest-900/10 gap-2 mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Memverifikasi...</span>
              </>
            ) : (
              <>
                <span>Masuk Sekarang</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-cream-100 text-center text-xs text-slate-600">
          Belum memiliki akun PantauPangan?{" "}
          <Link
            href="/register"
            className="font-semibold text-forest-700 hover:text-forest-900 hover:underline"
          >
            Daftar Akun Baru
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Card className="border border-cream-100/80 shadow-lg p-8 text-center text-slate-500 rounded-2xl bg-white/90">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-forest-700 mb-2" />
          <p className="text-sm">Memuat form login...</p>
        </Card>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
