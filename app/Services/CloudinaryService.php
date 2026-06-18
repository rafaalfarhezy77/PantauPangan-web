<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CloudinaryService
{
    protected string $cloudName;
    protected string $apiKey;
    protected string $apiSecret;
    protected string $uploadUrl;

    public function __construct()
    {
        $this->cloudName = config('services.cloudinary.cloud_name');
        $this->apiKey    = config('services.cloudinary.api_key');
        $this->apiSecret = config('services.cloudinary.api_secret');
        $this->uploadUrl = "https://api.cloudinary.com/v1_1/{$this->cloudName}/image/upload";
    }

    /**
     * Upload file gambar ke Cloudinary
     *
     * @param  UploadedFile|string  $file     File yang diupload atau path file
     * @param  string               $folder   Folder Cloudinary tujuan (contoh: 'berita')
     * @param  string|null          $publicId ID publik kustom (opsional)
     * @return array  ['url' => ..., 'public_id' => ..., 'secure_url' => ...]
     * @throws \RuntimeException jika upload gagal
     */
    public function upload(UploadedFile|string $file, string $folder = 'pantaupangan', ?string $publicId = null): array
    {
        $timestamp = time();
        $params    = ['folder' => $folder, 'timestamp' => $timestamp];

        if ($publicId) {
            $params['public_id'] = $publicId;
        }

        $signature = $this->generateSignature($params);

        $multipart = [
            ['name' => 'file',      'contents' => $file instanceof UploadedFile
                ? fopen($file->getRealPath(), 'r')
                : fopen($file, 'r')],
            ['name' => 'api_key',   'contents' => $this->apiKey],
            ['name' => 'timestamp', 'contents' => $timestamp],
            ['name' => 'signature', 'contents' => $signature],
            ['name' => 'folder',    'contents' => $folder],
        ];

        if ($publicId) {
            $multipart[] = ['name' => 'public_id', 'contents' => $publicId];
        }

        $response = Http::timeout(60)->asMultipart()->post($this->uploadUrl, $multipart);

        if ($response->failed()) {
            Log::error('CloudinaryService: upload gagal', [
                'status' => $response->status(),
                'body'   => $response->body(),
            ]);
            throw new \RuntimeException('Upload gambar ke Cloudinary gagal: ' . $response->body());
        }

        $data = $response->json();

        return [
            'url'        => $data['url'] ?? null,
            'secure_url' => $data['secure_url'] ?? null,
            'public_id'  => $data['public_id'] ?? null,
            'width'      => $data['width'] ?? null,
            'height'     => $data['height'] ?? null,
            'format'     => $data['format'] ?? null,
        ];
    }

    /**
     * Hapus gambar dari Cloudinary berdasarkan public_id
     *
     * @param  string  $publicId
     * @return bool
     */
    public function delete(string $publicId): bool
    {
        $timestamp = time();
        $signature = $this->generateSignature([
            'public_id' => $publicId,
            'timestamp' => $timestamp,
        ]);

        $response = Http::asForm()->post(
            "https://api.cloudinary.com/v1_1/{$this->cloudName}/image/destroy",
            [
                'public_id' => $publicId,
                'api_key'   => $this->apiKey,
                'timestamp' => $timestamp,
                'signature' => $signature,
            ]
        );

        if ($response->failed()) {
            Log::warning('CloudinaryService: delete gagal', [
                'public_id' => $publicId,
                'status'    => $response->status(),
            ]);
            return false;
        }

        return ($response->json('result') === 'ok');
    }

    /**
     * Generate signature untuk request Cloudinary
     */
    protected function generateSignature(array $params): string
    {
        ksort($params);
        $query = http_build_query($params);
        return sha1($query . $this->apiSecret);
    }
}
