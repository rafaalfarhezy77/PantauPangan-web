<?php
require __DIR__ . '/../Server/koneksi.php';
require __DIR__ . '/../Server/CloudinaryHelper.php';
session_start();

header('Content-Type: application/json');

// ── Keamanan: hanya admin-berita atau superadmin ──
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Sesi tidak valid. Silakan login kembali.']);
    exit;
}

$role = strtolower(trim($_SESSION['role']));
if (!in_array($role, ['admin-berita', 'superadmin'])) {
    echo json_encode(['success' => false, 'message' => 'Akses ditolak. Hanya Admin Berita yang dapat mengupload berita.']);
    exit;
}

// ── Validasi method ──
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Metode tidak diizinkan.']);
    exit;
}

// ── Validasi input teks ──
if (empty($_POST['judul']) || empty($_POST['deskripsi']) || empty($_POST['tanggal_upload'])) {
    echo json_encode(['success' => false, 'message' => 'Judul, Deskripsi, dan Tanggal wajib diisi.']);
    exit;
}

$judul = mysqli_real_escape_string($koneksi, trim($_POST['judul']));
$deskripsi = mysqli_real_escape_string($koneksi, trim($_POST['deskripsi']));
$tanggal_upload = mysqli_real_escape_string($koneksi, trim($_POST['tanggal_upload']));
$slug_komoditas = isset($_POST['slug_komoditas']) ? mysqli_real_escape_string($koneksi, trim($_POST['slug_komoditas'])) : '';
$sumber = isset($_POST['sumber']) ? mysqli_real_escape_string($koneksi, trim($_POST['sumber'])) : 'Admin';
$uploaded_by = mysqli_real_escape_string($koneksi, $_SESSION['username']);

// ── Validasi file cover_image ──
if (!isset($_FILES['cover_image']) || $_FILES['cover_image']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['success' => false, 'message' => 'Gagal mengupload gambar cover.']);
    exit;
}

$file = $_FILES['cover_image'];
$fileName = $file['name'];
$fileSize = $file['size'];
$fileTmp = $file['tmp_name'];
$fileType = mime_content_type($fileTmp);

// Validasi ukuran (Maks 1MB)
if ($fileSize > 1048576) {
    echo json_encode(['success' => false, 'message' => 'Ukuran file terlalu besar. Maksimal 1 MB.']);
    exit;
}

// Validasi format (PNG / JPG)
$allowedTypes = ['image/jpeg', 'image/png'];
if (!in_array($fileType, $allowedTypes)) {
    echo json_encode(['success' => false, 'message' => 'Format file tidak didukung. Hanya JPG dan PNG yang diperbolehkan.']);
    exit;
}

// ── Upload ke Cloudinary atau Lokal ──
$cover_url = '';

// Cek apakah Cloudinary dikonfigurasi
if (getenv('CLOUDINARY_CLOUD_NAME')) {
    $cloudinaryUrl = CloudinaryHelper::upload($fileTmp, 'berita');
    if ($cloudinaryUrl) {
        $cover_url = $cloudinaryUrl;
    } else {
        echo json_encode(['success' => false, 'message' => 'Gagal mengupload gambar ke Cloudinary.']);
        exit;
    }
} else {
    // Jalur Lokal (Laragon)
    $uploadDir = __DIR__ . '/../../uploads/berita/';
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
    
    $ext = pathinfo($fileName, PATHINFO_EXTENSION);
    $newFileName = uniqid('cover_', true) . '.' . $ext;
    $uploadPath = $uploadDir . $newFileName;

    if (!move_uploaded_file($fileTmp, $uploadPath)) {
        echo json_encode(['success' => false, 'message' => 'Gagal menyimpan gambar secara lokal.']);
        exit;
    }
    $cover_url = 'uploads/berita/' . $newFileName;
}

$query = "INSERT INTO berita (judul, deskripsi, cover_image, tanggal, slug_komoditas, uploaded_by, sumber) 
          VALUES ('$judul', '$deskripsi', '$cover_url', '$tanggal_upload', '$slug_komoditas', '$uploaded_by', '$sumber')";

if (mysqli_query($koneksi, $query)) {
    echo json_encode(['success' => true, 'message' => 'Berita berhasil diupload.']);
} else {
    // Jika gagal insert, hapus file yang sudah terupload
    unlink($uploadPath);
    echo json_encode(['success' => false, 'message' => 'Gagal menyimpan data ke database: ' . mysqli_error($koneksi)]);
}
?>
