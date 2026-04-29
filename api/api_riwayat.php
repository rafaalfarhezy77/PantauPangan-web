<?php
header('Content-Type: application/json');
require __DIR__ . '/Server/koneksi.php';

session_start();
if (!isset($_SESSION['user_id'])) {
    echo json_encode(["status" => "error", "message" => "Sesi tidak ditemukan. Silakan login."]);
    exit;
}

$user_id = $_SESSION['user_id'];

// JIKA REQUEST POST: Tambah/Update Riwayat (Dari index.html)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $slug = mysqli_real_escape_string($koneksi, $input['slug']);
    
    if(!empty($slug)) {
        // Jika komoditas sudah ada di riwayat user ini, update waktunya saja
        $query = "INSERT INTO riwayat_user (user_id, slug_komoditas, waktu_pencarian) 
                  VALUES ('$user_id', '$slug', NOW()) 
                  ON DUPLICATE KEY UPDATE waktu_pencarian = NOW()";
        mysqli_query($koneksi, $query);
        echo json_encode(["status" => "success"]);
    }
    exit;
}

// JIKA REQUEST GET: Ambil Data Riwayat (Untuk dashboard.php)
$query = "
    SELECT 
        k.slug_id, k.nama, k.icon, k.harga_default, r.waktu_pencarian
    FROM riwayat_user r
    JOIN komoditas k ON r.slug_komoditas = k.slug_id
    WHERE r.user_id = '$user_id'
    ORDER BY r.waktu_pencarian DESC LIMIT 4
";
$result = mysqli_query($koneksi, $query);

$history = [];
if ($result) {
    while ($row = mysqli_fetch_assoc($result)) {
        $history[] = [
            'id' => $row['slug_id'],
            'icon' => $row['icon'],
            'commodity' => $row['nama'],
            'price' => 'Rp ' . number_format($row['harga_default'], 0, ',', '.'),
            'region' => 'Nasional',
            'time' => date('d M Y H:i', strtotime($row['waktu_pencarian']))
        ];
    }
    echo json_encode(["status" => "success", "data" => $history]);
}
?>