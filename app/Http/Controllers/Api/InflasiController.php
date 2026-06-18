<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HargaHarian;
use App\Services\ProphetService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class InflasiController extends Controller
{
    public function __construct(protected ProphetService $prophetService)
    {
    }

    /**
     * GET /api/v1/inflasi
     * Prediksi inflasi harga komoditas
     *
     * Query params:
     *   - slug          (required)  slug komoditas
     *   - wilayah       (optional)  provinsi/kab-kota, default 'Nasional'
     *   - hari          (optional)  jumlah hari prediksi, default 30
     *   - faktor_raya   (optional)  boolean string 'true'/'false'
     *   - faktor_cuaca  (optional)  boolean string
     *   - faktor_bbm    (optional)  boolean string
     */
    public function index(Request $request)
    {
        $slug        = $request->input('slug');
        $wilayah     = $request->input('wilayah', 'Nasional');
        $hari        = (int) $request->input('hari', 30);
        $faktorRaya  = filter_var($request->input('faktor_raya',  'false'), FILTER_VALIDATE_BOOLEAN);
        $faktorCuaca = filter_var($request->input('faktor_cuaca', 'false'), FILTER_VALIDATE_BOOLEAN);
        $faktorBBM   = filter_var($request->input('faktor_bbm',   'false'), FILTER_VALIDATE_BOOLEAN);

        if (!$slug) {
            return response()->json(['error' => 'Parameter slug wajib diisi.'], 422);
        }

        try {
            // Gunakan prophet untuk mendapat prediksi dasar
            $prediksi = $this->prophetService->predict(
                komoditas: $slug,
                provinsi:  $wilayah,
                days:      $hari,
            );

            // Hitung inflasi berdasarkan data prediksi yang dikembalikan prophet
            $hargaAwal = $prediksi['historis'][count($prediksi['historis']) - 1]['harga'] ?? 0;
            $hargaAkhir = $prediksi['prediksi'][count($prediksi['prediksi']) - 1]['harga'] ?? $hargaAwal;

            $baseInflasi = $hargaAwal > 0
                ? round((($hargaAkhir - $hargaAwal) / $hargaAwal) * 100, 2)
                : 0;

            // Multiplier faktor eksternal
            $multiplierRaya  = $faktorRaya  ? 1.15 : 1.0;
            $multiplierCuaca = $faktorCuaca ? 1.08 : 1.0;
            $multiplierBBM   = $faktorBBM   ? 1.05 : 1.0;
            $multiplierTotal = $multiplierRaya * $multiplierCuaca * $multiplierBBM;

            $totalInflasi = round($baseInflasi * $multiplierTotal, 2);
            $hargaAkhirFinal = round($hargaAwal * (1 + $totalInflasi / 100));

            // Hitung kontribusi tiap faktor
            $musiman  = round($baseInflasi, 2);
            $raya     = $faktorRaya  ? round($baseInflasi * ($multiplierRaya  - 1), 2) : 0;
            $cuaca    = $faktorCuaca ? round($baseInflasi * ($multiplierCuaca - 1), 2) : 0;
            $bbm      = $faktorBBM   ? round($baseInflasi * ($multiplierBBM   - 1), 2) : 0;

            // Buat data historis agregat mingguan (4 minggu terakhir)
            $historisAgregat = collect($prediksi['historis'])
                ->reverse()
                ->take(28)
                ->reverse()
                ->chunk(7)
                ->map(function ($chunk, $i) use ($hargaAwal) {
                    $avg   = $chunk->avg('harga');
                    $pct   = $hargaAwal > 0 ? round((($avg - $hargaAwal) / $hargaAwal) * 100, 2) : 0;
                    $first = $chunk->first()['tanggal'] ?? '';
                    return ['label' => "Mgg-" . ($i + 1) . " ({$first})", 'pct' => $pct];
                })
                ->values();

            return response()->json([
                'slug'                  => $slug,
                'wilayah'               => $wilayah,
                'hari_prediksi'         => $hari,
                'harga_awal'            => (int) $hargaAwal,
                'harga_akhir_prediksi'  => (int) $hargaAkhirFinal,
                'total_inflasi_pct'     => $totalInflasi,
                'confidence'            => 80,
                'algoritma'             => $prediksi['algoritma'] ?? 'prophet',
                'faktor_aktif'          => [
                    'hari_raya' => $faktorRaya,
                    'cuaca'     => $faktorCuaca,
                    'bbm'       => $faktorBBM,
                ],
                'kontribusi' => [
                    'musiman'  => $musiman,
                    'hari_raya'=> $raya,
                    'cuaca'    => $cuaca,
                    'bbm'      => $bbm,
                ],
                'historis_agregat'      => $historisAgregat,
                'prediksi'              => $prediksi['prediksi'],
            ]);
        } catch (\Exception $e) {
            Log::error('InflasiController: ' . $e->getMessage());

            // Fallback — simulasikan data jika Prophet tidak tersedia
            return $this->fallbackInflasi($slug, $wilayah, $hari, $faktorRaya, $faktorCuaca, $faktorBBM);
        }
    }

    /**
     * Fallback jika microservice Prophet tidak tersedia.
     * Hitung inflasi dari data historis yang ada di DB.
     */
    private function fallbackInflasi(string $slug, string $wilayah, int $hari, bool $raya, bool $cuaca, bool $bbm)
    {
        // Cari data historis dari DB
        $rows = HargaHarian::where('slug_komoditas', $slug)
            ->where('provinsi', $wilayah)
            ->orderBy('tanggal', 'desc')
            ->limit(60)
            ->get(['tanggal', 'harga'])
            ->reverse()
            ->values();

        if ($rows->count() < 2) {
            // Coba nasional sebagai fallback
            $rows = HargaHarian::where('slug_komoditas', $slug)
                ->where('provinsi', 'Nasional')
                ->orderBy('tanggal', 'desc')
                ->limit(60)
                ->get(['tanggal', 'harga'])
                ->reverse()
                ->values();
        }

        if ($rows->count() < 2) {
            return response()->json(['error' => 'Data historis tidak tersedia untuk komoditas ini.'], 404);
        }

        $hargaAwal   = $rows->first()['harga'];
        $hargaAkhir  = $rows->last()['harga'];
        $baseInflasi = $hargaAwal > 0
            ? round((($hargaAkhir - $hargaAwal) / $hargaAwal) * 100, 2)
            : 0;

        // Proyeksikan inflasi ke depan secara linear
        $dailyRate   = $rows->count() > 1 ? ($hargaAkhir - $hargaAwal) / ($rows->count() - 1) : 0;
        $projeksiAkhir = $hargaAkhir + ($dailyRate * $hari);

        $mulitplierRaya  = $raya  ? 1.15 : 1.0;
        $multiplierCuaca = $cuaca ? 1.08 : 1.0;
        $multiplierBBM   = $bbm   ? 1.05 : 1.0;
        $multiplierTotal = $mulitplierRaya * $multiplierCuaca * $multiplierBBM;

        $totalInflasi    = round($baseInflasi * $multiplierTotal, 2);
        $hargaAkhirFinal = round($hargaAkhir * (1 + ($totalInflasi - $baseInflasi) / 100));

        $historisAgregat = $rows->chunk(7)->map(function ($chunk, $i) use ($hargaAwal) {
            $avg = $chunk->avg('harga');
            $pct = $hargaAwal > 0 ? round((($avg - $hargaAwal) / $hargaAwal) * 100, 2) : 0;
            $first = $chunk->first()['tanggal'] ?? '';
            return ['label' => "Mgg-" . ($i + 1) . " ({$first})", 'pct' => $pct];
        })->values();

        return response()->json([
            'slug'                 => $slug,
            'wilayah'              => $wilayah,
            'hari_prediksi'        => $hari,
            'harga_awal'           => (int) $hargaAkhir,
            'harga_akhir_prediksi' => (int) $hargaAkhirFinal,
            'total_inflasi_pct'    => $totalInflasi,
            'confidence'           => 65,
            'algoritma'            => 'linear_fallback',
            'faktor_aktif'         => ['hari_raya' => $raya, 'cuaca' => $cuaca, 'bbm' => $bbm],
            'kontribusi'           => [
                'musiman'   => $baseInflasi,
                'hari_raya' => $raya  ? round($baseInflasi * 0.15, 2) : 0,
                'cuaca'     => $cuaca ? round($baseInflasi * 0.08, 2) : 0,
                'bbm'       => $bbm   ? round($baseInflasi * 0.05, 2) : 0,
            ],
            'historis_agregat' => $historisAgregat,
            'prediksi'         => [],
        ]);
    }
}
