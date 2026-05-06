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

$response = file_get_contents($url, false, stream_context_create($arrContextOptions));

if ($response === FALSE) {
    echo json_encode(["status" => "error", "message" => "Gagal mengambil data provinsi"]);
    exit;
}

echo $response;
?>


