import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, ShieldCheck, Database, MapPin, Wheat } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-cream-50">
      {/* Panel Kiri - Visual Edukasi & Statistik Pasar (Visible on Desktop) */}
      <div className="relative hidden w-full lg:flex lg:w-5/12 flex-col justify-between overflow-hidden bg-gradient-to-br from-forest-900 via-forest-900 to-forest-700 p-12 text-white">
        {/* Dekorasi Aksen Lingkaran Background */}
        <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-forest-500/10 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-mint-200/10 blur-3xl" />

        {/* Brand Header */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-forest-500/20 backdrop-blur-md border border-forest-500/30 text-mint-100">
              <Wheat className="h-6 w-6 text-mint-200" />
            </div>
            <div>
              <span className="font-serif text-2xl font-bold tracking-tight text-cream-50">
                PantauPangan
              </span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-mint-100/10 text-mint-200 border border-mint-200/20">
                v2.0
              </span>
            </div>
          </Link>
          <div className="mt-2">
            <Badge
              variant="outline"
              className="border-mint-200/30 text-mint-200 bg-forest-700/40 text-[11px] font-medium"
            >
              Terintegrasi API Indonesia (Bapanas)
            </Badge>
          </div>
        </div>

        {/* Hero Narrative & Live Stats */}
        <div className="relative z-10 my-auto py-8">
          <h1 className="font-serif text-3xl font-bold leading-tight sm:text-4xl text-cream-50">
            Sistem Informasi & Analisis Harga Pangan Strategis Nasional.
          </h1>
          <p className="mt-4 text-sm text-mint-100/80 leading-relaxed max-w-md">
            Membantu Petani, Pedagang, dan Konsumen memantau tren harga komoditas
            secara transparan, akurat, dan bebas manipulasi di seluruh Indonesia.
          </p>

          {/* Grid Statistik Cakupan */}
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-mint-200 mb-1">
                <MapPin className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Cakupan</span>
              </div>
              <div className="text-2xl font-bold text-cream-50">38 Provinsi</div>
              <div className="text-xs text-mint-100/70 mt-0.5">Seluruh wilayah NKRI</div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-mint-200 mb-1">
                <Database className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Komoditas</span>
              </div>
              <div className="text-2xl font-bold text-cream-50">46+ Ragam</div>
              <div className="text-xs text-mint-100/70 mt-0.5">Pangan pokok & bumbu</div>
            </div>
          </div>

          {/* Kartu Preview Real-Time Market Card */}
          <div className="mt-6 rounded-xl border border-white/15 bg-white/10 p-4 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between text-xs text-mint-100/80 pb-2 border-b border-white/10">
              <span className="flex items-center gap-1.5 font-medium">
                <TrendingUp className="h-3.5 w-3.5 text-mint-200" />
                Preview Sinyal Pasar Nasional
              </span>
              <span className="text-[11px] bg-mint-200/20 text-mint-100 px-2 py-0.5 rounded">
                Live Sinkron
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🌾</span>
                <div>
                  <div className="font-semibold text-sm text-cream-50">Beras Premium</div>
                  <div className="text-xs text-mint-100/70">Tingkat Konsumen</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-sm text-cream-50">Rp 15.450 / kg</div>
                <div className="text-[11px] font-medium text-mint-200 flex items-center justify-end gap-0.5">
                  <span>+0.8% MoM</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Integrity Footer */}
        <div className="relative z-10 flex items-center gap-2 text-xs text-mint-100/70 border-t border-white/10 pt-4">
          <ShieldCheck className="h-4 w-4 text-mint-200" />
          <span>Sesi aman terenkripsi HttpOnly Cookie & Validasi RBAC</span>
        </div>
      </div>

      {/* Panel Kanan - Form Area */}
      <div className="flex w-full lg:w-7/12 items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
