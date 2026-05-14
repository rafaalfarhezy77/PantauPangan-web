<?php
require __DIR__ . '/Server/koneksi.php';
session_start();

if (!isset($_SESSION['user_id'])) {
    header("Location: login.php"); exit;
}

$role = strtolower(trim($_SESSION['role']));
if (!in_array($role, ['admin-berita', 'superadmin'])) {
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

// Ambil 10 riwayat berita terbaru (bisa dari tabel berita)
$berita_terbaru = [];
$res_berita = @mysqli_query($koneksi, "SELECT * FROM berita ORDER BY created_at DESC LIMIT 10");
if ($res_berita) {
    while ($r = mysqli_fetch_assoc($res_berita)) $berita_terbaru[] = $r;
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Panel Berita — PantauPangan</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<script src="https://cdn.tailwindcss.com"></script>
<script>
  tailwind.config = {
    theme: { extend: {
      colors: {
        'green-deep':'#1a3a2a','green-mid':'#2d6a4f','green-light':'#52b788',
        'green-pale':'#b7e4c7','green-mist':'#d8f3dc','cream':'#faf7f2','cream-dark':'#f0ebe0',
        'amber-soft':'#fef3c7','amber-deep':'#d97706','blue-soft':'#dbeafe','blue-deep':'#1e3a8a',
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
  #dropzone.drag-over{ border-color:#3b82f6; background:#eff6ff; }
  .custom-scrollbar::-webkit-scrollbar{width:4px}
  .custom-scrollbar::-webkit-scrollbar-thumb{background:rgba(0,0,0,.1);border-radius:10px}
</style>
</head>
<body class="bg-cream min-h-screen">

<!-- NAV -->
<nav class="sticky top-0 z-50 bg-green-deep h-16 flex items-center justify-between px-6 md:px-10 shadow-md">
  <div class="flex items-center gap-3">
    <div class="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center text-lg">📰</div>
    <span class="font-bold text-white text-lg">Panel <span class="text-green-pale">Berita</span></span>
    <span class="hidden sm:inline-flex items-center gap-1 ml-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">📰 Admin Berita</span>
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
      <p class="text-green-pale text-sm font-medium mb-1">📰 Panel Berita — Upload & Kelola Artikel</p>
      <h1 class="text-2xl font-bold text-white mb-1">Upload Berita Pangan</h1>
      <p class="text-white/60 text-sm">Tambahkan berita terkini terkait harga pangan, cuaca, atau regulasi yang dapat mempengaruhi inflasi.</p>
    </div>
    <span class="absolute right-8 top-1/2 -translate-y-1/2 text-8xl opacity-10 pointer-events-none select-none">📝</span>
  </div>

  <!-- ALERT GLOBAL -->
  <div id="globalAlert" class="hidden rounded-xl px-5 py-4 text-sm font-medium anim-1"></div>

  <!-- FORM UPLOAD -->
  <div class="anim-1 bg-white border border-cream-dark rounded-2xl overflow-hidden shadow-sm">
    <div class="px-6 py-4 border-b border-cream-dark">
      <p class="font-bold text-green-deep">✍️ Tulis Berita Baru</p>
    </div>
    
    <div class="p-6">
      <form id="uploadForm" class="space-y-5" onsubmit="handleUpload(event)">
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1.5">Judul Berita <span class="text-red-500">*</span></label>
            <input type="text" id="judulInput" required placeholder="Contoh: Harga Beras Naik Menjelang Ramadhan"
                   class="w-full px-4 py-3 bg-cream/50 border border-cream-dark rounded-xl text-sm outline-none focus:border-green-light focus:bg-white transition-colors">
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1.5">Sumber Berita <span class="text-gray-400 font-normal">(Contoh: Bapanas, Antara, dll)</span></label>
            <input type="text" id="sumberInput" placeholder="Masukkan sumber berita..."
                   class="w-full px-4 py-3 bg-cream/50 border border-cream-dark rounded-xl text-sm outline-none focus:border-green-light focus:bg-white transition-colors">
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-600 mb-1.5">Deskripsi Lengkap <span class="text-red-500">*</span></label>
          <textarea id="deskripsiInput" rows="5" required placeholder="Tuliskan detail berita di sini..."
                    class="w-full px-4 py-3 bg-cream/50 border border-cream-dark rounded-xl text-sm outline-none focus:border-green-light focus:bg-white transition-colors resize-none"></textarea>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1.5">Terkait Komoditas <span class="text-gray-400 font-normal">(Opsional)</span></label>
            <select id="slugSelect" class="w-full px-4 py-3 bg-cream/50 border border-cream-dark rounded-xl text-sm outline-none focus:border-green-light focus:bg-white transition-colors cursor-pointer">
              <option value="">— Tidak Spesifik —</option>
              <?php foreach($valid_slugs as $slug => $nama): ?>
                <option value="<?= htmlspecialchars($slug) ?>"><?= htmlspecialchars($nama) ?></option>
              <?php endforeach; ?>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1.5">Tanggal Berita <span class="text-red-500">*</span></label>
            <input type="date" id="tanggalInput" required value="<?= date('Y-m-d') ?>"
                   class="w-full px-4 py-3 bg-cream/50 border border-cream-dark rounded-xl text-sm outline-none focus:border-green-light focus:bg-white transition-colors cursor-pointer text-gray-700">
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-600 mb-1.5">Cover Image (JPG/PNG, Maks. 1MB) <span class="text-red-500">*</span></label>
          
          <div id="dropzone" class="relative border-2 border-dashed border-gray-300 bg-gray-50/50 rounded-2xl p-8 text-center transition-all cursor-pointer hover:bg-blue-50/50 hover:border-blue-300">
            <input type="file" id="fileInput" accept=".png,.jpg,.jpeg" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" required>
            
            <div id="defaultState" class="flex flex-col items-center justify-center gap-2">
              <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-500 text-2xl">🖼️</div>
              <div>
                <p class="text-sm font-semibold text-gray-700">Klik untuk memilih gambar atau drag & drop di sini</p>
                <p class="text-xs text-gray-400 mt-1">Hanya file .jpg / .png — Maks. 1 MB</p>
              </div>
            </div>

            <div id="fileState" class="hidden flex flex-col items-center justify-center gap-3">
              <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-500 text-2xl">✅</div>
              <div>
                <p id="fileName" class="text-sm font-bold text-green-deep truncate max-w-[250px]"></p>
                <p id="fileSize" class="text-xs text-gray-500 mt-0.5"></p>
              </div>
              <p class="text-[10px] text-gray-400 underline decoration-gray-300 mt-1 relative z-20">Klik area untuk mengganti file</p>
            </div>
          </div>
        </div>

        <!-- PROGRESS BAR (hidden default) -->
        <div id="progressArea" class="hidden space-y-2">
          <div class="flex justify-between text-xs font-semibold">
            <span class="text-green-deep" id="progressText">Mengupload...</span>
            <span class="text-green-deep" id="progressPercent">0%</span>
          </div>
          <div class="w-full bg-cream-dark rounded-full h-2 overflow-hidden">
            <div id="progressBar" class="bg-green-mid h-2 rounded-full w-0 transition-all duration-300"></div>
          </div>
        </div>

        <button type="submit" id="submitBtn" class="w-full py-3.5 bg-green-deep text-white font-bold text-sm rounded-xl hover:bg-green-mid transition-colors shadow-lg shadow-green-deep/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
          <span id="submitIcon">📤</span>
          <span id="submitText">Upload Berita</span>
        </button>

      </form>
    </div>
  </div>

  <!-- RIWAYAT BERITA -->
  <div class="anim-2 bg-white border border-cream-dark rounded-2xl overflow-hidden shadow-sm">
    <div class="px-6 py-4 border-b border-cream-dark flex items-center justify-between">
      <div class="flex items-center gap-2 text-green-deep font-bold">
        <span>🕒</span>
        <span>Riwayat Upload Terbaru</span>
      </div>
    </div>
    
    <div class="p-0 overflow-x-auto custom-scrollbar">
      <?php if(empty($berita_terbaru)): ?>
        <div class="p-10 text-center flex flex-col items-center justify-center text-gray-400">
          <div class="text-4xl mb-3 opacity-50">📰</div>
          <p class="text-sm">Belum ada riwayat berita.</p>
        </div>
      <?php else: ?>
        <table class="w-full text-sm text-left">
          <thead class="text-xs text-gray-500 bg-cream/50 uppercase border-b border-cream-dark">
            <tr>
              <th class="px-6 py-3 font-semibold">Tanggal</th>
              <th class="px-6 py-3 font-semibold">Judul</th>
              <th class="px-6 py-3 font-semibold">Komoditas</th>
              <th class="px-6 py-3 font-semibold">Uploader</th>
              <th class="px-6 py-3 font-semibold text-center">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-cream-dark">
            <?php foreach($berita_terbaru as $b): ?>
            <tr class="hover:bg-cream/30 transition-colors">
              <td class="px-6 py-3 whitespace-nowrap text-xs text-gray-500">
                <?= date('d M Y', strtotime($b['tanggal'])) ?>
              </td>
              <td class="px-6 py-3 font-medium text-green-deep max-w-xs truncate">
                <?= htmlspecialchars($b['judul']) ?>
              </td>
              <td class="px-6 py-3">
                <?php if($b['slug_komoditas']): ?>
                  <span class="px-2 py-1 rounded-md text-[10px] font-bold bg-amber-100 text-amber-700 uppercase">
                    <?= htmlspecialchars($b['slug_komoditas']) ?>
                  </span>
                <?php else: ?>
                  <span class="text-xs text-gray-400">-</span>
                <?php endif; ?>
              </td>
              <td class="px-6 py-3 text-xs text-gray-500">
                👤 <?= htmlspecialchars($b['uploaded_by']) ?>
              </td>
              <td class="px-6 py-3 text-center space-x-2 whitespace-nowrap">
                <button onclick='openEditModal(<?= json_encode($b) ?>)' 
                        class="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-xs font-bold border-0 cursor-pointer">
                  ✏️ Edit
                </button>
                <button onclick="confirmDelete(<?= $b['id'] ?>, '<?= htmlspecialchars(addslashes($b['judul'])) ?>')" 
                        class="px-2 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-xs font-bold border-0 cursor-pointer">
                  🗑️ Hapus
                </button>
              </td>
            </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      <?php endif; ?>
    </div>
  </div>

</main>

<!-- MODAL KONFIRMASI CUSTOM -->
<div id="confirmModal" class="hidden fixed inset-0 z-[100] items-center justify-center p-4 bg-green-deep/60 backdrop-blur-sm">
  <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden anim-0">
    <div class="p-6 text-center">
      <div class="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">❓</div>
      <h3 class="text-xl font-bold text-green-deep mb-2">Konfirmasi Berita</h3>
      <p class="text-sm text-gray-500 mb-6">Mohon periksa kembali detail berita sebelum diupload ke sistem.</p>
      
      <div class="bg-cream border border-cream-dark rounded-2xl p-4 text-left space-y-3 mb-6">
        <div class="flex justify-between items-center text-xs">
          <span class="text-gray-400">Judul:</span>
          <span id="confJudul" class="font-bold text-green-deep text-right max-w-[200px] truncate"></span>
        </div>
        <div class="flex justify-between items-center text-xs">
          <span class="text-gray-400">Komoditas:</span>
          <span id="confKomoditas" class="font-bold text-green-deep text-right"></span>
        </div>
        <div class="flex justify-between items-center text-xs">
          <span class="text-gray-400">Tanggal Upload:</span>
          <span id="confTanggal" class="font-bold text-green-deep"></span>
        </div>
        <div class="flex justify-between items-center text-xs">
          <span class="text-gray-400">Cover:</span>
          <span id="confFile" class="font-bold text-green-mid truncate max-w-[180px]"></span>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <button onclick="closeConfirmModal()" 
          class="py-3 px-4 bg-gray-100 text-gray-600 font-semibold text-sm rounded-xl hover:bg-gray-200 transition-colors border-0 cursor-pointer">
          Batal
        </button>
        <button onclick="executeUpload()" 
          class="py-3 px-4 bg-green-deep text-white font-semibold text-sm rounded-xl hover:bg-green-mid transition-colors border-0 cursor-pointer shadow-lg shadow-green-deep/20">
          Ya, Upload Berita
        </button>
      </div>
    </div>
  </div>
</div>

<!-- MODAL EDIT BERITA -->
<div id="editModal" class="hidden fixed inset-0 z-[100] items-center justify-center p-4 bg-green-deep/60 backdrop-blur-sm">
  <div class="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden anim-0 flex flex-col max-h-[90vh]">
    <div class="px-6 py-4 border-b border-cream-dark flex items-center justify-between">
      <h3 class="text-xl font-bold text-green-deep">✏️ Edit Berita</h3>
      <button onclick="closeEditModal()" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 border-0 cursor-pointer text-gray-400">✕</button>
    </div>
    
    <div class="p-6 overflow-y-auto custom-scrollbar">
      <form id="editForm" class="space-y-4" onsubmit="handleEdit(event)">
        <input type="hidden" id="editId">
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1">Judul Berita</label>
            <input type="text" id="editJudul" required class="w-full px-4 py-2.5 bg-cream/50 border border-cream-dark rounded-xl text-sm outline-none focus:border-green-light focus:bg-white transition-colors">
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1">Sumber Berita</label>
            <input type="text" id="editSumber" class="w-full px-4 py-2.5 bg-cream/50 border border-cream-dark rounded-xl text-sm outline-none focus:border-green-light focus:bg-white transition-colors">
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-600 mb-1">Deskripsi</label>
          <textarea id="editDeskripsi" rows="6" required class="w-full px-4 py-2.5 bg-cream/50 border border-cream-dark rounded-xl text-sm outline-none focus:border-green-light focus:bg-white transition-colors resize-none"></textarea>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1">Komoditas</label>
            <select id="editSlug" class="w-full px-4 py-2.5 bg-cream/50 border border-cream-dark rounded-xl text-sm outline-none focus:border-green-light focus:bg-white transition-colors">
              <option value="">— Tidak Spesifik —</option>
              <?php foreach($valid_slugs as $slug => $nama): ?>
                <option value="<?= htmlspecialchars($slug) ?>"><?= htmlspecialchars($nama) ?></option>
              <?php endforeach; ?>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1">Tanggal</label>
            <input type="date" id="editTanggal" required class="w-full px-4 py-2.5 bg-cream/50 border border-cream-dark rounded-xl text-sm outline-none focus:border-green-light focus:bg-white transition-colors">
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-600 mb-1">Ganti Cover <span class="text-gray-400 font-normal">(Biarkan kosong jika tidak diubah)</span></label>
          <input type="file" id="editFile" accept=".jpg,.jpeg,.png" class="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer">
        </div>

        <div class="flex gap-3 pt-2">
          <button type="button" onclick="closeEditModal()" class="flex-1 py-3 bg-gray-100 text-gray-600 font-bold text-sm rounded-xl hover:bg-gray-200 transition-colors border-0 cursor-pointer">Batal</button>
          <button type="submit" id="editSubmitBtn" class="flex-1 py-3 bg-green-deep text-white font-bold text-sm rounded-xl hover:bg-green-mid transition-colors border-0 cursor-pointer shadow-lg">Simpan Perubahan</button>
        </div>
      </form>
    </div>
  </div>
</div>

<!-- MODAL HAPUS -->
<div id="deleteModal" class="hidden fixed inset-0 z-[100] items-center justify-center p-4 bg-green-deep/60 backdrop-blur-sm">
  <div class="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden anim-0">
    <div class="p-6 text-center">
      <div class="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">⚠️</div>
      <h3 class="text-xl font-bold text-green-deep mb-2">Hapus Berita?</h3>
      <p class="text-sm text-gray-500 mb-6">Apakah Anda yakin ingin menghapus berita <br><b id="deleteTitle" class="text-red-600"></b>?</p>
      
      <div class="grid grid-cols-2 gap-3">
        <button onclick="closeDeleteModal()" class="py-3 px-4 bg-gray-100 text-gray-600 font-semibold text-sm rounded-xl hover:bg-gray-200 transition-colors border-0 cursor-pointer">Batal</button>
        <button id="confirmDeleteBtn" class="py-3 px-4 bg-red-600 text-white font-semibold text-sm rounded-xl hover:bg-red-700 transition-colors border-0 cursor-pointer shadow-lg">Ya, Hapus</button>
      </div>
    </div>
  </div>
</div>

<script>
// ── Drag & Drop & File Select Logic ──
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const defaultState = document.getElementById('defaultState');
const fileState = document.getElementById('fileState');
const fileNameDisplay = document.getElementById('fileName');
const fileSizeDisplay = document.getElementById('fileSize');

let selectedFile = null;

// Handle drag events
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  dropzone.addEventListener(eventName, preventDefaults, false);
});
function preventDefaults(e) { e.preventDefault(); e.stopPropagation(); }

['dragenter', 'dragover'].forEach(eventName => {
  dropzone.addEventListener(eventName, () => dropzone.classList.add('drag-over'), false);
});
['dragleave', 'drop'].forEach(eventName => {
  dropzone.addEventListener(eventName, () => dropzone.classList.remove('drag-over'), false);
});

dropzone.addEventListener('drop', (e) => {
  const dt = e.dataTransfer;
  const files = dt.files;
  handleFiles(files);
}, false);

fileInput.addEventListener('change', function() {
  handleFiles(this.files);
});

function handleFiles(files) {
  if (files.length > 0) {
    const file = files[0];
    
    // Validasi format
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      showAlert('⚠️ File harus berformat JPG atau PNG.', 'error');
      resetFile();
      return;
    }
    
    // Validasi ukuran
    if (file.size > 1048576) {
      showAlert('⚠️ Ukuran gambar terlalu besar. Maksimal 1 MB.', 'error');
      resetFile();
      return;
    }
    
    selectedFile = file;
    
    // Update UI
    defaultState.classList.add('hidden');
    fileState.classList.remove('hidden');
    fileNameDisplay.textContent = file.name;
    fileSizeDisplay.textContent = (file.size / 1024).toFixed(1) + ' KB';
  }
}

function resetFile() {
  selectedFile = null;
  fileInput.value = '';
  fileState.classList.add('hidden');
  defaultState.classList.remove('hidden');
}

// ── Alert Helper ──
function showAlert(message, type='success') {
  const alert = document.getElementById('globalAlert');
  alert.className = `anim-0 rounded-xl px-5 py-4 text-sm font-medium border mb-6 flex items-start gap-3`;
  
  if(type === 'success') {
    alert.classList.add('bg-green-mist', 'text-green-800', 'border-green-light/30');
    alert.innerHTML = `<span class="text-lg leading-none">✅</span> <div>${message}</div>`;
  } else {
    alert.classList.add('bg-red-50', 'text-red-800', 'border-red-200');
    alert.innerHTML = `<span class="text-lg leading-none">⚠️</span> <div>${message}</div>`;
  }
  
  alert.classList.remove('hidden');
  setTimeout(() => {
    alert.classList.add('hidden');
  }, 8000);
}

// ── Submit Logic ──
async function handleUpload(e) {
  e.preventDefault();

  const judul = document.getElementById('judulInput').value;
  const deskripsi = document.getElementById('deskripsiInput').value;
  const tanggal = document.getElementById('tanggalInput').value;

  if (!judul || !deskripsi || !tanggal) {
    showAlert('⚠️ Judul, Deskripsi, dan Tanggal wajib diisi.', 'error'); return;
  }
  if (!selectedFile) { showAlert('⚠️ Pilih gambar cover terlebih dahulu.', 'error'); return; }

  // Tampilkan Modal Konfirmasi
  const slugSelect = document.getElementById('slugSelect');
  const komoditasName = slugSelect.value ? slugSelect.options[slugSelect.selectedIndex].text : 'Tidak Spesifik';
  
  document.getElementById('confJudul').textContent = judul;
  document.getElementById('confKomoditas').textContent = komoditasName;
  document.getElementById('confTanggal').textContent = tanggal;
  document.getElementById('confFile').textContent = selectedFile.name;
  
  const modal = document.getElementById('confirmModal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeConfirmModal() {
  const modal = document.getElementById('confirmModal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

async function executeUpload() {
  closeConfirmModal();
  
  const judul = document.getElementById('judulInput').value;
  const deskripsi = document.getElementById('deskripsiInput').value;
  const slug = document.getElementById('slugSelect').value;
  const tanggal = document.getElementById('tanggalInput').value;

  // UI loading
  const btn = document.getElementById('submitBtn');
  document.getElementById('submitIcon').textContent = '⏳';
  document.getElementById('submitText').textContent = 'Mengupload...';
  btn.disabled = true;

  const progressArea = document.getElementById('progressArea');
  const progressBar = document.getElementById('progressBar');
  const progressPercent = document.getElementById('progressPercent');
  progressArea.classList.remove('hidden');
  progressBar.style.width = '10%';
  progressPercent.textContent = '10%';

  const formData = new FormData();
  formData.append('judul', judul);
  formData.append('deskripsi', deskripsi);
  formData.append('sumber', document.getElementById('sumberInput').value);
  formData.append('slug_komoditas', slug);
  formData.append('tanggal_upload', tanggal);
  formData.append('cover_image', selectedFile);

  try {
    // Animasi progress bohongan
    let prog = 10;
    const interval = setInterval(() => {
      if(prog < 90) { prog += 15; progressBar.style.width = prog+'%'; progressPercent.textContent = prog+'%'; }
    }, 200);

    const response = await fetch('Proses/prosesUploadBerita.php', {
      method: 'POST',
      body: formData
    });
    
    clearInterval(interval);
    progressBar.style.width = '100%';
    progressPercent.textContent = '100%';

    const text = await response.text();
    let result;
    try {
      result = JSON.parse(text);
    } catch(e) {
      console.error("Raw response:", text);
      throw new Error("Server mengembalikan response yang bukan JSON");
    }

    setTimeout(() => {
      progressArea.classList.add('hidden');
      if (result.success) {
        document.getElementById('uploadForm').reset();
        resetFile();
        showAlert(`<b>Upload Berhasil!</b><br>Berita "${judul}" berhasil ditambahkan.`);
        setTimeout(() => location.reload(), 2000); // Reload untuk update tabel
      } else {
        showAlert(result.message || 'Terjadi kesalahan saat upload.', 'error');
      }
      
      document.getElementById('submitIcon').textContent = '📤';
      document.getElementById('submitText').textContent = 'Upload Berita';
      btn.disabled = false;
    }, 500);

  } catch (error) {
    progressArea.classList.add('hidden');
    console.error(error);
    showAlert('Gagal terhubung ke server. Periksa koneksi internet Anda.', 'error');
    document.getElementById('submitIcon').textContent = '📤';
    document.getElementById('submitText').textContent = 'Upload Berita';
    btn.disabled = false;
  }
}

async function doLogout(e) {
  e.preventDefault();
  await fetch('logout.php', { credentials: 'include' });
  localStorage.clear();
  window.location.href = 'login.php';
}

// ── EDIT & DELETE Logic ──
let deleteId = null;

function confirmDelete(id, title) {
  deleteId = id;
  document.getElementById('deleteTitle').textContent = `"${title}"`;
  document.getElementById('deleteModal').classList.remove('hidden');
  document.getElementById('deleteModal').classList.add('flex');
  
  document.getElementById('confirmDeleteBtn').onclick = executeDelete;
}

function closeDeleteModal() {
  document.getElementById('deleteModal').classList.add('hidden');
  document.getElementById('deleteModal').classList.remove('flex');
}

async function executeDelete() {
  const btn = document.getElementById('confirmDeleteBtn');
  btn.disabled = true;
  btn.textContent = 'Menghapus...';

  try {
    const formData = new FormData();
    formData.append('id', deleteId);
    
    const response = await fetch('Proses/prosesHapusBerita.php', {
      method: 'POST',
      body: formData
    });
    const res = await response.json();
    
    if (res.success) {
      showAlert('Berita berhasil dihapus.');
      setTimeout(() => location.reload(), 1500);
    } else {
      showAlert(res.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Ya, Hapus';
    }
  } catch (err) {
    showAlert('Terjadi kesalahan jaringan.', 'error');
    btn.disabled = false;
    btn.textContent = 'Ya, Hapus';
  }
}

function openEditModal(data) {
  document.getElementById('editId').value = data.id;
  document.getElementById('editJudul').value = data.judul;
  document.getElementById('editDeskripsi').value = data.deskripsi;
  document.getElementById('editSumber').value = data.sumber || '';
  document.getElementById('editSlug').value = data.slug_komoditas || '';
  document.getElementById('editTanggal').value = data.tanggal;
  
  document.getElementById('editModal').classList.remove('hidden');
  document.getElementById('editModal').classList.add('flex');
}

function closeEditModal() {
  document.getElementById('editModal').classList.add('hidden');
  document.getElementById('editModal').classList.remove('flex');
}

async function handleEdit(e) {
  e.preventDefault();
  const btn = document.getElementById('editSubmitBtn');
  btn.disabled = true;
  btn.textContent = 'Menyimpan...';

  const formData = new FormData();
  formData.append('id', document.getElementById('editId').value);
  formData.append('judul', document.getElementById('editJudul').value);
  formData.append('deskripsi', document.getElementById('editDeskripsi').value);
  formData.append('sumber', document.getElementById('editSumber').value);
  formData.append('slug', document.getElementById('editSlug').value);
  formData.append('tanggal', document.getElementById('editTanggal').value);
  
  const fileInput = document.getElementById('editFile');
  if (fileInput.files.length > 0) {
    formData.append('cover_image', fileInput.files[0]);
  }

  try {
    const response = await fetch('Proses/prosesEditBerita.php', {
      method: 'POST',
      body: formData
    });
    const res = await response.json();
    
    if (res.success) {
      showAlert('Berita berhasil diperbarui.');
      setTimeout(() => location.reload(), 1500);
    } else {
      showAlert(res.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Simpan Perubahan';
    }
  } catch (err) {
    showAlert('Terjadi kesalahan jaringan.', 'error');
    btn.disabled = false;
    btn.textContent = 'Simpan Perubahan';
  }
}
</script>
</body>
</html>
