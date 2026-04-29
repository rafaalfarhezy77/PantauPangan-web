<?php
header('Content-Type: application/json');
require __DIR__ . '/Server/koneksi.php';

session_start();

// Pastikan user sudah login
if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        "status" => "error",
        "message" => "Sesi tidak ditemukan. Silakan login kembali."
    ]);
    exit;
}

$user_id = $_SESSION['user_id'];

// Terima data JSON dari request body
$input = json_decode(file_get_contents('php://input'), true);

// Tentukan aksi: 'add', 'remove', atau 'check'
$action = $input['action'] ?? ($_GET['action'] ?? '');
$slug   = $input['slug']   ?? ($_GET['slug']   ?? '');

if (empty($slug)) {
    echo json_encode([
        "status" => "error",
        "message" => "Slug komoditas tidak boleh kosong."
    ]);
    exit;
}

$slug = mysqli_real_escape_string($koneksi, $slug);
$user_id = mysqli_real_escape_string($koneksi, $user_id);

// === CEK apakah sudah ada di pantauan ===
if ($action === 'check') {
    $query = "SELECT id FROM pantauan_user WHERE user_id = '$user_id' AND slug_komoditas = '$slug' LIMIT 1";
    $result = mysqli_query($koneksi, $query);

    echo json_encode([
        "status" => "success",
        "is_watching" => mysqli_num_rows($result) > 0
    ]);
    exit;
}

// === TAMBAH ke pantauan ===
if ($action === 'add') {
    // Cek duplikat dulu
    $cek = mysqli_query($koneksi, "SELECT id FROM pantauan_user WHERE user_id = '$user_id' AND slug_komoditas = '$slug' LIMIT 1");
    if (mysqli_num_rows($cek) > 0) {
        echo json_encode([
            "status" => "success",
            "message" => "Komoditas sudah ada di pantauan.",
            "is_watching" => true
        ]);
        exit;
    }

    $query = "INSERT INTO pantauan_user (user_id, slug_komoditas, ditambahkan_pada) VALUES ('$user_id', '$slug', NOW())";
    $result = mysqli_query($koneksi, $query);

    if ($result) {
        echo json_encode([
            "status" => "success",
            "message" => "Berhasil menambahkan ke pantauan.",
            "is_watching" => true
        ]);
    } else {
        echo json_encode([
            "status" => "error",
            "message" => "Gagal menambahkan: " . mysqli_error($koneksi)
        ]);
    }
    exit;
}

// === HAPUS dari pantauan ===
if ($action === 'remove') {
    $query = "DELETE FROM pantauan_user WHERE user_id = '$user_id' AND slug_komoditas = '$slug'";
    $result = mysqli_query($koneksi, $query);

    if ($result) {
        echo json_encode([
            "status" => "success",
            "message" => "Berhasil menghapus dari pantauan.",
            "is_watching" => false
        ]);
    } else {
        echo json_encode([
            "status" => "error",
            "message" => "Gagal menghapus: " . mysqli_error($koneksi)
        ]);
    }
    exit;
}

// Aksi tidak dikenali
echo json_encode([
    "status" => "error",
    "message" => "Aksi tidak valid. Gunakan 'add', 'remove', atau 'check'."
]);
?>
