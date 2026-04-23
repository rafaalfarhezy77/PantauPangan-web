<?php
session_start();
require __DIR__ . '/Server/koneksi.php';

// Validasi Keamanan
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    header("Location: dashboard.php");
    exit;
}

// Ambil ID dari URL
if (!isset($_GET['id'])) {
    header("Location: dashboardAdmin.php");
    exit;
}
$id = mysqli_real_escape_string($koneksi, $_GET['id']);

// Proses Update Data
if (isset($_POST['update'])) {
    $role_baru = mysqli_real_escape_string($koneksi, $_POST['role']);
    $admin_sekarang = $_SESSION['username'];
    
    $query_update = "UPDATE users SET role = '$role_baru', updated_by = '$admin_sekarang' WHERE id = '$id'";
    if (mysqli_query($koneksi, $query_update)) {
        echo "<script>alert('Role user berhasil diubah!'); window.location.href='dashboardAdmin.php';</script>";
        exit;
    } else {
        $error = "Gagal mengubah data!";
    }
}

// Ambil data user saat ini untuk ditampilkan di form
$query = mysqli_query($koneksi, "SELECT * FROM users WHERE id = '$id'");
$user = mysqli_fetch_assoc($query);

if (!$user) {
    echo "<script>alert('User tidak ditemukan!'); window.location.href='dashboardAdmin.php';</script>";
    exit;
}
?>

<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Edit User — Admin PantauPangan</title>
<script src="https://cdn.tailwindcss.com"></script>
<script>
  tailwind.config = { theme: { extend: { colors: { 'green-deep': '#1a3a2a', 'green-mid': '#2d6a4f', 'green-light': '#52b788', 'green-pale': '#b7e4c7', 'green-mist': '#d8f3dc', 'cream': '#faf7f2', 'cream-dark': '#f0ebe0' } } } }
</script>
</head>
<body class="bg-cream min-h-screen flex items-center justify-center p-6">

  <div class="bg-white border border-cream-dark rounded-2xl shadow-lg p-8 w-full max-w-md">
    <div class="mb-6">
      <a href="dashboardAdmin.php" class="text-sm font-semibold text-gray-400 hover:text-green-mid no-underline">← Kembali</a>
      <h2 class="text-2xl font-bold text-green-deep mt-4">Edit Role Pengguna</h2>
      <p class="text-xs text-gray-500 mt-1">Ubah peran untuk <strong><?= htmlspecialchars($user['username']); ?></strong> (<?= htmlspecialchars($user['email']); ?>)</p>
    </div>

    <?php if(isset($error)): ?>
      <div class="mb-4 px-4 py-3 rounded-xl text-sm font-medium bg-red-50 text-red-600"><?= $error; ?></div>
    <?php endif; ?>

    <form method="POST" action="">
      <div class="space-y-4 mb-6">
        <div>
          <label class="block text-xs font-semibold text-gray-600 mb-1.5">Role Pengguna Saat Ini</label>
          <select name="role" required class="w-full px-4 py-2.5 bg-white border border-cream-dark rounded-xl text-sm outline-none focus:border-green-light">
            <option value="petani" <?= $user['role'] == 'petani' ? 'selected' : ''; ?>>🌾 Petani</option>
            <option value="pembeli" <?= $user['role'] == 'pembeli' ? 'selected' : ''; ?>>🛒 Pembeli</option>
            <option value="tengkulak" <?= $user['role'] == 'tengkulak' ? 'selected' : ''; ?>>🏪 Tengkulak</option>
            <option value="umum" <?= $user['role'] == 'umum' ? 'selected' : ''; ?>>👤 Umum</option>
            <option value="admin" <?= $user['role'] == 'admin' ? 'selected' : ''; ?>>🛡️ Admin</option>
          </select>
        </div>
      </div>

      <button type="submit" name="update" class="w-full py-3 bg-green-deep text-white font-semibold text-sm rounded-xl hover:bg-green-mid transition-colors cursor-pointer border-0">
        Simpan Perubahan
      </button>
    </form>
  </div>

</body>
</html>




