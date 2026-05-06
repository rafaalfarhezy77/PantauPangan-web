<?php
header('Content-Type: application/json');

// URL API BPS untuk daftar Provinsi
$url = "https://webapi.bps.go.id/v1/api/domain/type/prov/key/411c3f2a3d4060bc797340f28a3cb72b/";

$arrContextOptions = [
    "ssl" => [
        "verify_peer" => false,
        "verify_peer_name" => false,
    ],
];

$cacheFile = __DIR__ . '/provinsi_cache.json';
$cacheTime = 86400; // Cache 1 hari (Provinsi jarang berubah)

if (file_exists($cacheFile) && (time() - filemtime($cacheFile)) < $cacheTime) {
    echo file_get_contents($cacheFile);
    exit;
}

$response = file_get_contents($url, false, stream_context_create($arrContextOptions));

if ($response === FALSE) {
    echo json_encode(["status" => "error", "message" => "Gagal mengambil data provinsi"]);
    exit;
}

file_put_contents($cacheFile, $response);

echo $response;
?>


