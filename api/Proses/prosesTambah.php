<?php
require __DIR__ . '/../Server/koneksi.php';
session_start();

// Validasi Keamanan
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    header("Location: ../dashboard.php");
    exit;
}

$pesan = '';
$tipe_pesan = '';

if (isset($_POST['tambah'])) {
    $username = mysqli_real_escape_string($koneksi, $_POST['username']);
    $email = mysqli_real_escape_string($koneksi, $_POST['email']);
    $password = mysqli_real_escape_string($koneksi, $_POST['password']);
    $role = mysqli_real_escape_string($koneksi, $_POST['role']);

    // Enkripsi password
    $password_hash = password_hash($password, PASSWORD_DEFAULT);

    // Cek apakah email sudah ada
    $cek_email = mysqli_query($koneksi, "SELECT * FROM users WHERE email='$email'");
    if (mysqli_num_rows($cek_email) > 0) {
        $pesan = "Email sudah digunakan!";
        $tipe_pesan = "error";
    } else {
        $query = "INSERT INTO users (username, email, password, role) VALUES ('$username', '$email', '$password_hash', '$role')";
        if (mysqli_query($koneksi, $query)) {
            echo "<script>alert('User berhasil ditambahkan!'); window.location.href='../dashboardAdmin.php';</script>";
            exit;
        } else {
            $pesan = "Terjadi kesalahan: " . mysqli_error($koneksi);
            $tipe_pesan = "error";
        }
    }
    $admin_pembuat = $_SESSION['username'];
    $query = "INSERT INTO users (username, email, password, role, created_by) 
        VALUES ('$username', '$email', '$password_hash', '$role', '$admin_pembuat')";
}
?>

<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Tambah User — Admin PantauPangan</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<script src="https://cdn.tailwindcss.com"></script>
<script>
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          'green-deep':  '#1a3a2a',
          'green-mid':   '#2d6a4f',
          'green-light': '#52b788',
          'green-pale':  '#b7e4c7',
          'green-mist':  '#d8f3dc',
          'cream':       '#faf7f2',
          'cream-dark':  '#f0ebe0',
        },
        fontFamily: { sans: ['Plus Jakarta Sans', 'sans-serif'] },
      }
    }
  }
</script>
</head>
<body class="bg-cream min-h-screen flex items-center justify-center p-6">

  <div class="bg-white border border-cream-dark rounded-2xl shadow-lg p-8 w-full max-w-md">
    <div class="mb-6">
      <a href="../dashboardAdmin.php" class="text-sm font-semibold text-gray-400 hover:text-green-mid no-underline">← Kembali</a>
      <h2 class="text-2xl font-bold text-green-deep mt-4">Tambah User Baru</h2>
      <p class="text-xs text-gray-500 mt-1">Tambahkan kredensial akses untuk pengguna atau admin.</p>
    </div>

    <?php if($pesan != ''): ?>
      <div class="mb-4 px-4 py-3 rounded-xl text-sm font-medium bg-red-50 text-red-600">
        <?= $pesan; ?>
      </div>
    <?php endif; ?>

    <form method="POST" action="">
      <div class="space-y-4 mb-6">
        <div>
          <label class="block text-xs font-semibold text-gray-600 mb-1.5">Username</label>
          <input type="text" name="username" required class="w-full px-4 py-2.5 bg-white border border-cream-dark rounded-xl text-sm outline-none focus:border-green-light">
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
          <input type="email" name="email" required class="w-full px-4 py-2.5 bg-white border border-cream-dark rounded-xl text-sm outline-none focus:border-green-light">
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-600 mb-1.5">Password</label>
          <input type="password" name="password" required class="w-full px-4 py-2.5 bg-white border border-cream-dark rounded-xl text-sm outline-none focus:border-green-light">
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-600 mb-1.5">Role Pengguna</label>
          <select name="role" required class="w-full px-4 py-2.5 bg-white border border-cream-dark rounded-xl text-sm outline-none focus:border-green-light">
            <option value="petani">🌾 Petani</option>
            <option value="pembeli">🛒 Pembeli</option>
            <option value="tengkulak">🏪 Tengkulak</option>
            <option value="admin">🛡️ Admin</option>
          </select>
        </div>
      </div>

      <button type="submit" name="tambah" class="w-full py-3 bg-green-deep text-white font-semibold text-sm rounded-xl hover:bg-green-mid transition-colors cursor-pointer border-0">
        Simpan User
      </button>
    </form>
  </div>

</body>
</html>


