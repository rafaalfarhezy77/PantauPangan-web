<?php
header('Content-Type: application/json');
require_once __DIR__ . '/Server/koneksi.php';

try {
    $query = "SELECT DISTINCT wilayah FROM harga_harian WHERE wilayah != 'Semua Provinsi' AND wilayah != 'Nasional' ORDER BY wilayah ASC";
    $result = mysqli_query($koneksi, $query);

    if (!$result) {
        throw new Exception("Error query: " . mysqli_error($koneksi));
    }

    $provinces = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $provinces[] = $row['wilayah'];
    }

    echo json_encode([
        'status' => 'success',
        'data' => $provinces
    ]);

} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?>
