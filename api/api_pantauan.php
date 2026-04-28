<?php
header('Content-Type: application/json');
require __DIR__ . '/Server/koneksi.php'; 

session_start();
if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        "status" => "error",
        "message" => "Sesi tidak ditemukan. Silakan login kembali."
    ]);
    exit;
}

$user_id = $_SESSION['user_id'];

$query = "
    SELECT 
        k.slug_id, 
        k.nama, 
        k.icon, 
        k.harga_default, 
        k.perubahan_default,
        p.ditambahkan_pada
    FROM pantauan_user p
    JOIN komoditas k ON p.slug_komoditas = k.slug_id
    WHERE p.user_id = '$user_id'
    ORDER BY p.ditambahkan_pada DESC
";

$result = mysqli_query($koneksi, $query);

$watchlist = [];

if ($result) {
    while ($row = mysqli_fetch_assoc($result)) {
        // Kita format data agar sesuai dengan struktur watchlistData di JavaScript
        $watchlist[] = [
            'id' => $row['slug_id'],
            'icon' => $row['icon'],
            'commodity' => $row['nama'],
            'price' => "Rp " . number_format($row['harga_default'], 0, ',', '.'),
            'change' => ($row['perubahan_default'] >= 0 ? '+' : '') . $row['perubahan_default'] . "%",
            'isUp' => $row['perubahan_default'] >= 0
        ];
    }

    echo json_encode([
        "status" => "success",
        "data" => $watchlist
    ]);
} else {
    echo json_encode([
        "status" => "error",
        "message" => "Gagal mengambil data: " . mysqli_error($koneksi)
    ]);
}
?>