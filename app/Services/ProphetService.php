<?php

namespace App\Services;

use App\Models\HargaHarian;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ProphetService
{
    protected string $baseUrl;
    protected int    $timeout;
    protected int    $cacheTtl;
    protected int    $binaryCacheTtl = 3600;

    public function __construct()
    {
        $this->baseUrl  = rtrim(config('services.prophet.url', 'http://localhost:5000'), '/');
        $this->timeout  = (int) config('services.prophet.timeout', 120);
        $this->cacheTtl = (int) config('services.prophet.cache_ttl', 21600); // 6 jam
    }

    /**
     * Prediksi harga komoditas via Prophet Flask server.
     * Hasil di-cache berdasarkan (komoditas + wilayah + days + tanggal data terbaru).
     *
     * @param  string  $komoditas  Slug komoditas (contoh: 'beras')
     * @param  string  $provinsi   Nama provinsi (contoh: 'Jawa Barat')
     * @param  int     $days       Jumlah hari ke depan
     * @return array
     * @throws \RuntimeException jika server Prophet tidak tersedia atau data kurang
     */
    public function predict(string $komoditas, string $provinsi, int $days = 30): array
    {
        // 1. Ambil data historis dari database secara agresif
        [$historis, $wilayahAktual] = $this->getHistoris($komoditas, $provinsi);

        if (empty($historis)) {
            throw new \RuntimeException("Data historis tidak tersedia untuk komoditas '{$komoditas}'.");
        }

        // 2. Buat cache key deterministik
        $latestDate = end($historis)['tanggal'];
        $cacheKey   = $this->buildCacheKey($komoditas, $wilayahAktual, $days, $latestDate, count($historis));

        // 3. Ambil dari cache, atau jalankan Prophet
        return Cache::remember($cacheKey, $this->cacheTtl, function () use ($komoditas, $provinsi, $wilayahAktual, $days, $historis) {
            return $this->callProphetServer($komoditas, $provinsi, $wilayahAktual, $days, $historis);
        });
    }

    /**
     * Hapus cache prediksi (berguna setelah import data baru).
     */
    public function forgetCache(string $komoditas, string $provinsi, int $days = 30): void
    {
        if (!in_array(config('cache.default'), ['file', 'database'])) {
            try {
                Cache::tags(['prophet', "prophet:{$komoditas}"])->flush();
                Log::info('ProphetService: cache di-flush via tags', compact('komoditas', 'provinsi'));
            } catch (\Exception $e) {
                Log::warning('ProphetService: cache tags tidak didukung. ' . $e->getMessage());
            }
        }
    }

    /**
     * Kirim request POST ke Flask Prophet server dengan data historis.
     */
    private function callProphetServer(
        string $komoditas,
        string $provinsiDiminta,
        string $wilayahAktual,
        int    $days,
        array  $historis
    ): array {
        Log::info('ProphetService: memanggil Flask server (cache miss)', [
            'komoditas'      => $komoditas,
            'wilayah_aktual' => $wilayahAktual,
            'days'           => $days,
            'data_points'    => count($historis),
            'url'            => $this->baseUrl . '/predict',
        ]);

        $response = Http::timeout($this->timeout)
            ->post("{$this->baseUrl}/predict", [
                'komoditas' => $komoditas,
                'provinsi'  => $wilayahAktual,
                'days'      => $days,
                'historis'  => $historis,
            ]);

        if ($response->failed()) {
            Log::error('ProphetService: request gagal', [
                'status' => $response->status(),
                'body'   => $response->body(),
            ]);
            throw new \RuntimeException(
                "Flask Prophet server mengembalikan status {$response->status()}. " .
                "Pastikan server sudah dijalankan: python scripts/prophet_predict.py"
            );
        }

        $output = $response->json();

        if (isset($output['error'])) {
            throw new \RuntimeException('Prophet error: ' . $output['error']);
        }

        $result = [
            'historis'           => $historis,
            'prediksi'           => $output['prediksi']              ?? [],
            'algoritma'          => $output['algoritma']             ?? 'prophet',
            'konfigurasi_model'  => $output['konfigurasi']           ?? null,
            'data_points'        => $output['data_points']           ?? count($historis),
            'rentang_historis'   => $output['rentang_historis_hari'] ?? null,
            'wilayah'            => $provinsiDiminta,
            'wilayah_data'       => $wilayahAktual,
            'slug'               => $komoditas,
            'cached_at'          => now()->toIso8601String(),
            'cache_expires_in'   => $this->cacheTtl,
        ];

        Log::info('ProphetService: prediksi selesai', [
            'komoditas'       => $komoditas,
            'prediksi_count'  => count($result['prediksi']),
            'konfigurasi'     => $result['konfigurasi_model'],
        ]);

        return $result;
    }

    /**
     * Cek apakah Flask Prophet server aktif.
     */
    public function isHealthy(): bool
    {
        try {
            $response = Http::timeout(5)->get("{$this->baseUrl}/health");
            return $response->successful();
        } catch (\Exception $e) {
            Log::warning('ProphetService: health check gagal — ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Ambil data historis dari database secara agresif (fallback bertingkat).
     *
     * @return array{0: array, 1: string}  [historis, wilayah_aktual]
     */
    private function getHistoris(string $komoditas, string $provinsi): array
    {
        $fetch = fn(string $wil) => HargaHarian::where('slug_komoditas', $komoditas)
            ->where('provinsi', $wil)
            ->orderBy('tanggal')
            ->limit(730)
            ->get(['tanggal', 'harga']);

        // Coba 1: provinsi yang diminta
        $rows = $fetch($provinsi);
        if ($rows->count() >= 2) {
            return [$this->formatHistoris($rows), $provinsi];
        }

        // Coba 2: Nasional
        if ($provinsi !== 'Nasional') {
            $rows = $fetch('Nasional');
            if ($rows->count() >= 2) {
                Log::info("ProphetService: data '{$provinsi}' tidak cukup, fallback ke 'Nasional'");
                return [$this->formatHistoris($rows), 'Nasional'];
            }
        }

        // Coba 3: provinsi mana saja dengan data terbanyak
        $anyProvinsi = HargaHarian::where('slug_komoditas', $komoditas)
            ->select('provinsi')
            ->groupBy('provinsi')
            ->orderByRaw('COUNT(*) DESC')
            ->value('provinsi');

        if ($anyProvinsi) {
            $rows = $fetch($anyProvinsi);
            if ($rows->count() >= 2) {
                Log::info("ProphetService: fallback ke provinsi '{$anyProvinsi}'");
                return [$this->formatHistoris($rows), $anyProvinsi];
            }
        }

        return [[], $provinsi];
    }

    private function formatHistoris($rows): array
    {
        return $rows
            ->map(fn($r) => ['tanggal' => $r->tanggal, 'harga' => (float) $r->harga])
            ->values()
            ->all();
    }

    private function buildCacheKey(
        string $komoditas,
        string $provinsi,
        int    $days,
        string $latestDate,
        int    $dataCount
    ): string {
        return implode(':', [
            'prophet',
            $komoditas,
            str_replace(' ', '_', strtolower($provinsi)),
            "d{$days}",
            $latestDate,
            "n{$dataCount}",
        ]);
    }
}
