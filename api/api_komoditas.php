<?php
header('Content-Type: application/json');
require __DIR__ . '/Server/koneksi.php'; // Pastikan path koneksinya benar

$query = "SELECT * FROM komoditas WHERE status = 'aktif'";
$result = mysqli_query($koneksi, $query);

$komoditas = [];
if ($result) {
    while ($row = mysqli_fetch_assoc($result)) {
        $komoditas[] = $row;
    }
    echo json_encode(["status" => "success", "data" => $komoditas]);
} else {
    echo json_encode(["status" => "error", "message" => "Gagal mengambil data database"]);
}
?>