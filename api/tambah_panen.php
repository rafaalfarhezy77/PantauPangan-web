<?php
require_once 'Server/koneksi.php';
session_start();

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'petani') {
    header("Location: login.php");
    exit;
}
?>

<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tambah Hasil Panen — PantauPangan</title>
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
</head>
<body class="bg-cream min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-md bg-white border border-cream-dark rounded-3xl p-8 shadow-xl shadow-green-900/5">
        <div class="text-center mb-8">
            <div class="w-16 h-16 bg-green-mist rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">🌾</div>
            <h1 class="text-2xl font-bold text-green-deep">Catat Hasil Panen</h1>
            <p class="text-gray-500 text-sm mt-1">Masukkan detail panen Anda dengan benar.</p>
        </div>

        <form action="Proses/prosesTambahPanen.php" method="POST" class="space-y-5">
            <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Nama Komoditas</label>
                <select name="nama_komoditas" required class="w-full px-4 py-3 rounded-xl border border-cream-dark bg-cream/50 focus:bg-white focus:border-green-mid outline-none transition-all text-sm font-medium">
                    <option value="">Pilih Komoditas</option>
                    <option value="Beras">Beras</option>
                    <option value="Cabai Merah">Cabai Merah</option>
                    <option value="Cabai Rawit">Cabai Rawit</option>
                    <option value="Bawang Merah">Bawang Merah</option>
                    <option value="Bawang Putih">Bawang Putih</option>
                    <option value="Jagung">Jagung</option>
                    <option value="Kedelai">Kedelai</option>
                </select>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Jumlah</label>
                    <input type="number" name="jumlah" step="0.01" required placeholder="0.00" class="w-full px-4 py-3 rounded-xl border border-cream-dark bg-cream/50 focus:bg-white focus:border-green-mid outline-none transition-all text-sm">
                </div>
                <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Satuan</label>
                    <select name="satuan" required class="w-full px-4 py-3 rounded-xl border border-cream-dark bg-cream/50 focus:bg-white focus:border-green-mid outline-none transition-all text-sm font-medium">
                        <option value="kg">kg</option>
                        <option value="ton">ton</option>
                        <option value="kuintal">kuintal</option>
                    </select>
                </div>
            </div>

            <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Tanggal Panen</label>
                <input type="date" name="tanggal_panen" required class="w-full px-4 py-3 rounded-xl border border-cream-dark bg-cream/50 focus:bg-white focus:border-green-mid outline-none transition-all text-sm">
            </div>

            <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Lokasi Lahan</label>
                <input type="text" name="lokasi_lahan" required placeholder="Contoh: Sawah Blok A" class="w-full px-4 py-3 rounded-xl border border-cream-dark bg-cream/50 focus:bg-white focus:border-green-mid outline-none transition-all text-sm">
            </div>

            <div class="pt-4 flex gap-3">
                <a href="panen.php" class="flex-1 px-6 py-3.5 rounded-xl border border-cream-dark text-center font-bold text-green-deep text-sm hover:bg-gray-50 transition-all no-underline">Batal</a>
                <button type="submit" class="flex-[2] bg-green-mid text-white font-bold py-3.5 rounded-xl hover:bg-green-deep transition-all shadow-lg shadow-green-900/20">Simpan Catatan</button>
            </div>
        </form>
    </div>
</body>
</html>
