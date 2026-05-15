<?php
require_once 'Server/koneksi.php';
session_start();

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'petani') {
    header("Location: login.php");
    exit;
}

$user_id = $_SESSION['user_id'];
$query = mysqli_query($koneksi, "SELECT * FROM hasil_panen WHERE user_id = '$user_id' ORDER BY tanggal_panen DESC");
?>

<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Daftar Hasil Panen — PantauPangan</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'green-deep': '#1a3a2a',
                        'green-mid': '#2d6a4f',
                        'green-light': '#52b788',
                        'green-pale': '#b7e4c7',
                        'green-mist': '#d8f3dc',
                        'cream': '#faf7f2',
                        'cream-dark': '#f0ebe0',
                    }
                }
            }
        }
    </script>
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
    </style>
</head>
<body class="bg-cream min-h-screen p-4 md:p-8">
    <div class="max-w-6xl mx-auto">
        <div class="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
                <h1 class="text-2xl font-bold text-green-deep">Daftar Hasil Panen</h1>
                <p class="text-gray-500 text-sm">Kelola catatan hasil panen Anda secara efisien.</p>
            </div>
            <div class="flex gap-2">
                <a href="dashboard.php" class="px-5 py-2.5 rounded-xl border border-cream-dark bg-white text-green-deep font-semibold text-sm hover:bg-gray-50 transition-all no-underline">Kembali</a>
                <a href="tambah_panen.php" class="px-5 py-2.5 rounded-xl bg-green-mid text-white font-semibold text-sm hover:bg-green-deep transition-all no-underline shadow-lg shadow-green-900/20">Tambah Hasil Panen</a>
            </div>
        </div>

        <div class="bg-white border border-cream-dark rounded-2xl overflow-hidden shadow-sm">
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-gray-50 border-b border-cream-dark">
                            <th class="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400">Komoditas</th>
                            <th class="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400">Jumlah</th>
                            <th class="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400">Tanggal Panen</th>
                            <th class="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400">Lokasi Lahan</th>
                            <th class="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-cream-dark">
                        <?php if (mysqli_num_rows($query) > 0): ?>
                            <?php while ($row = mysqli_fetch_assoc($query)): ?>
                                <tr class="hover:bg-cream/50 transition-colors">
                                    <td class="px-6 py-4">
                                        <div class="flex items-center gap-3">
                                            <div class="w-8 h-8 bg-green-mist rounded-lg flex items-center justify-center text-sm">🌾</div>
                                            <span class="font-semibold text-green-deep"><?= htmlspecialchars($row['nama_komoditas']) ?></span>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4">
                                        <span class="text-sm font-medium text-gray-700"><?= number_format($row['jumlah'], 2) ?> <?= htmlspecialchars($row['satuan']) ?></span>
                                    </td>
                                    <td class="px-6 py-4">
                                        <span class="text-sm text-gray-500"><?= date('d M Y', strtotime($row['tanggal_panen'])) ?></span>
                                    </td>
                                    <td class="px-6 py-4">
                                        <span class="text-sm text-gray-500"><?= htmlspecialchars($row['lokasi_lahan']) ?></span>
                                    </td>
                                    <td class="px-6 py-4 text-center">
                                        <button class="text-xs font-semibold text-red-500 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors">Hapus</button>
                                    </td>
                                </tr>
                            <?php endwhile; ?>
                        <?php else: ?>
                            <tr>
                                <td colspan="5" class="px-6 py-12 text-center text-gray-400 italic">Belum ada data hasil panen.</td>
                            </tr>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</body>
</html>
