<?php
session_start();
require '../Server/koneksi.php';

// Validasi Keamanan Lapis Ganda
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    echo "<script>alert('Akses ilegal!'); window.location.href='../dashboard.php';</script>";
    exit;
}

if (isset($_GET['id'])) {
    $id_target = mysqli_real_escape_string($koneksi, $_GET['id']);
    $id_saya = $_SESSION['user_id'];

    // Proses Delete
    $query = "DELETE FROM users WHERE id = '$id_target'";
    $hapus = mysqli_query($koneksi, $query);

    if ($hapus) {
        echo "<script>alert('Berhasil: User telah dihapus permanen.'); window.location.href='../dashboardAdmin.php';</script>";
    } else {
        echo "<script>alert('Gagal: Terjadi kesalahan saat menghapus data.'); window.location.href='../dashboardAdmin.php';</script>";
    }
} else {
    // Jika diakses tanpa parameter id
    header("Location: ../dashboardAdmin.php");
}
?>

