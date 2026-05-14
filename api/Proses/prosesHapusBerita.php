<?php
require __DIR__ . '/../Server/koneksi.php';
session_start();

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Sesi tidak valid.']);
    exit;
}

$role = strtolower(trim($_SESSION['role']));
if (!in_array($role, ['admin-berita', 'superadmin'])) {
    echo json_encode(['success' => false, 'message' => 'Akses ditolak.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Metode tidak diizinkan.']);
    exit;
}

$id = isset($_POST['id']) ? intval($_POST['id']) : 0;
if ($id <= 0) {
    echo json_encode(['success' => false, 'message' => 'ID tidak valid.']);
    exit;
}

// Ambil path gambar untuk dihapus
$res = mysqli_query($koneksi, "SELECT cover_image FROM berita WHERE id = $id");
if ($row = mysqli_fetch_assoc($res)) {
    $filePath = __DIR__ . '/../../' . $row['cover_image'];
    if (file_exists($filePath)) {
        @unlink($filePath);
    }
}

$query = "DELETE FROM berita WHERE id = $id";
if (mysqli_query($koneksi, $query)) {
    echo json_encode(['success' => true, 'message' => 'Berita berhasil dihapus.']);
} else {
    echo json_encode(['success' => false, 'message' => 'Gagal menghapus berita: ' . mysqli_error($koneksi)]);
}
?>
