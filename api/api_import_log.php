<?php
require __DIR__ . '/Server/koneksi.php';
session_start();

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false]); exit;
}

$role = strtolower(trim($_SESSION['role']));
if (!in_array($role, ['admin-komoditas', 'superadmin'])) {
    echo json_encode(['success' => false, 'message' => 'Akses ditolak']); exit;
}

$logs = [];
$res = @mysqli_query($koneksi,
    "SELECT slug_komoditas, filename, tanggal_upload, total_entri, errors, uploaded_by,
            DATE_FORMAT(created_at,'%d %b %Y %H:%i') as created_at
     FROM import_log ORDER BY created_at DESC LIMIT 20"
);

if ($res) {
    while ($r = mysqli_fetch_assoc($res)) $logs[] = $r;
    echo json_encode(['success' => true, 'logs' => $logs]);
} else {
    echo json_encode(['success' => false, 'message' => 'Tabel import_log belum ada.', 'logs' => []]);
}
?>
