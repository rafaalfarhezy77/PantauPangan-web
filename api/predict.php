<?php
header('Content-Type: application/json');

// Menggunakan koneksi.php yang sudah dikonfigurasi untuk SSL TiDB Cloud
require_once __DIR__ . '/Server/koneksi.php';

try {
    // Keamanan Input: Mencegah XSS
    $wilayah = isset($_GET['wilayah']) ? trim(strip_tags($_GET['wilayah'])) : 'Jakarta'; 
    $limit_hari = 30; // Pake data 30 hari ke belakang untuk bahan belajar

    // Set zona waktu ke Indonesia
    date_default_timezone_set('Asia/Jakarta');
    $hari_ini = date('Y-m-d');

    // 1. Ambil data historis terbaru dari database (sebelum hari ini, urutkan DESC lalu di-reverse)
    $query = "SELECT tanggal, harga FROM harga_harian WHERE slug_komoditas = 'beras' AND wilayah = ? AND tanggal < ? ORDER BY tanggal DESC LIMIT ?";
    $stmt = mysqli_prepare($koneksi, $query);
    
    if (!$stmt) {
        throw new Exception("Error prepare statement: " . mysqli_error($koneksi));
    }

    // Menggunakan tipe "ssi" (String wilayah, String hari_ini, Integer limit_hari)
    mysqli_stmt_bind_param($stmt, "ssi", $wilayah, $hari_ini, $limit_hari);
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
    $labels = [];   // Tanggal

    foreach ($data_historis as $index => $row) {
        $x_values[] = $index + 1; 
        $y_values[] = (float) $row['harga'];
        $labels[] = $row['tanggal'];
    }

    // 3. Fungsi Regresi Linear Sederhana
    $n = count($x_values);
    $sumX = array_sum($x_values);
    $sumY = array_sum($y_values);
    $sumXY = 0;
    $sumX2 = 0;

    for ($i = 0; $i < $n; $i++) {
        $sumXY += ($x_values[$i] * $y_values[$i]);
        $sumX2 += ($x_values[$i] * $x_values[$i]);
    }

    // Hitung Slope (m) dan Intercept (c)
    $denominator = ($n * $sumX2 - $sumX * $sumX);
    
    // Mencegah error pembagian dengan nol jika data tidak bervariasi
    if ($denominator == 0) {
        $m = 0;
    } else {
        $m = ($n * $sumXY - $sumX * $sumY) / $denominator;
    }
    
    $c = ($sumY - $m * $sumX) / $n;

    // 4. Prediksi 7 hari ke depan
    $prediksi = [];
    
    // Prediksi selalu dimulai dari HARI INI (berdasarkan tanggal server)
    $tanggal_terakhir = date('Y-m-d', strtotime('-1 day')); // Kemarin

    for ($i = 1; $i <= 7; $i++) {
        $x_prediksi = $n + $i;
        $y_prediksi = round(($m * $x_prediksi) + $c); // y = mx + c
        
        // Tambah $i hari dari kemarin = Hari ini, Besok, Lusa, dst.
        $tgl_baru = date('Y-m-d', strtotime($tanggal_terakhir . " + $i days"));
        
        $prediksi[] = [
            'tanggal' => $tgl_baru,
            'harga' => $y_prediksi
        ];
    }

    // 5. Kirim balikan JSON
    echo json_encode([
        'wilayah' => $wilayah,
        'historis' => $data_historis,
        'prediksi' => $prediksi
    ]);

} catch (Exception $e) {
    // Keamanan Log: Jangan tampilkan pesan error SQL/DB mentah ke endpoint public 
    // agar schema database / konfigurasi server tidak bocor.
    error_log("Database Error di predict.php: " . $e->getMessage());
    echo json_encode(['error' => 'Terjadi kesalahan pada server saat mengambil data.']);
}
?>
