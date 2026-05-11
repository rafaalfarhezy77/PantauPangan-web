<?php
header('Content-Type: application/json');

require_once __DIR__ . '/Server/env.php';

// Mengambil DATABASE_URL dari environment agar credential aman
$database_url = getenv('DATABASE_URL');

if (!$database_url) {
    echo json_encode(['error' => 'DATABASE_URL tidak dikonfigurasi pada environment.']);
    exit;
}

// Parsing database_url
$parsed_url = parse_url($database_url);

$host = $parsed_url['host'];
$port = isset($parsed_url['port']) ? $parsed_url['port'] : 4000;
$user = $parsed_url['user'];
$pass = $parsed_url['pass'];
$db   = ltrim($parsed_url['path'], '/');

try {
    // Pengaturan PDO dengan keamanan dan kompabilitas tambahan
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => false, // TiDB Cloud SSL
        PDO::ATTR_EMULATE_PREPARES => false, // Mencegah error tipe data pada klausa LIMIT
    ];
    
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$db", $user, $pass, $options);

    // Keamanan Input: Mencegah XSS jika output json digunakan secara tidak aman
    $wilayah = isset($_GET['wilayah']) ? trim(strip_tags($_GET['wilayah'])) : 'Jakarta'; 
    $limit_hari = 30; // Pake data 30 hari ke belakang untuk bahan belajar

    // 1. Ambil data historis dari database, urutkan dari yang terlama ke terbaru
    // Menggunakan bindValue agar tipe data LIMIT terjamin INT (menghindari SQL Error)
    $stmt = $pdo->prepare("SELECT tanggal, harga FROM harga_harian WHERE komoditas = 'Beras' AND wilayah = :wilayah ORDER BY tanggal ASC LIMIT :limit");
    $stmt->bindValue(':wilayah', $wilayah, PDO::PARAM_STR);
    $stmt->bindValue(':limit', $limit_hari, PDO::PARAM_INT);
    $stmt->execute();
    
    $data_historis = $stmt->fetchAll(PDO::FETCH_ASSOC);

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
    $tanggal_terakhir = end($labels);

    for ($i = 1; $i <= 7; $i++) {
        $x_prediksi = $n + $i;
        $y_prediksi = round(($m * $x_prediksi) + $c); // y = mx + c
        
        // Tambah 1 hari dari tanggal terakhir
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

} catch (PDOException $e) {
    // Keamanan Log: Jangan tampilkan pesan error SQL/DB mentah ke endpoint public 
    // agar schema database / konfigurasi server tidak bocor.
    error_log("Database Error di predict.php: " . $e->getMessage());
    echo json_encode(['error' => 'Terjadi kesalahan pada server saat mengambil data.']);
}
?>
