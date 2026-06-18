<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Komoditas;
use App\Models\HargaHarian;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class KomoditasController extends Controller
{
    /**
     * GET /api/v1/komoditas
     * Daftar semua komoditas aktif beserta harga terkini
     */
    public function index(Request $request)
    {
        $query = Komoditas::where('status', 'aktif');

        if ($request->has('kategori')) {
            $query->where('kategori', $request->kategori);
        }

        if ($request->has('q')) {
            $query->where('nama_komoditas', 'like', '%' . $request->q . '%');
        }

        $komoditas = $query->orderBy('nama_komoditas')->get();

        // Ambil harga terkini untuk tiap komoditas (nasional / rata-rata)
        $result = $komoditas->map(function ($k) {
            $latestDate = HargaHarian::where('slug_komoditas', $k->slug_komoditas)->max('tanggal');

            if (!$latestDate) {
                return [
                    'slug'          => $k->slug_komoditas,
                    'nama'          => $k->nama_komoditas,
                    'kategori'      => $k->kategori,
                    'icon'          => $k->icon,
                    'harga_terkini' => 0,
                    'tanggal'       => null,
                    'perubahan'     => 0,
                    'naik'          => false,
                ];
            }

            // Hitung rata-rata harga di tanggal terbaru (sebagai representasi Nasional)
            $hargaTerkiniAvg = HargaHarian::where('slug_komoditas', $k->slug_komoditas)
                ->where('tanggal', $latestDate)
                ->avg('harga');

            // Hitung rata-rata harga di tanggal sebelumnya yang ada datanya
            $prevDate = HargaHarian::where('slug_komoditas', $k->slug_komoditas)
                ->where('tanggal', '<', $latestDate)
                ->max('tanggal');

            $hargaKemarinAvg = $prevDate
                ? HargaHarian::where('slug_komoditas', $k->slug_komoditas)
                    ->where('tanggal', $prevDate)
                    ->avg('harga')
                : $hargaTerkiniAvg;

            $harga   = round($hargaTerkiniAvg);
            $hargaH1 = round($hargaKemarinAvg);
            $change  = $hargaH1 > 0 ? round((($harga - $hargaH1) / $hargaH1) * 100, 2) : 0;

            return [
                'slug'          => $k->slug_komoditas,
                'nama'          => $k->nama_komoditas,
                'kategori'      => $k->kategori,
                'icon'          => $k->icon,
                'harga_terkini' => $harga,
                'tanggal'       => $latestDate,
                'perubahan'     => $change,
                'naik'          => $change >= 0,
            ];
        });

        return response()->json([
            'status' => 'success',
            'total'  => $result->count(),
            'data'   => $result,
        ]);
    }

    /**
     * GET /api/v1/komoditas/{slug}
     * Detail satu komoditas
     */
    public function show(string $slug)
    {
        $komoditas = Komoditas::where('slug_komoditas', $slug)->firstOrFail();

        return response()->json([
            'status' => 'success',
            'data'   => $komoditas,
        ]);
    }
}
