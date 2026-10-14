import React from "react";
import Link from "next/link";
import { Wheat, ShieldCheck, Database, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-forest-900 text-cream-50 pt-16 pb-12 border-t border-forest-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-forest-700/40">
          {/* Kolom 1: Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-700 text-white border border-mint-200/20 shadow-md">
                <Wheat className="h-5 w-5 text-mint-100" />
              </div>
              <div>
                <span className="font-serif text-xl font-bold text-cream-50">
                  PantauPangan v2.0
                </span>
                <p className="text-xs text-mint-200/80">
                  Sistem Informasi & Analisis Harga Pangan Strategis Nasional
                </p>
              </div>
            </div>
            <p className="text-xs text-mint-100/70 leading-relaxed max-w-md">
              Platform agregasi harga pangan terpadu tingkat Konsumen dan Produsen
              di 38 provinsi seluruh Indonesia. Seluruh data disinkronisasikan
              langsung secara berkala dari sumber data resmi Badan Pangan
              Nasional (Bapanas) melalui integrasi API Indonesia.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <span className="inline-flex items-center gap-1.5 text-xs text-mint-200 bg-forest-700/60 border border-mint-200/20 px-2.5 py-1 rounded-lg">
                <Database className="h-3.5 w-3.5" />
                <span>Smart Delta Sync Engine</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-mint-200 bg-forest-700/60 border border-mint-200/20 px-2.5 py-1 rounded-lg">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Anti Manipulasi Data</span>
              </span>
            </div>
          </div>

          {/* Kolom 2: Navigasi Cepat */}
          <div className="space-y-3">
            <h3 className="font-semibold text-xs tracking-wider uppercase text-mint-200">
              Navigasi Halaman
            </h3>
            <ul className="space-y-2 text-xs text-mint-100/80">
              <li>
                <Link href="/" className="hover:text-cream-50 transition-colors">
                  Beranda Utama
                </Link>
              </li>
              <li>
                <Link href="/#cari" className="hover:text-cream-50 transition-colors">
                  Eksplorasi Harga Pangan
                </Link>
              </li>
              <li>
                <Link href="/#radar" className="hover:text-cream-50 transition-colors">
                  Radar Anomali IFPA / QIPA
                </Link>
              </li>
              <li>
                <Link href="/#peta" className="hover:text-cream-50 transition-colors">
                  Peta Sebaran 38 Provinsi
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-cream-50 transition-colors">
                  Portal Akun Pengguna
                </Link>
              </li>
            </ul>
          </div>

          {/* Kolom 3: Sumber Data & Lisensi */}
          <div className="space-y-3">
            <h3 className="font-semibold text-xs tracking-wider uppercase text-mint-200">
              Sumber Data Resmi
            </h3>
            <ul className="space-y-2 text-xs text-mint-100/80">
              <li>
                <a
                  href="https://use.apiindonesia.id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-cream-50 transition-colors underline"
                >
                  API Indonesia Gateway
                </a>
              </li>
              <li>
                <span className="text-white/60">
                  Data Mentah: Badan Pangan Nasional (Bapanas) RI
                </span>
              </li>
              <li>
                <span className="text-white/60">
                  Metode Deteksi Anomali: QIPA, AIPA & IFPA Index
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-mint-100/60 gap-4">
          <p>© {new Date().getFullYear()} PantauPangan. Dikembangkan untuk transparansi rantai pasok pangan Indonesia.</p>
          <div className="flex items-center gap-1">
            <span>Dibuat dengan</span>
            <Heart className="h-3.5 w-3.5 text-red-400 inline fill-red-400" />
            <span>untuk Petani, Pedagang, dan Konsumen Indonesia.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
