<?php
header('Content-Type: application/json');
require_once __DIR__ . '/Server/koneksi.php';

try {
    $slug = isset($_GET['slug']) ? trim(strip_tags($_GET['slug'])) : 'beras';

    // Mengambil harga terakhir dan harga sebelumnya (untuk menghitung perubahan) untuk tiap wilayah
    // Pertama ambil tanggal terakhir untuk tiap wilayah
    $query = "
        SELECT 
            h1.wilayah, 
            h1.tipe_wilayah,
            h1.provinsi_induk,
            h1.harga AS harga_sekarang,
            (SELECT harga FROM harga_harian h3 
             WHERE h3.slug_komoditas = h1.slug_komoditas 
               AND h3.wilayah = h1.wilayah 
               AND h3.tanggal < h1.tanggal 
             ORDER BY h3.tanggal DESC LIMIT 1) AS harga_kemarin
        FROM harga_harian h1
        INNER JOIN (
            SELECT wilayah, MAX(tanggal) as max_tanggal
            FROM harga_harian
            WHERE slug_komoditas = ? AND wilayah != 'Semua Provinsi' AND wilayah != 'Nasional'
            GROUP BY wilayah
        ) h2 ON h1.wilayah = h2.wilayah AND h1.tanggal = h2.max_tanggal
        WHERE h1.slug_komoditas = ?
        ORDER BY h1.harga DESC
    ";

    $stmt = mysqli_prepare($koneksi, $query);
    if (!$stmt) {
        throw new Exception("Error prepare: " . mysqli_error($koneksi));
    }

    mysqli_stmt_bind_param($stmt, "ss", $slug, $slug);
    mysqli_stmt_execute($stmt);
    
    $result = mysqli_stmt_get_result($stmt);
    $data = [];
    
    while ($row = mysqli_fetch_assoc($result)) {
        $harga_sekarang = (float) $row['harga_sekarang'];
        $harga_kemarin = $row['harga_kemarin'] !== null ? (float) $row['harga_kemarin'] : $harga_sekarang;
        
        $perubahan = 0;
        if ($harga_kemarin > 0) {
            $perubahan = (($harga_sekarang - $harga_kemarin) / $harga_kemarin) * 100;
        }

        $data[] = [
            'wilayah' => $row['wilayah'],
            'tipe_wilayah' => $row['tipe_wilayah'],
            'provinsi_induk' => $row['provinsi_induk'],
            'harga' => $harga_sekarang,
            'perubahan' => round($perubahan, 1)
        ];
    }

    mysqli_stmt_close($stmt);

    echo json_encode([
        'status' => 'success',
        'data' => $data
    ]);

} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?>
