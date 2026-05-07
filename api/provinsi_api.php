<?php
header('Content-Type: application/json');

require_once __DIR__ . '/Server/env.php';
$apiKey = getenv('BPS_API_KEY');

// URL API BPS untuk daftar Provinsi
$url = "https://webapi.bps.go.id/v1/api/domain/type/prov/key/{$apiKey}/";

$arrContextOptions = [
    "ssl" => [
        "verify_peer" => false,
        "verify_peer_name" => false,
    ],
];

$response = file_get_contents($url, false, stream_context_create($arrContextOptions));

if ($response === FALSE) {
    echo json_encode(["status" => "error", "message" => "Gagal mengambil data provinsi"]);
    exit;
}

echo $response;
?>


