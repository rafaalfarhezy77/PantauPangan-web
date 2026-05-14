<?php
require __DIR__ . '/Server/koneksi.php';
session_start();

if (!isset($_SESSION['user_id'])) {
    header("Location: login.php"); exit;
}

$role = strtolower(trim($_SESSION['role']));
if (!in_array($role, ['admin-komoditas', 'superadmin'])) {
    echo "<script>alert('Akses Ditolak!'); window.location.href='dashboard.php';</script>"; exit;
}

// Ambil daftar slug komoditas
$valid_slugs = [];
$res = mysqli_query($koneksi, "SELECT slug_id, nama FROM komoditas ORDER BY nama ASC");
if ($res) {
    while ($row = mysqli_fetch_assoc($res)) {
        $valid_slugs[$row['slug_id']] = $row['nama'];
    }
}

// Ambil 10 riwayat import terbaru (jika tabel ada)
$import_logs = [];
$res_log = @mysqli_query($koneksi, "SELECT * FROM import_log ORDER BY created_at DESC LIMIT 10");
if ($res_log) {
    while ($r = mysqli_fetch_assoc($res_log)) $import_logs[] = $r;
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Panel Komoditas — PantauPangan</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<script src="https://cdn.tailwindcss.com"></script>
<script>
  tailwind.config = {
    theme: { extend: {
      colors: {
        'green-deep':'#1a3a2a','green-mid':'#2d6a4f','green-light':'#52b788',
        'green-pale':'#b7e4c7','green-mist':'#d8f3dc','cream':'#faf7f2','cream-dark':'#f0ebe0',
        'amber-soft':'#fef3c7','amber-deep':'#d97706',
      },
      fontFamily: { sans: ['Plus Jakarta Sans','sans-serif'] }
    }}
  }
</script>
<style>
  body { font-family:'Plus Jakarta Sans',sans-serif; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes spin { to{transform:rotate(360deg)} }
  .anim-0{animation:fadeUp .5s ease both}
  .anim-1{animation:fadeUp .5s .1s ease both}
  .anim-2{animation:fadeUp .5s .2s ease both}
  .spinner{animation:spin 1s linear infinite;display:inline-block}
  #dropzone.drag-over{ border-color:#52b788; background:#d8f3dc; }
  .custom-scrollbar::-webkit-scrollbar{width:4px}
  .custom-scrollbar::-webkit-scrollbar-thumb{background:rgba(0,0,0,.1);border-radius:10px}
</style>
</head>
<body class="bg-cream min-h-screen">

<!-- NAV -->
<nav class="sticky top-0 z-50 bg-green-deep h-16 flex items-center justify-between px-6 md:px-10 shadow-md">
  <div class="flex items-center gap-3">
    <div class="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center text-lg">📦</div>
    <span class="font-bold text-white text-lg">Panel <span class="text-green-pale">Komoditas</span></span>
    <span class="hidden sm:inline-flex items-center gap-1 ml-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-soft text-amber-deep">🌾 Admin Komoditas</span>
  </div>
  <div class="flex items-center gap-4">
    <span class="text-sm text-green-pale hidden sm:block">👤 <?= htmlspecialchars($_SESSION['username']) ?></span>
    <a href="dashboard.php" class="text-xs text-white/60 hover:text-white transition-colors no-underline">← Dashboard</a>
    <a href="Proses/prosesLogout.php" onclick="doLogout(event)" class="text-xs text-red-400/70 hover:text-red-400 transition-colors no-underline">🚪 Keluar</a>
  </div>
</nav>

<main class="max-w-5xl mx-auto p-5 md:p-10 space-y-6">

  <!-- HEADER BANNER -->
  <div class="anim-0 relative bg-gradient-to-br from-green-deep to-green-mid rounded-2xl p-6 overflow-hidden">
    <div class="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2260%22 height=%2260%22><path fill=%22white%22 d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/></svg>')]"></div>
    <div class="relative z-10">
      <p class="text-green-pale text-sm font-medium mb-1">📦 Panel Komoditas — Import Data PIHPS</p>
      <h1 class="text-2xl font-bold text-white mb-1">Upload Data Harga Komoditas</h1>
      <p class="text-white/60 text-sm">Upload file CSV dari PIHPS, pilih komoditas, dan tentukan tanggal data. Sistem akan memproses secara otomatis.</p>
    </div>
    <span class="absolute right-8 top-1/2 -translate-y-1/2 text-8xl opacity-10 pointer-events-none select-none">📊</span>
  </div>

  <!-- ALERT GLOBAL -->
  <div id="globalAlert" class="hidden rounded-xl px-5 py-4 text-sm font-medium anim-1"></div>

  <!-- FORM UPLOAD -->
  <div class="anim-1 bg-white border border-cream-dark rounded-2xl overflow-hidden shadow-sm">
    <div class="px-6 py-4 border-b border-cream-dark">
      <p class="font-bold text-green-deep">📤 Import CSV Baru</p>
      <p class="text-xs text-gray-400 mt-0.5">Format CSV harus sesuai format PIHPS: kolom No, Wilayah, dan tanggal (dd/mm/yyyy).</p>
    </div>
    <form id="importForm" class="p-6 space-y-5" onsubmit="handleImport(event)">

      <!-- Slug Komoditas -->
      <div>
        <label class="block text-xs font-semibold text-gray-600 mb-1.5">🌾 Pilih Komoditas <span class="text-red-500">*</span></label>
        <select id="slugSelect" name="slug_komoditas" required
          class="w-full px-4 py-3 bg-white border border-cream-dark rounded-xl text-sm outline-none focus:border-green-light transition-colors">
          <option value="">— Pilih komoditas —</option>
          <?php foreach ($valid_slugs as $slug => $nama): ?>
          <option value="<?= htmlspecialchars($slug) ?>"><?= htmlspecialchars($nama) ?> <span class="text-gray-400">(<?= htmlspecialchars($slug) ?>)</span></option>
          <?php endforeach; ?>
        </select>
      </div>

      <!-- Tanggal Upload -->
      <div>
        <label class="block text-xs font-semibold text-gray-600 mb-1.5">📅 Tanggal Data <span class="text-red-500">*</span></label>
        <input type="date" id="tanggalInput" name="tanggal_upload" required
          value="<?= date('Y-m-d') ?>"
          class="w-full px-4 py-3 bg-white border border-cream-dark rounded-xl text-sm outline-none focus:border-green-light transition-colors">
        <p class="text-xs text-gray-400 mt-1">Tanggal referensi untuk data ini (biasanya tanggal terbaru dalam CSV).</p>
      </div>

      <!-- Dropzone CSV -->
      <div>
        <label class="block text-xs font-semibold text-gray-600 mb-1.5">📂 File CSV <span class="text-red-500">*</span></label>
        <div id="dropzone"
          class="border-2 border-dashed border-cream-dark rounded-xl p-8 text-center cursor-pointer hover:border-green-light hover:bg-green-mist/30 transition-all"
          onclick="document.getElementById('csvInput').click()"
          ondragover="handleDragOver(event)"
          ondragleave="handleDragLeave(event)"
          ondrop="handleDrop(event)">
          <div id="dropzoneContent">
            <div class="text-4xl mb-3">📁</div>
            <p class="text-sm font-semibold text-gray-600">Klik untuk memilih file atau drag & drop di sini</p>
            <p class="text-xs text-gray-400 mt-1">Hanya file <strong>.csv</strong> — Maks. 10 MB</p>
          </div>
        </div>
        <input type="file" id="csvInput" name="csv_file" accept=".csv" class="hidden" onchange="handleFileSelect(this)">
      </div>

      <!-- Force Update -->
      <div class="flex items-center gap-3 p-4 bg-amber-soft/60 border border-amber-deep/20 rounded-xl">
        <input type="checkbox" id="forceUpdate" name="force_update" value="1"
          class="w-4 h-4 accent-amber-600 cursor-pointer">
        <div>
          <label for="forceUpdate" class="text-sm font-semibold text-amber-deep cursor-pointer">⚠️ Timpa data lama</label>
          <p class="text-xs text-gray-500 mt-0.5">Aktifkan jika ingin memperbarui data yang sudah ada untuk tanggal yang sama.</p>
        </div>
      </div>

      <!-- Submit -->
      <button type="submit" id="submitBtn"
        class="w-full py-3.5 bg-green-deep text-white font-semibold text-sm rounded-xl hover:bg-green-mid transition-colors cursor-pointer border-0 flex items-center justify-center gap-2">
        <span id="submitIcon">📤</span>
        <span id="submitText">Import Data CSV</span>
      </button>
    </form>
  </div>

  <!-- PROGRESS PANEL (hidden) -->
  <div id="progressPanel" class="hidden anim-1 bg-white border border-cream-dark rounded-2xl p-6 shadow-sm">
    <p class="font-bold text-green-deep mb-4">⏳ Sedang Memproses...</p>
    <div class="w-full bg-cream-dark rounded-full h-2 mb-3">
      <div id="progressBar" class="bg-green-light h-2 rounded-full transition-all duration-500" style="width:0%"></div>
    </div>
    <p id="progressText" class="text-xs text-gray-500">Mengunggah file...</p>
  </div>

  <!-- HASIL IMPORT -->
  <div id="resultPanel" class="hidden anim-2 bg-white border border-cream-dark rounded-2xl overflow-hidden shadow-sm">
    <div class="px-6 py-4 border-b border-cream-dark">
      <p class="font-bold text-green-deep">📋 Hasil Import Terakhir</p>
    </div>
    <div id="resultContent" class="p-6"></div>
  </div>

  <!-- RIWAYAT IMPORT -->
  <div class="anim-2 bg-white border border-cream-dark rounded-2xl overflow-hidden shadow-sm">
    <div class="px-6 py-4 border-b border-cream-dark flex items-center justify-between">
      <div>
        <p class="font-bold text-green-deep">🕒 Riwayat Import</p>
        <p class="text-xs text-gray-400 mt-0.5">10 import terakhir yang dilakukan</p>
      </div>
      <button onclick="loadLogs()" class="text-xs font-semibold text-green-mid bg-green-mist px-3 py-1.5 rounded-full hover:bg-green-pale transition-colors border-0 cursor-pointer">↻ Refresh</button>
    </div>
    <div id="logsContainer" class="custom-scrollbar max-h-72 overflow-y-auto">
      <?php if (empty($import_logs)): ?>
      <div class="text-center py-8 text-gray-400 text-sm">
        <div class="text-3xl mb-2">📭</div>
        <p>Belum ada riwayat import.</p>
        <?php if (!$res_log): ?>
        <p class="text-xs mt-1 text-amber-deep">⚠️ Tabel <code>import_log</code> belum dibuat. Log akan tersedia setelah tabel dibuat.</p>
        <?php endif; ?>
      </div>
      <?php else: ?>
      <table class="w-full text-sm text-left">
        <thead class="bg-cream text-[0.65rem] uppercase tracking-wider text-gray-400 border-b border-cream-dark">
          <tr>
            <th class="px-5 py-3">Komoditas</th>
            <th class="px-5 py-3">File</th>
            <th class="px-5 py-3">Tanggal Data</th>
            <th class="px-5 py-3">Entri</th>
            <th class="px-5 py-3">Diupload Oleh</th>
            <th class="px-5 py-3">Waktu</th>
            <th class="px-5 py-3 text-center">Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-cream-dark" id="logsBody">
          <?php foreach ($import_logs as $log): ?>
          <tr class="hover:bg-cream/50">
            <td class="px-5 py-3 font-semibold text-green-deep"><?= htmlspecialchars($log['slug_komoditas']) ?></td>
            <td class="px-5 py-3 text-xs text-gray-500 truncate max-w-[140px]"><?= htmlspecialchars($log['filename'] ?? '-') ?></td>
            <td class="px-5 py-3 text-xs text-gray-600"><?= htmlspecialchars($log['tanggal_upload'] ?? '-') ?></td>
            <td class="px-5 py-3 font-bold text-green-mid"><?= number_format($log['total_entri']) ?></td>
            <td class="px-5 py-3 text-xs text-gray-500"><?= htmlspecialchars($log['uploaded_by']) ?></td>
            <td class="px-5 py-3 text-xs text-gray-400"><?= date('d M Y H:i', strtotime($log['created_at'])) ?></td>
            <td class="px-5 py-3 text-center">
              <?php if ($log['errors'] > 0): ?>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600"><?= $log['errors'] ?> Error</span>
              <?php else: ?>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-mist text-green-700">✓ Sukses</span>
              <?php endif; ?>
            </td>
          </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
      <?php endif; ?>
    </div>
  </div>

  <!-- INFO BOX -->
  <div class="anim-2 bg-amber-soft border border-amber-deep/20 rounded-2xl p-5">
    <p class="font-bold text-amber-deep mb-2">📌 Panduan Format CSV PIHPS</p>
    <ul class="text-sm text-gray-600 space-y-1 list-disc list-inside">
      <li>Kolom pertama: <strong>No</strong> (Angka Romawi untuk Provinsi, Angka Arab untuk Kab/Kota)</li>
      <li>Kolom kedua: <strong>Wilayah</strong> (nama provinsi atau kabupaten/kota)</li>
      <li>Kolom ketiga dst: <strong>Tanggal</strong> dalam format <code class="bg-white px-1 rounded">dd/mm/yyyy</code></li>
      <li>Nilai harga boleh mengandung titik sebagai pemisah ribuan (misal: <code class="bg-white px-1 rounded">14.500</code>)</li>
      <li>Gunakan tanda <code class="bg-white px-1 rounded">-</code> untuk data yang tidak tersedia</li>
    </ul>
  </div>

</main>

<script>
let selectedFile = null;

// ── File drag & drop ──
function handleDragOver(e) {
  e.preventDefault();
  document.getElementById('dropzone').classList.add('drag-over');
}
function handleDragLeave(e) {
  document.getElementById('dropzone').classList.remove('drag-over');
}
function handleDrop(e) {
  e.preventDefault();
  document.getElementById('dropzone').classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) setFile(file);
}
function handleFileSelect(input) {
  if (input.files[0]) setFile(input.files[0]);
}
function setFile(file) {
  if (!file.name.endsWith('.csv')) {
    showAlert('❌ Hanya file .csv yang diperbolehkan.', 'error');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    showAlert('❌ File terlalu besar (maks. 10 MB).', 'error');
    return;
  }
  selectedFile = file;
  const size = (file.size / 1024).toFixed(1);
  document.getElementById('dropzoneContent').innerHTML = `
    <div class="text-4xl mb-3">✅</div>
    <p class="text-sm font-bold text-green-deep">${file.name}</p>
    <p class="text-xs text-gray-400 mt-1">${size} KB — Klik untuk ganti file</p>`;
  document.getElementById('csvInput').files; // keep reference
}

// ── Submit form ──
async function handleImport(e) {
  e.preventDefault();

  const slug = document.getElementById('slugSelect').value;
  const tanggal = document.getElementById('tanggalInput').value;

  if (!slug) { showAlert('⚠️ Pilih komoditas terlebih dahulu.', 'error'); return; }
  if (!tanggal) { showAlert('⚠️ Tanggal data wajib diisi.', 'error'); return; }
  if (!selectedFile) { showAlert('⚠️ Pilih file CSV terlebih dahulu.', 'error'); return; }

  // Tampilkan Modal Konfirmasi Custom
  const komoditasName = document.getElementById('slugSelect').options[document.getElementById('slugSelect').selectedIndex].text;
  
  document.getElementById('confKomoditas').textContent = komoditasName;
  document.getElementById('confTanggal').textContent = tanggal;
  document.getElementById('confFile').textContent = selectedFile.name;
  
  const modal = document.getElementById('confirmModal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

// Fungsi yang dipanggil saat tombol "Ya, Import" di klik di modal
async function executeImport() {
  closeConfirmModal();
  
  const slug = document.getElementById('slugSelect').value;
  const tanggal = document.getElementById('tanggalInput').value;

  // UI loading
  const btn = document.getElementById('submitBtn');
  document.getElementById('submitIcon').textContent = '⏳';
  document.getElementById('submitText').textContent = 'Sedang memproses...';
  btn.disabled = true;
  btn.classList.add('opacity-60');

  document.getElementById('progressPanel').classList.remove('hidden');
  document.getElementById('progressBar').style.width = '30%';
  document.getElementById('progressText').textContent = 'Mengunggah file CSV...';
  document.getElementById('globalAlert').classList.add('hidden');
  document.getElementById('resultPanel').classList.add('hidden');

  const formData = new FormData();
  formData.append('slug_komoditas', slug);
  formData.append('tanggal_upload', tanggal);
  formData.append('csv_file', selectedFile);
  if (document.getElementById('forceUpdate').checked) {
    formData.append('force_update', '1');
  }

  try {
    document.getElementById('progressBar').style.width = '60%';
    document.getElementById('progressText').textContent = 'Memproses dan menyimpan ke database...';

    const res = await fetch('Proses/prosesImportCSV.php', {
      method: 'POST',
      credentials: 'include',
      body: formData
    });

    document.getElementById('progressBar').style.width = '100%';
    document.getElementById('progressText').textContent = 'Selesai!';

    const result = await res.json();
    setTimeout(() => {
      document.getElementById('progressPanel').classList.add('hidden');
      showResult(result);
      if (result.success) loadLogs();
    }, 600);

  } catch (err) {
    document.getElementById('progressPanel').classList.add('hidden');
    showAlert('❌ Gagal terhubung ke server. Periksa koneksi dan coba lagi.', 'error');
  } finally {
    document.getElementById('submitIcon').textContent = '📤';
    document.getElementById('submitText').textContent = 'Import Data CSV';
    btn.disabled = false;
    btn.classList.remove('opacity-60');
  }
}

function showResult(r) {
  const panel = document.getElementById('resultPanel');
  const content = document.getElementById('resultContent');
  panel.classList.remove('hidden');

  if (r.duplicate) {
    content.innerHTML = `
      <div class="flex gap-3 items-start p-4 bg-amber-soft border border-amber-deep/30 rounded-xl mb-4">
        <span class="text-2xl">⚠️</span>
        <div>
          <p class="font-bold text-amber-deep">Data Duplikat Terdeteksi</p>
          <p class="text-sm text-gray-600 mt-1">${r.message}</p>
          <p class="text-xs text-gray-400 mt-1">${r.hint}</p>
        </div>
      </div>`;
    return;
  }

  if (r.success) {
    content.innerHTML = `
      <div class="flex gap-3 items-start p-4 bg-green-mist border border-green-light/40 rounded-xl mb-4">
        <span class="text-2xl">✅</span>
        <div><p class="font-bold text-green-deep">Import Berhasil!</p><p class="text-sm text-gray-600 mt-1">${r.message}</p></div>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        ${statCard('📊 Total Entri', r.total_entri.toLocaleString('id-ID'), 'bg-blue-50 text-blue-700')}
        ${statCard('🌍 Nasional', (r.db_nasional||0).toLocaleString('id-ID'), 'bg-green-mist text-green-700')}
        ${statCard('🗺️ Provinsi', (r.db_provinsi||0).toLocaleString('id-ID'), 'bg-purple-50 text-purple-700')}
        ${statCard('🏙️ Kab/Kota', (r.db_kab_kota||0).toLocaleString('id-ID'), 'bg-orange-50 text-orange-700')}
      </div>`;
  } else {
    content.innerHTML = `
      <div class="flex gap-3 items-start p-4 bg-red-50 border border-red-200 rounded-xl">
        <span class="text-2xl">❌</span>
        <div><p class="font-bold text-red-700">Import Gagal</p><p class="text-sm text-gray-600 mt-1">${r.message}</p></div>
      </div>`;
  }
}

function statCard(label, value, color) {
  return `<div class="rounded-xl p-4 ${color} bg-opacity-50">
    <p class="text-xs font-semibold mb-1 opacity-70">${label}</p>
    <p class="text-xl font-bold">${value}</p>
  </div>`;
}

function showAlert(msg, type) {
  const el = document.getElementById('globalAlert');
  el.textContent = msg;
  el.className = 'rounded-xl px-5 py-4 text-sm font-medium ' +
    (type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-mist text-green-deep border border-green-light/40');
  el.classList.remove('hidden');
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function loadLogs() {
  try {
    const res = await fetch('api_import_log.php', { credentials: 'include' });
    const data = await res.json();
    if (!data.success || !data.logs) return;
    const body = document.getElementById('logsBody');
    if (!body) {
      document.getElementById('logsContainer').innerHTML = renderLogsTable(data.logs);
      return;
    }
    body.innerHTML = data.logs.map(l => `
      <tr class="hover:bg-cream/50">
        <td class="px-5 py-3 font-semibold text-green-deep">${l.slug_komoditas}</td>
        <td class="px-5 py-3 text-xs text-gray-500 truncate max-w-[140px]">${l.filename||'-'}</td>
        <td class="px-5 py-3 text-xs text-gray-600">${l.tanggal_upload||'-'}</td>
        <td class="px-5 py-3 font-bold text-green-mid">${parseInt(l.total_entri).toLocaleString('id-ID')}</td>
        <td class="px-5 py-3 text-xs text-gray-500">${l.uploaded_by}</td>
        <td class="px-5 py-3 text-xs text-gray-400">${l.created_at}</td>
        <td class="px-5 py-3 text-center">${parseInt(l.errors)>0
          ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600">${l.errors} Error</span>`
          : `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-mist text-green-700">✓ Sukses</span>`}</td>
      </tr>`).join('');
  } catch(e) { console.warn('Gagal refresh log:', e); }
}

function renderLogsTable(logs) {
  if (!logs.length) return '<div class="text-center py-8 text-gray-400 text-sm">Belum ada riwayat.</div>';
  return `<table class="w-full text-sm text-left">...</table>`;
}

function closeConfirmModal() {
  const modal = document.getElementById('confirmModal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

async function doLogout(e) {
  e.preventDefault();
  await fetch('logout.php', { credentials: 'include' });
  localStorage.clear();
  window.location.href = 'login.php';
}
</script>

<!-- MODAL KONFIRMASI CUSTOM -->
<div id="confirmModal" class="hidden fixed inset-0 z-[100] items-center justify-center p-4 bg-green-deep/60 backdrop-blur-sm">
  <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden anim-0">
    <div class="p-6 text-center">
      <div class="w-16 h-16 bg-amber-soft text-amber-deep rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">❓</div>
      <h3 class="text-xl font-bold text-green-deep mb-2">Konfirmasi Import</h3>
      <p class="text-sm text-gray-500 mb-6">Mohon periksa kembali data sebelum disimpan ke database.</p>
      
      <div class="bg-cream border border-cream-dark rounded-2xl p-4 text-left space-y-3 mb-6">
        <div class="flex justify-between items-center text-xs">
          <span class="text-gray-400">Komoditas:</span>
          <span id="confKomoditas" class="font-bold text-green-deep text-right"></span>
        </div>
        <div class="flex justify-between items-center text-xs">
          <span class="text-gray-400">Tanggal Data:</span>
          <span id="confTanggal" class="font-bold text-green-deep"></span>
        </div>
        <div class="flex justify-between items-center text-xs">
          <span class="text-gray-400">File CSV:</span>
          <span id="confFile" class="font-bold text-green-mid truncate max-w-[180px]"></span>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <button onclick="closeConfirmModal()" 
          class="py-3 px-4 bg-gray-100 text-gray-600 font-semibold text-sm rounded-xl hover:bg-gray-200 transition-colors border-0 cursor-pointer">
          Batal
        </button>
        <button onclick="executeImport()" 
          class="py-3 px-4 bg-green-deep text-white font-semibold text-sm rounded-xl hover:bg-green-mid transition-colors border-0 cursor-pointer shadow-lg shadow-green-deep/20">
          Ya, Import Sekarang
        </button>
      </div>
    </div>
    <div class="bg-amber-soft/50 py-3 px-6 text-[10px] text-amber-700 text-center border-t border-amber-deep/10">
      ⚠️ Data yang sudah ditimpa tidak dapat dikembalikan.
    </div>
  </div>
</div>

</body>
</html>
