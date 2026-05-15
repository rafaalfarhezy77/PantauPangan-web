<?php
require_once '../Server/koneksi.php';
session_start();

// Cek login dan role
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'petani') {
    header("Location: ../login.php");
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $user_id = $_SESSION['user_id'];
    $nama_komoditas = mysqli_real_escape_string($koneksi, $_POST['nama_komoditas']);
    $jumlah = mysqli_real_escape_string($koneksi, $_POST['jumlah']);
    $satuan = mysqli_real_escape_string($koneksi, $_POST['satuan']);
    $tanggal_panen = mysqli_real_escape_string($koneksi, $_POST['tanggal_panen']);
    $lokasi_lahan = mysqli_real_escape_string($koneksi, $_POST['lokasi_lahan']);

    // Validasi sederhana
    if (empty($nama_komoditas) || empty($jumlah) || empty($satuan) || empty($tanggal_panen) || empty($lokasi_lahan)) {
        header("Location: ../tambah_panen.php?error=Data tidak boleh kosong");
        exit;
    }

    $query = "INSERT INTO hasil_panen (user_id, nama_komoditas, jumlah, satuan, tanggal_panen, lokasi_lahan) 
              VALUES ('$user_id', '$nama_komoditas', '$jumlah', '$satuan', '$tanggal_panen', '$lokasi_lahan')";

    if (mysqli_query($koneksi, $query)) {
        header("Location: ../panen.php?status=success");
        exit;
    } else {
        header("Location: ../tambah_panen.php?error=" . mysqli_error($koneksi));
        exit;
    }
} else {
    header("Location: ../panen.php");
    exit;
}
?>
