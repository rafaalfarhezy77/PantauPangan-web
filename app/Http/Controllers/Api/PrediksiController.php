<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HargaHarian;
use App\Services\ProphetService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PrediksiController extends Controller
{
    public function __construct(protected ProphetService $prophetService)
    {
    }

    /**
     * GET /api/v1/prediksi
     * Prediksi harga komoditas menggunakan algoritma Prophet (lokal, tanpa microservice).
     * Fallback ke regresi linear jika Prophet gagal.
     *
     * Query params:
     *   - slug_komoditas (required)
     *   - provinsi       (optional, default: 'Nasional')
     *   - days           (optional, default: 30)
     *   - force_refresh  (optional, default: false) — paksa hitung ulang, abaikan cache
     */
    public function index(Request $request)
    {
        $slug         = $request->input('slug_komoditas') ?? $request->input('slug');
        $wilayah      = $request->input('provinsi') ?? $request->input('wilayah', 'Nasional');
        $days         = (int) ($request->input('days') ?? $request->input('hari', 30));
        $forceRefresh = filter_var($request->input('force_refresh', false), FILTER_VALIDATE_BOOLEAN);

        if (!$slug) {
            return response()->json(['error' => 'Parameter slug_komoditas wajib diisi.'], 422);
        }

        // Batasi jumlah hari prediksi agar tidak terlalu lama
        $days = max(1, min($days, 365));

        // Jika force_refresh, buang cache lama sebelum prediksi
        if ($forceRefresh) {
            $this->prophetService->forgetCache($slug, $wilayah, $days);
            Log::info('PrediksiController: force_refresh diminta', compact('slug', 'wilayah', 'days'));
        }

        try {
            $startTime = microtime(true);

            $result = $this->prophetService->predict(
                komoditas: $slug,
                provinsi:  $wilayah,
                days:      $days,
            );

            $elapsed    = round((microtime(true) - $startTime) * 1000); // ms
            $fromCache  = isset($result['cached_at']) && $elapsed < 200;  // < 200ms → hampir pasti dari cache

            return response()
                ->json($result)
                ->header('X-Cache-Status', $fromCache ? 'HIT' : 'MISS')
                ->header('X-Response-Time-Ms', $elapsed);

        } catch (\Exception $e) {
            Log::warning('Prophet gagal, menggunakan fallback linear: ' . $e->getMessage());
            return $this->linearFallback($slug, $wilayah, $days);
        }
    }

    /**
     * Fallback: prediksi sederhana dari data historis DB dengan regresi linear.
     * Digunakan ketika script Python Prophet gagal dijalankan.
     */
    private function linearFallback(string $slug, string $wilayah, int $days)
    {
        // Coba cari data di wilayah yang diminta, lalu fallback ke Nasional
        $rows = HargaHarian::where('slug_komoditas', $slug)
            ->where('provinsi', $wilayah)
            ->orderBy('tanggal')
            ->limit(90)
            ->get(['tanggal', 'harga']);

        if ($rows->count() < 3 && $wilayah !== 'Nasional') {
            $rows = HargaHarian::where('slug_komoditas', $slug)
                ->where('provinsi', 'Nasional')
                ->orderBy('tanggal')
                ->limit(90)
                ->get(['tanggal', 'harga']);
        }

        if ($rows->count() < 2) {
            return response()->json(['error' => 'Data historis tidak tersedia untuk komoditas ini.'], 404);
        }

        $historis = $rows->map(fn($r) => ['tanggal' => $r->tanggal, 'harga' => (int) $r->harga])->values()->all();

        // Regresi linear sederhana
        $n      = count($historis);
        $xMean  = ($n - 1) / 2;
        $yMean  = collect($historis)->avg('harga');
        $num    = 0;
        $den    = 0;

        foreach ($historis as $i => $h) {
            $num += ($i - $xMean) * ($h['harga'] - $yMean);
            $den += ($i - $xMean) ** 2;
        }

        $slope     = $den > 0 ? $num / $den : 0;
        $intercept = $yMean - $slope * $xMean;

        $lastHarga   = end($historis)['harga'];
        $lastTanggal = end($historis)['tanggal'];

        $prediksi = [];
        for ($i = 1; $i <= $days; $i++) {
            $harga       = (int) round($intercept + $slope * ($n - 1 + $i));
            $harga       = max($harga, 0);
            $tanggal     = date('Y-m-d', strtotime($lastTanggal . " +{$i} days"));
            $prediksi[]  = ['tanggal' => $tanggal, 'harga' => $harga];
        }

        return response()->json([
            'historis'  => $historis,
            'prediksi'  => $prediksi,
            'algoritma' => 'linear_regression_fallback',
            'wilayah'   => $wilayah,
            'slug'      => $slug,
        ]);
    }
}
