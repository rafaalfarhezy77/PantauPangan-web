<?php
require __DIR__ . '/../Server/koneksi.php';
require __DIR__ . '/../Server/CloudinaryHelper.php';
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

$judul = mysqli_real_escape_string($koneksi, trim($_POST['judul']));
$deskripsi = mysqli_real_escape_string($koneksi, trim($_POST['deskripsi']));
$tanggal = mysqli_real_escape_string($koneksi, trim($_POST['tanggal']));
$slug = isset($_POST['slug']) ? mysqli_real_escape_string($koneksi, trim($_POST['slug'])) : '';
$sumber = isset($_POST['sumber']) ? mysqli_real_escape_string($koneksi, trim($_POST['sumber'])) : '';

$update_parts = [
    "judul = '$judul'",
    "deskripsi = '$deskripsi'",
    "tanggal = '$tanggal'",
    "slug_komoditas = '$slug'",
    "sumber = '$sumber'"
];

// Handle Image Update if provided
if (isset($_FILES['cover_image']) && $_FILES['cover_image']['error'] === UPLOAD_ERR_OK) {
    $file = $_FILES['cover_image'];
    $fileSize = $file['size'];
    $fileTmp = $file['tmp_name'];
    $fileType = mime_content_type($fileTmp);

    if ($fileSize > 1048576) {
        echo json_encode(['success' => false, 'message' => 'Gambar terlalu besar (Maks 1MB).']); exit;
    }
    if (!in_array($fileType, ['image/jpeg', 'image/png'])) {
        echo json_encode(['success' => false, 'message' => 'Format gambar tidak didukung (Hanya JPG/PNG).']); exit;
    }

    // Handle Image Update
    if (getenv('CLOUDINARY_CLOUD_NAME')) {
        $cloudinaryUrl = CloudinaryHelper::upload($fileTmp, 'berita');
        if ($cloudinaryUrl) {
            $update_parts[] = "cover_image = '$cloudinaryUrl'";
        } else {
            echo json_encode(['success' => false, 'message' => 'Gagal mengupdate gambar ke Cloudinary.']); exit;
        }
    } else {
        // Jalur Lokal
        $uploadDir = __DIR__ . '/../../uploads/berita/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
        
        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $newFileName = uniqid('cover_', true) . '.' . $ext;
        $uploadPath = $uploadDir . $newFileName;

        if (move_uploaded_file($fileTmp, $uploadPath)) {
            // Hapus gambar lama lokal
            $resOld = mysqli_query($koneksi, "SELECT cover_image FROM berita WHERE id = $id");
            if ($rowOld = mysqli_fetch_assoc($resOld)) {
                $oldPath = __DIR__ . '/../../' . $rowOld['cover_image'];
                if (file_exists($oldPath) && !str_starts_with($rowOld['cover_image'], 'http')) @unlink($oldPath);
            }
            $cover_url = 'uploads/berita/' . $newFileName;
            $update_parts[] = "cover_image = '$cover_url'";
        }
    }
}

$query = "UPDATE berita SET " . implode(", ", $update_parts) . " WHERE id = $id";

if (mysqli_query($koneksi, $query)) {
    echo json_encode(['success' => true, 'message' => 'Berita berhasil diperbarui.']);
} else {
    echo json_encode(['success' => false, 'message' => 'Gagal memperbarui berita: ' . mysqli_error($koneksi)]);
}
?>
