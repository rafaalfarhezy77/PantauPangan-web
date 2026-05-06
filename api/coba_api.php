<?php
header('Content-Type: application/json'); 

// URL API BPS spesifik yang sudah dites di Postman
$url = "https://webapi.bps.go.id/v1/api/list/model/data/lang/ind/domain/0000/var/2277/th/125/key/411c3f2a3d4060bc797340f28a3cb72b/";
$url2 = "https://webapi.bps.go.id/v1/api/domain/type/prov/prov/4/key/411c3f2a3d4060bc797340f28a3cb72b/";

// Membuat context untuk mematikan verifikasi SSL (Hanya untuk Local Dev)
$arrContextOptions = [
    "ssl" => [
        "verify_peer" => false,
        "verify_peer_name" => false,
    ],
];

$cacheFile = __DIR__ . '/bps_cache.json';
$cacheTime = 3600; // Cache 1 jam

if (file_exists($cacheFile) && (time() - filemtime($cacheFile)) < $cacheTime) {
    echo file_get_contents($cacheFile);
    exit;
}

// ambil data
$response = file_get_contents($url, false, stream_context_create($arrContextOptions));

// cek error
if ($response === FALSE) {
    echo json_encode(["error" => "Gagal mengambil data"]);
    exit;
}

file_put_contents($cacheFile, $response);

// kirim ke frontend
echo $response;
?>


