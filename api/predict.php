<?php
header('Content-Type: application/json');

// Menggunakan koneksi.php yang sudah dikonfigurasi untuk SSL TiDB Cloud
require_once __DIR__ . '/Server/koneksi.php';

try {
    // Keamanan Input: Mencegah XSS
    $wilayah     = isset($_GET['wilayah']) ? trim(strip_tags($_GET['wilayah'])) : 'Jakarta';
    $slug        = isset($_GET['slug'])    ? trim(strip_tags($_GET['slug']))    : 'beras';

    // Periode prediksi: 7 hari, 30 hari (1 bulan), 90 hari (3 bulan), 120 hari (4 bulan)
    $hari_prediksi_raw = isset($_GET['hari']) ? (int)$_GET['hari'] : 7;
    $allowed_hari      = [7, 30, 90, 120];
    $hari_prediksi     = in_array($hari_prediksi_raw, $allowed_hari) ? $hari_prediksi_raw : 7;

    // Data training: min 30 hari, max 60 hari (cukup untuk regresi akurat, query lebih cepat)
    $limit_hari = min(60, max(30, $hari_prediksi));

    // Set zona waktu ke Indonesia
    date_default_timezone_set('Asia/Jakarta');
    $hari_ini = date('Y-m-d');

    // 1. Ambil data historis terbaru dari database (sebelum hari ini, urutkan DESC lalu di-reverse)
    $query = "SELECT tanggal, harga FROM harga_harian
              WHERE slug_komoditas = ? AND wilayah = ? AND tanggal < ?
              ORDER BY tanggal DESC LIMIT ?";
    $stmt = mysqli_prepare($koneksi, $query);

    if (!$stmt) {
        throw new Exception("Error prepare statement: " . mysqli_error($koneksi));
    }

    // Tipe: s=slug, s=wilayah, s=hari_ini, i=limit_hari
    mysqli_stmt_bind_param($stmt, "sssi", $slug, $wilayah, $hari_ini, $limit_hari);
    mysqli_stmt_execute($stmt);

    $result = mysqli_stmt_get_result($stmt);

    $data_historis = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $data_historis[] = $row;
    }

    // Balik urutan menjadi ASC (terlama ke terbaru) untuk perhitungan regresi
    $data_historis = array_reverse($data_historis);

    mysqli_stmt_close($stmt);

    if (count($data_historis) == 0) {
        echo json_encode(['error' => 'Data tidak ditemukan untuk wilayah ini.']);
        exit;
    }

    // 2. Siapkan array untuk Regresi Linear
    $x_values = []; // Urutan hari (1, 2, 3...)
    $y_values = []; // Harga

    foreach ($data_historis as $index => $row) {
        $x_values[] = $index + 1;
        $y_values[] = (float) $row['harga'];
    }

    // 3. Hitung koefisien Regresi Linear (y = mx + c)
    $n     = count($x_values);
    $sumX  = array_sum($x_values);
    $sumY  = array_sum($y_values);
    $sumXY = 0;
    $sumX2 = 0;

    for ($i = 0; $i < $n; $i++) {
        $sumXY += ($x_values[$i] * $y_values[$i]);
        $sumX2 += ($x_values[$i] * $x_values[$i]);
    }

    $denominator = ($n * $sumX2 - $sumX * $sumX);

    // Mencegah pembagian dengan nol jika data flat / tidak bervariasi
    $m = ($denominator == 0) ? 0 : ($n * $sumXY - $sumX * $sumY) / $denominator;
    $c = ($sumY - $m * $sumX) / $n;

    // 4. Prediksi N hari ke depan mulai hari ini
    $prediksi = [];
    $tanggal_terakhir = date('Y-m-d', strtotime('-1 day')); // Kemarin sebagai anchor

    for ($i = 1; $i <= $hari_prediksi; $i++) {
        $x_prediksi = $n + $i;
        $y_prediksi = round(($m * $x_prediksi) + $c); // y = mx + c
        $tgl_baru   = date('Y-m-d', strtotime($tanggal_terakhir . " + $i days"));

        $prediksi[] = [
            'tanggal' => $tgl_baru,
            'harga'   => $y_prediksi
        ];
    }

    // 5. Kirim balikan JSON
    echo json_encode([
        'wilayah'       => $wilayah,
        'slug'          => $slug,
        'hari_prediksi' => $hari_prediksi,
        'historis'      => $data_historis,
        'prediksi'      => $prediksi
    ]);

} catch (Exception $e) {
    // Keamanan Log: Jangan tampilkan pesan error SQL/DB mentah ke endpoint public
    // agar schema database / konfigurasi server tidak bocor.
    error_log("Database Error di predict.php: " . $e->getMessage());
    echo json_encode(['error' => 'Terjadi kesalahan pada server saat mengambil data.']);
}
?>
