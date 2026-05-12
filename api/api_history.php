<?php
header('Content-Type: application/json');
require_once __DIR__ . '/Server/koneksi.php';

try {
    $slug = isset($_GET['slug']) ? trim(strip_tags($_GET['slug'])) : 'beras';
    
    // Ambil rata-rata harga nasional per hari, maksimal 30 hari terakhir
    $query = "
        SELECT tanggal, AVG(harga) as harga 
        FROM harga_harian 
        WHERE slug_komoditas = ?
        GROUP BY tanggal 
        ORDER BY tanggal DESC 
        LIMIT 30
    ";
    
    $stmt = mysqli_prepare($koneksi, $query);
    mysqli_stmt_bind_param($stmt, "s", $slug);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    
    $history = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $history[] = [
            'tanggal' => $row['tanggal'],
            'harga' => (float)$row['harga']
        ];
    }
    
    // Reverse agar urutan dari terlama ke terbaru (untuk chart)
    $history = array_reverse($history);
    
    echo json_encode([
        'status' => 'success',
        'data' => $history
    ]);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
