<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ProphetService
{
    protected string $baseUrl;
    protected int $timeout;

    public function __construct()
    {
        $this->baseUrl = config('services.prophet.url', 'http://localhost:5000');
        $this->timeout = config('services.prophet.timeout', 30);
    }

    /**
     * Minta prediksi harga dari Flask Prophet microservice
     *
     * @param  string  $komoditas  Slug komoditas (contoh: 'beras')
     * @param  string  $provinsi   Nama provinsi (contoh: 'Jawa Barat')
     * @param  int     $days       Jumlah hari ke depan yang diprediksi
     * @return array
     * @throws \RuntimeException jika microservice tidak bisa dihubungi
     */
    public function predict(string $komoditas, string $provinsi, int $days = 30): array
    {
        $response = Http::timeout($this->timeout)
            ->get("{$this->baseUrl}/predict", [
                'komoditas' => $komoditas,
                'provinsi'  => $provinsi,
                'days'      => $days,
            ]);

        if ($response->failed()) {
            Log::error('ProphetService: request gagal', [
                'komoditas' => $komoditas,
                'provinsi'  => $provinsi,
                'status'    => $response->status(),
                'body'      => $response->body(),
            ]);

            throw new \RuntimeException(
                "Prophet API mengembalikan status {$response->status()}"
            );
        }

        return $response->json();
    }

    /**
     * Cek apakah microservice Prophet sedang aktif/healthy
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
}
