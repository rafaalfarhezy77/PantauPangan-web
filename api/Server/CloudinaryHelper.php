<?php

class CloudinaryHelper {
    private static $cloudName = ''; // Isi dengan Cloud Name Anda
    private static $apiKey = '';    // Isi dengan API Key Anda
    private static $apiSecret = ''; // Isi dengan API Secret Anda

    /**
     * Upload file ke Cloudinary menggunakan cURL (REST API)
     * @param string $fileTmpPath Path file sementara ($_FILES['...']['tmp_name'])
     * @param string $folder Folder tujuan di Cloudinary
     * @return string|false URL gambar yang berhasil diupload atau false jika gagal
     */
    public static function upload($fileTmpPath, $folder = 'berita') {
        // Jika Anda menggunakan environment variables (misal di Vercel/Laragon)
        $cloudName = getenv('CLOUDINARY_CLOUD_NAME') ?: self::$cloudName;
        $apiKey = getenv('CLOUDINARY_API_KEY') ?: self::$apiKey;
        $apiSecret = getenv('CLOUDINARY_API_SECRET') ?: self::$apiSecret;

        if (empty($cloudName) || empty($apiKey) || empty($apiSecret)) {
            return false;
        }

        $timestamp = time();
        $signature = self::generateSignature($timestamp, $folder, $apiSecret);

        $url = "https://api.cloudinary.com/v1_1/{$cloudName}/image/upload";

        $postData = [
            'file' => new CURLFile($fileTmpPath),
            'api_key' => $apiKey,
            'timestamp' => $timestamp,
            'signature' => $signature,
            'folder' => $folder
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

        $response = curl_exec($ch);
        $err = curl_error($ch);
        curl_close($ch);

        if ($err) {
            return false;
        }

        $result = json_decode($response, true);
        return isset($result['secure_url']) ? $result['secure_url'] : false;
    }

    private static function generateSignature($timestamp, $folder, $apiSecret) {
        // Parameter harus diurutkan secara alfabetis untuk signing
        $params = "folder={$folder}&timestamp={$timestamp}";
        return sha1($params . $apiSecret);
    }
}
