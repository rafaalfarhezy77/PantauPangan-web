<?php
session_start();
require '../Server/koneksi.php';

// Validasi Keamanan
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    echo "<script>alert('Akses Ditolak! Halaman ini hanya untuk Admin.'); window.location.href='dashboard.php';</script>";
    exit;
}

$query_users = mysqli_query($koneksi, "SELECT * FROM users ORDER BY id DESC");
?>

<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Admin Dashboard — PantauPangan</title>
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
<body class="bg-cream min-h-screen">

  <nav class="sticky top-0 z-50 bg-green-deep h-16 flex items-center justify-between px-6 md:px-10 shadow-md">
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center text-lg">🛡️</div>
      <span class="font-bold text-white text-lg">Admin<span class="text-green-pale">Panel</span></span>
    </div>
    <div class="flex items-center gap-4">
      <a href="dashboard.php" class="text-sm text-green-pale hover:text-white transition-colors no-underline">Kembali ke Dashboard</a>
    </div>
  </nav>

  <main class="max-w-6xl mx-auto p-6 md:p-10">
    <div class="flex flex-wrap items-center justify-between gap-4 mb-8">
      <div>
        <h1 class="text-2xl font-bold text-green-deep">Manajemen Pengguna</h1>
        <p class="text-sm text-gray-500 mt-1">Kelola data user, tambah admin, atau hapus akun.</p>
      </div>
      <a href="../Proses/prosesTambah.php" class="px-5 py-2.5 bg-green-mid text-white text-sm font-semibold rounded-xl hover:bg-green-deep transition-colors shadow-sm no-underline">
        + Tambah User Baru
      </a>
    </div>

    <div class="bg-white border border-cream-dark rounded-2xl overflow-hidden shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left">
            <thead class="bg-cream border-b border-cream-dark text-gray-500 uppercase text-[0.7rem] tracking-wider">
                <tr>
                <th class="px-6 py-4">User Info</th>
                <th class="px-6 py-4">Role</th>
                <th class="px-6 py-4">Riwayat Dibuat</th>
                <th class="px-6 py-4">Terakhir Diubah</th>
                <th class="px-6 py-4 text-center">Aksi</th>
                </tr>
            </thead>
          <tbody class="divide-y divide-cream-dark">
            <?php while($row = mysqli_fetch_assoc($query_users)): ?>
            <tr class="hover:bg-cream/50">
            <td class="px-6 py-4">
                <div class="font-bold text-gray-800"><?= htmlspecialchars($row['username']); ?></div>
                <div class="text-xs text-gray-500"><?= htmlspecialchars($row['email']); ?></div>
            </td>
            <td class="px-6 py-4">
                
                <?php if($row['role'] == 'admin'): ?>
                    <span class="px-2 py-1 rounded-md text-[10px] font-bold bg-red-700 text-red-50">ADMIN</span>
                <?php else: ?>
                    <span class="px-2 py-1 rounded-md text-[10px] font-bold bg-green-mist text-green-700"><?= strtoupper($row['role']); ?></span>    
                <?php endif; ?>
            </td>
            <td class="px-6 py-4 text-[11px] text-gray-600">
                <span class="block font-semibold"><?= date('d M Y', strtotime($row['created_at'])); ?></span>
                <span class="text-gray-400">Oleh: <?= htmlspecialchars($row['created_by']); ?></span>
            </td>
            <td class="px-6 py-4 text-[11px] text-gray-600">
                <?php if(!empty($row['updated_by'])) : ?>
                    <span class="block font-semibold">
                        <?= date('d M Y H:i', strtotime($row['updated_at'])); ?>
                    </span>
                    <span class="text-gray-400">Oleh: <?= htmlspecialchars($row['updated_by']); ?></span>
                <?php else : ?>
                    <span class="text-gray-300 italic">Belum pernah diedit</span>
                <?php endif; ?>
            </td>
            <td class="px-6 py-4 flex justify-center gap-2">
                <a href="edit_user.php?id=<?= $row['id']; ?>" class="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-semibold text-xs transition-colors no-underline">Edit</a>

                <?php if($row['id'] != $_SESSION['user_id']): ?>
                    <a href="../Proses/prosesHapus.php?id=<?= $row['id']; ?>" 
                    onclick="return confirm('Yakin ingin menghapus user ini?');"
                    class="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-semibold text-xs transition-colors no-underline">
                    Hapus
                    </a>
                <?php else: ?>
                    <span class="px-3 py-1.5 bg-gray-100 text-gray-400 rounded-lg text-xs font-semibold cursor-not-allowed">Anda</span>
                <?php endif; ?>
                
            </td>
            </tr>
            <?php endwhile; ?>
        </tbody>
        </table>
      </div>
      <?php if(mysqli_num_rows($query_users) == 0): ?>
        <div class="text-center py-8 text-gray-400 text-sm">Belum ada data pengguna.</div>
      <?php endif; ?>
    </div>
  </main>

</body>
</html>
