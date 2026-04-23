<?php
session_start();
require '../Server/koneksi.php';

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    header("Location: ../dashboard.php");
    exit;
}

if (isset($_POST['update'])) {
    $id = mysqli_real_escape_string($koneksi, $_POST['id']);
    $username = mysqli_real_escape_string($koneksi, $_POST['username']);
    $email = mysqli_real_escape_string($koneksi, $_POST['email']);
    $role = mysqli_real_escape_string($koneksi, $_POST['role']);

    $admin_sekarang = isset($_SESSION['username']) ? $_SESSION['username'] : 'Admin';

    // Update data termasuk kolom updated_by
    $query = "UPDATE users SET 
              username = '$username', 
              email = '$email', 
              role = '$role', 
              updated_by = '$admin_sekarang' 
              WHERE id = '$id'";

    if (mysqli_query($koneksi, $query)) {
        echo "<script>alert('User berhasil diperbarui oleh $admin_sekarang'); window.location.href='../dashboardAdmin.php';</script>";
    } else {
        echo "<script>alert('Gagal memperbarui user'); window.location.href='../dashboardAdmin.php';</script>";
    }
} else {
    header("Location: ../dashboardAdmin.php");
}

