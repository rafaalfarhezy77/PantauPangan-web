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
     * Proxy ke Python Flask Prophet microservice, dengan fallback linear regression
     *
     * Query params:
     *   - slug_komoditas (required)
     *   - provinsi       (optional, default: 'Nasional')
     *   - days           (optional, default: 30)
     */
    public function index(Request $request)
    {
        $slug    = $request->input('slug_komoditas') ?? $request->input('slug');
        $wilayah = $request->input('provinsi') ?? $request->input('wilayah', 'Nasional');
        $days    = (int) ($request->input('days') ?? $request->input('hari', 30));

        if (!$slug) {
            return response()->json(['error' => 'Parameter slug_komoditas wajib diisi.'], 422);
        }

        try {
            $result = $this->prophetService->predict(
                komoditas: $slug,
                provinsi:  $wilayah,
                days:      $days,
            );

            return response()->json($result);
        } catch (\Exception $e) {
            Log::warning('Prophet tidak tersedia, menggunakan fallback linear: ' . $e->getMessage());

            return $this->linearFallback($slug, $wilayah, $days);
        }
    }

    /**
     * Fallback: hitung prediksi sederhana dari data historis DB dengan regresi linear.
     */
    private function linearFallback(string $slug, string $wilayah, int $days)
    {
        // Coba cari data di wilayah yang diminta, lalu fallback ke Nasional
        $rows = HargaHarian::where('slug_komoditas', $slug)
            ->where('provinsi', $wilayah)
            ->orderBy('tanggal')
            ->limit(90)
            ->get(['tanggal', 'harga']);

        if ($rows->count() < 3) {
            $rows = HargaHarian::where('slug_komoditas', $slug)
                ->where('provinsi', 'Nasional')
                ->orderBy('tanggal')
                ->limit(90)
                ->get(['tanggal', 'harga']);
        }

        if ($rows->count() < 2) {
            return response()->json(['error' => 'Data historis tidak tersedia untuk komoditas ini.'], 404);
        }

        $historis = $rows->map(fn($r) => ['tanggal' => $r->tanggal, 'harga' => (int)$r->harga])->values()->all();

        // Regresi linear sederhana
        $n      = count($historis);
        $xMean  = ($n - 1) / 2;
        $yMean  = collect($historis)->avg('harga');
        $num    = 0; $den = 0;
        foreach ($historis as $i => $h) {
            $num += ($i - $xMean) * ($h['harga'] - $yMean);
            $den += ($i - $xMean) ** 2;
        }
        $slope = $den > 0 ? $num / $den : 0;
        $intercept = $yMean - $slope * $xMean;

        $lastHarga  = end($historis)['harga'];
        $lastTanggal = end($historis)['tanggal'];

        $prediksi = [];
        for ($i = 1; $i <= $days; $i++) {
            $harga = (int) round($intercept + $slope * ($n - 1 + $i));
            $harga = max($harga, 0);
            $tanggal = date('Y-m-d', strtotime($lastTanggal . " +{$i} days"));
            $prediksi[] = ['tanggal' => $tanggal, 'harga' => $harga];
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

