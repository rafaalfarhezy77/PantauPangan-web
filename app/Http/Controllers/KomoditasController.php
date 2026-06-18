<?php

namespace App\Http\Controllers;

use App\Models\HargaHarian;
use App\Models\Komoditas;
use App\Models\RiwayatUser;
use App\Services\HargaService;
use Illuminate\Http\Request;

class KomoditasController extends Controller
{
    public function __construct(protected HargaService $hargaService)
    {
    }

    /**
     * Halaman detail komoditas + grafik harga
     */
    public function detail(string $slug)
    {
        $komoditas = Komoditas::where('slug_komoditas', $slug)
            ->where('status', 'aktif')
            ->firstOrFail();

        // Harga terkini (nasional)
        $hargaTerkini = $this->hargaService->hargaTerkini($slug);

        // Data historis 30 hari (nasional) untuk chart
        $historis = $this->hargaService->historis($slug, 'Nasional', 30);

        // Perbandingan harga antar provinsi
        $perbandingan = $this->hargaService->perbandinganProvinsi($slug);

        // Rekam riwayat pencarian jika user login
        if (auth()->check()) {
            RiwayatUser::updateOrCreate(
                ['user_id' => auth()->id(), 'slug_komoditas' => $slug],
                ['waktu_pencarian' => now()]
            );
        }

        return view('komoditas.detail', compact(
            'komoditas',
            'hargaTerkini',
            'historis',
            'perbandingan'
        ));
    }
}

