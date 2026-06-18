<?php

namespace App\Services;

use App\Models\HargaHarian;
use App\Models\Komoditas;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class HargaService
{
    /**
     * Ambil harga terkini untuk sebuah komoditas di provinsi tertentu
     */
    public function hargaTerkini(string $slug, string $provinsi = 'Nasional'): ?array
    {
        $terkini = HargaHarian::where('slug_komoditas', $slug)
            ->where('provinsi', $provinsi)
            ->orderBy('tanggal', 'desc')
            ->first();

        if (!$terkini) return null;

        $kemarin = HargaHarian::where('slug_komoditas', $slug)
            ->where('provinsi', $provinsi)
            ->orderBy('tanggal', 'desc')
            ->skip(1)
            ->first();

        $harga    = $terkini->harga;
        $hargaH1  = $kemarin?->harga ?? $harga;
        $change   = $hargaH1 > 0 ? round((($harga - $hargaH1) / $hargaH1) * 100, 2) : 0;

        return [
            'harga'     => $harga,
            'tanggal'   => $terkini->tanggal,
            'provinsi'  => $provinsi,
            'perubahan' => $change,
            'naik'      => $change >= 0,
        ];
    }

    /**
     * Ambil data historis harga (untuk chart) selama N hari terakhir
     *
     * @param  string  $slug
     * @param  string  $provinsi
     * @param  int     $days    Jumlah hari ke belakang
     * @return Collection  [['tanggal' => ..., 'harga' => ...], ...]
     */
    public function historis(string $slug, string $provinsi = 'Nasional', int $days = 30): Collection
    {
        return HargaHarian::where('slug_komoditas', $slug)
            ->where('provinsi', $provinsi)
            ->where('tanggal', '>=', now()->subDays($days)->toDateString())
            ->orderBy('tanggal')
            ->get(['tanggal', 'harga']);
    }

    /**
     * Bandingkan harga satu komoditas di semua provinsi pada tanggal terkini
     */
    public function perbandinganProvinsi(string $slug): Collection
    {
        $tanggalTerkini = HargaHarian::where('slug_komoditas', $slug)->max('tanggal');

        if (!$tanggalTerkini) return collect();

        return HargaHarian::where('slug_komoditas', $slug)
            ->where('tanggal', $tanggalTerkini)
            ->orderBy('harga', 'desc')
            ->get(['provinsi', 'harga', 'tanggal']);
    }

    /**
     * Ambil harga rata-rata nasional untuk setiap komoditas aktif (snapshot terakhir)
     * Berguna untuk beranda/dashboard
     */
    public function snapshotSemua(): Collection
    {
        return Komoditas::where('status', 'aktif')
            ->get()
            ->map(function (Komoditas $k) {
                $terkini = $this->hargaTerkini($k->slug_komoditas);

                return [
                    'slug'      => $k->slug_komoditas,
                    'nama'      => $k->nama_komoditas,
                    'icon'      => $k->icon,
                    'kategori'  => $k->kategori,
                    'harga'     => $terkini['harga'] ?? null,
                    'tanggal'   => $terkini['tanggal'] ?? null,
                    'perubahan' => $terkini['perubahan'] ?? 0,
                    'naik'      => $terkini['naik'] ?? true,
                ];
            });
    }
}
