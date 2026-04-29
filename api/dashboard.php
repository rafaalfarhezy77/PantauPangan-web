<?php
require __DIR__ . '/Server/koneksi.php';
session_start();

// Validasi Keamanan Server-side
if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit;
}

$query = mysqli_query($koneksi, "SELECT * FROM users");
?>

<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Dashboard — PantauPangan</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Lora:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js"></script>
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
        fontFamily: {
          sans:  ['Plus Jakarta Sans', 'sans-serif'],
          serif: ['Lora', 'serif'],
        },
      }
    }
  }
</script>
<style>
  body { font-family: 'Plus Jakarta Sans', sans-serif; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes blink  { 0%,100%{opacity:1} 50%{opacity:.3} }
  .anim-0 { animation: fadeUp .5s ease both; }
  .anim-1 { animation: fadeUp .5s .1s ease both; }
  .anim-2 { animation: fadeUp .5s .2s ease both; }
  .blink  { animation: blink 2s infinite; }

  .custom-scrollbar::-webkit-scrollbar {
    width: 4px; 
  }

  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
  }
</style>
</head>
<body class="bg-cream min-h-screen flex">

<!-- Overlay mobile -->
<div id="overlay" onclick="closeSidebar()"
     class="hidden fixed inset-0 bg-black/40 z-40"></div>

<!-- ── SIDEBAR ── -->
<aside id="sidebar"
  class="w-60 bg-green-deep h-screen fixed top-0 left-0 flex flex-col z-50
         -translate-x-full md:translate-x-0 transition-transform duration-300">

  <a href="../index.html"
     class="flex items-center gap-3 px-5 py-6 border-b border-white/10 no-underline">
    <div class="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center text-lg">🌾</div>
    <span class="font-bold text-white text-base">Pantau<span class="text-green-pale">Pangan</span></span>
  </a>

  <nav class="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto custom-scrollbar">
    <p class="text-[0.65rem] font-semibold uppercase tracking-widest text-white/30 px-2 py-2">Menu Utama</p>

    <a href="dashboard.php"
       class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-white bg-white/10 no-underline">
      <span class="w-5 text-center text-base">🏠</span>Dashboard
    </a>
    <a href="../index.html#cari"
    class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-colors no-underline">
      <span class="w-5 text-center text-base">🔍</span>Cari Harga
    </a>
    <a href="../index.html#harga"
       class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-colors no-underline">
      <span class="w-5 text-center text-base">📊</span>Grafik Harga
    </a>
    <a href="../index.html#berita"
       class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-colors no-underline">
      <span class="w-5 text-center text-base">📰</span>Berita
      <span class="ml-auto bg-green-light text-white text-[0.65rem] font-bold px-2 py-0.5 rounded-full">5</span>
    </a>

    <p class="text-[0.65rem] font-semibold uppercase tracking-widest text-white/30 px-2 pt-4 pb-1.5">Lainnya</p>

    
    <a href="../index.html" class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-colors no-underline">
      <span class="w-5 text-center text-base">🌐</span>Ke Beranda
    </a>
    <?php if(isset($_SESSION['role']) && $_SESSION['role'] === 'admin'): ?>
    <p class="text-[0.65rem] font-semibold uppercase tracking-widest text-white/30 px-2 pt-4 pb-1.5">Khusus Admin</p>
    <a href="dashboardAdmin.php" 
       class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-green-pale hover:bg-white/10 hover:text-white transition-colors no-underline">
      <span class="w-5 text-center text-base">🛡️</span>Admin Panel
    </a>
    <?php endif; ?>
  </nav>

  <div class="px-3 py-4 border-t border-white/10">
    <div class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/10 cursor-pointer transition-colors">
      <div id="sidebarAvatar" class="w-8 h-8 bg-green-light rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0">BS</div>
      <div>
        <p id="sidebarName" class="text-sm font-semibold text-white leading-tight"></p>
        <p id="sidebarRole" class="text-xs text-white/40 leading-tight">🌾 </p>
      </div>
    </div>
    <button onclick="doLogout()"
      class="flex items-center gap-2 w-full px-3 py-2 mt-1 rounded-xl text-xs text-red-400/70
             hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer bg-transparent border-0 font-sans">
      🚪 Keluar dari Akun
    </button>
  </div>
</aside>

<!-- ── MAIN ── -->
<div class="flex-1 flex flex-col min-h-screen md:ml-60">

  <!-- Topbar -->
  <header class="sticky top-0 z-40 bg-cream/95 backdrop-blur-sm border-b border-black/5 h-16 flex items-center justify-between px-4 md:px-8">
    <div class="flex items-center gap-3">
      <button onclick="openSidebar()" class="md:hidden text-2xl bg-transparent border-0 cursor-pointer text-green-deep leading-none">☰</button>
      <span class="font-bold text-green-deep">Dashboard</span>
    </div>
    <div class="flex items-center gap-3">
      <span id="topbarDate" class="text-xs text-gray-400 hidden sm:block"></span>
    </div>
  </header>

  <!-- Content -->
  <main class="flex-1 p-4 md:p-8 space-y-6">

    <!-- Welcome banner -->
    <div class="anim-0 relative bg-gradient-to-br from-green-deep to-green-mid rounded-2xl p-6 md:p-7 overflow-hidden flex flex-wrap items-center justify-between gap-4">
      <div class="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2260%22 height=%2260%22><path fill=%22white%22 d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/></svg>')]"></div>
      <div class="relative z-10">
        <p class="font-serif italic text-green-pale text-sm mb-1">Selamat datang kembali,</p>
        <h2 id="welcomeName" class="text-2xl font-bold text-white tracking-tight mb-1"> 👋</h2>
        <p class="text-sm text-white/60">Pantau harga favoritmu — data diperbarui pukul 06.00 WIB</p>
      </div>
      <div class="relative z-10 hidden sm:flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-4 py-2">
        <span class="blink w-2 h-2 bg-green-400 rounded-full block flex-shrink-0"></span>
        <span class="text-xs text-white/80 whitespace-nowrap">Data live · Hari ini</span>
      </div>
      <span class="absolute right-8 top-1/2 -translate-y-1/2 text-8xl opacity-10 pointer-events-none select-none">🌾</span>
    </div>

    <!-- Stats -->
    <div class="anim-1 grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-white border border-cream-dark rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all">
        <div class="w-10 h-10 bg-green-mist rounded-xl flex items-center justify-center text-xl mb-3">⭐</div>
        <p class="text-[0.7rem] text-gray-400 uppercase tracking-wider mb-1">Komoditas Dipantau</p>
        <p id="watchlistCountTop" class="text-2xl font-bold text-green-deep mb-0.5">0</p>
        <p class="text-xs text-gray-400">dari 120+ komoditas</p>
      </div>
      <div class="bg-white border border-cream-dark rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all">
        <div class="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-xl mb-3">📈</div>
        <p class="text-[0.7rem] text-gray-400 uppercase tracking-wider mb-1">Harga Naik</p>
        <p class="text-2xl font-bold text-green-deep mb-0.5">4</p>
        <p class="text-xs text-green-700 font-semibold">▲ dari kemarin</p>
      </div>
      <div class="bg-white border border-cream-dark rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all">
        <div class="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-xl mb-3">📉</div>
        <p class="text-[0.7rem] text-gray-400 uppercase tracking-wider mb-1">Harga Turun</p>
        <p class="text-2xl font-bold text-green-deep mb-0.5">2</p>
        <p class="text-xs text-red-600 font-semibold">▼ dari kemarin</p>
      </div>
      <div class="bg-white border border-cream-dark rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all">
        <div class="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-xl mb-3">🔍</div>
        <p class="text-[0.7rem] text-gray-400 uppercase tracking-wider mb-1">Total Pencarian</p>
        <p id="totalSearchCount" class="text-2xl font-bold text-green-deep mb-0.5">0</p>
        <p class="text-xs text-gray-400">keseluruhan</p>
      </div>
    </div>

    <!-- Chart + Watchlist -->
    <div class="anim-1 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">

      <div class="bg-white border border-cream-dark rounded-2xl overflow-hidden">
        <div class="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-cream-dark">
          <div>
            <p class="font-bold text-green-deep text-sm">Tren Harga Minggu Ini</p>
            <p class="text-xs text-gray-400 mt-0.5">Rata-rata komoditas pantauanmu</p>
          </div>
          <select id="chartSelect" onchange="updateChart()"
            class="text-xs font-medium px-3 py-2 border border-cream-dark rounded-lg bg-cream text-gray-700 outline-none cursor-pointer font-sans">
            <option value="beras">Beras Premium</option>
            <option value="cabai">Cabai Merah</option>
            <option value="bawang">Bawang Merah</option>
            <option value="telur">Telur Ayam</option>
            <option value="minyak">Minyak Goreng</option>
            <option value="daging">Daging Sapi</option>
          </select>
        </div>
        <div class="p-6"><div class="h-52 relative"><canvas id="dashChart"></canvas></div></div>
      </div>

      <div class="bg-white border border-cream-dark rounded-2xl overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-cream-dark">
          <div>
            <p class="font-bold text-green-deep text-sm">⭐ Pantauan Saya</p>
            <p id="watchlistCount" class="text-xs text-gray-400 mt-0.5">0 komoditas aktif</p>
          </div>
          <a href="../index.html#harga"
             class="text-xs font-semibold text-green-mid bg-green-mist px-3 py-1.5 rounded-full hover:bg-green-pale transition-colors no-underline">+ Tambah</a>
        </div>
        <div id="watchlist"></div>
      </div>
    </div>

    <!-- Notif + Riwayat -->
    <div class="anim-2 grid grid-cols-1 md:grid-cols-2 gap-5">

      <!-- Notifications -->
      <div class="bg-white border border-cream-dark rounded-2xl overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-cream-dark">
          <div>
            <p class="font-bold text-green-deep text-sm">🔔 Notifikasi</p>
            <p class="text-xs text-gray-400 mt-0.5">Pembaruan harga terbaru</p>
          </div>
          <button onclick="markAllRead()"
            class="text-xs font-semibold text-green-mid bg-green-mist px-3 py-1.5 rounded-full hover:bg-green-pale transition-colors cursor-pointer border-0 font-sans">
            Baca Semua
          </button>
        </div>
        <div id="notifList" class="custom-scrollbar max-h-[300px] overflow-y-auto"></div>
      </div>

      <!-- History -->
      <div class="bg-white border border-cream-dark rounded-2xl overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-cream-dark">
          <div>
            <p class="font-bold text-green-deep text-sm">🕒 Riwayat Cari</p>
            <p class="text-xs text-gray-400 mt-0.5">Pencarian terakhir Anda</p>
          </div>
          <button onclick="clearHistory()"
            class="text-xs font-semibold text-green-mid bg-green-mist px-3 py-1.5 rounded-full hover:bg-green-pale transition-colors cursor-pointer border-0 font-sans">
            Hapus
          </button>
        </div>
        <div id="historyGrid" class="grid grid-cols-2 gap-3 p-4"></div>
      </div>
    </div>

  </main>
</div>

<script>

let watchlistData = [];

const notifData = [
  { dot:'bg-red-500',    text:'<strong>Cabai Merah</strong> naik <strong>8.4%</strong> dalam 24 jam terakhir.',      time:'10 menit lalu', unread:true  },
  { dot:'bg-red-500',    text:'<strong>Bawang Merah</strong> turun <strong>3.1%</strong> — peluang beli.',            time:'1 jam lalu',    unread:true  },
  { dot:'bg-orange-400', text:'<strong>Telur Ayam</strong> mendekati batas atas pantauanmu (Rp 28.000).',             time:'3 jam lalu',    unread:true  },
  { dot:'bg-green-400',  text:'<strong>Beras Premium</strong> stabil di Rp 14.500/kg minggu ini.',                   time:'Kemarin',       unread:false },
  { dot:'bg-gray-300',   text:'Laporan mingguan komoditas pantauanmu sudah tersedia.',                                time:'2 hari lalu',   unread:false },
];

let historyData = [];

const chartDataMap = {
  beras:  [14000,14100,13900,14200,14400,14350,14500],
  cabai:  [27000,28500,29000,30200,31000,30800,32000],
  bawang: [31000,30500,29800,29200,28900,28700,28500],
  telur:  [26000,26200,26500,26800,27000,26900,27000],
  minyak: [17500,17500,17500,17500,17500,17500,17500],
  daging: [134000,134200,134500,134800,135000,135000,135000],
};

const days = ['Sen','Sel','Rab','Kam','Jum','Sab','Min'];
const fmt  = n => 'Rp ' + n.toLocaleString('id-ID');

function initUser() {
  const isLoggedIn = localStorage.getItem('isLoggedIn');
  const username = localStorage.getItem('username');
  const role = localStorage.getItem('role');

  if (isLoggedIn !== 'true') {
    window.location.href = 'login.php';
    return;
  }


  const initials = (username || 'P').split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
  const roleEmojis = { 'petani': '🌾', 'pembeli': '🛒', 'tengkulak': '🏪', 'admin': '🛡️', 'umum': '👤' };
  const safeRole = role || 'umum';
  const roleEmoji = roleEmojis[safeRole.toLowerCase()] || '👤';

  document.getElementById('sidebarAvatar').textContent = initials;
  document.getElementById('sidebarName').textContent = username || 'Pengguna';
  document.getElementById('sidebarRole').innerHTML = `${roleEmoji} ${safeRole.charAt(0).toUpperCase() + safeRole.slice(1)}`;

  document.getElementById('welcomeName').textContent   = (username || 'Pengguna') + ' 👋';
  
  const now = new Date();
  document.getElementById('topbarDate').textContent =
    now.toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
}

function renderWatchlist() {
  const countEl = document.getElementById('watchlistCount');
  if (countEl) countEl.textContent = watchlistData.length + ' komoditas aktif';
  const countTopEl = document.getElementById('watchlistCountTop');
  if (countTopEl) countTopEl.textContent = watchlistData.length;

  const container = document.getElementById('watchlist');
  container.innerHTML = '';

  if (watchlistData.length === 0) {
    container.innerHTML = '<p class="text-gray-500 text-sm py-6 px-6 text-center">Belum ada komoditas dalam pantauan.</p>';
    return;
  }

  container.innerHTML = watchlistData.map((w,i) => `
    <a href="detail.php?id=${w.id}"
       class="flex items-center gap-3 px-5 py-3.5 border-b border-cream-dark last:border-0
              hover:bg-cream transition-colors no-underline text-inherit">
      <div class="w-9 h-9 bg-green-mist rounded-xl flex items-center justify-center text-lg flex-shrink-0">${w.icon}</div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold text-gray-900 truncate">${w.name}</p>
        <p class="text-xs text-gray-400">📍 ${w.region}</p>
      </div>
      <div class="text-right flex-shrink-0">
        <p class="text-sm font-bold text-green-deep">${fmt(w.price)}</p>
        <p class="text-xs font-semibold ${w.change>0?'text-green-700':w.change<0?'text-red-600':'text-gray-400'}">
          ${w.change>0?'▲'+w.change+'%':w.change<0?'▼'+Math.abs(w.change)+'%':'—'}
        </p>
      </div>
      <button onclick="removeWatch(event,${i})"
        class="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 text-xs
               hover:bg-red-50 hover:text-red-500 transition-colors flex-shrink-0 border-0 bg-transparent cursor-pointer">✕</button>
    </a>`).join('');
}

async function removeWatch(e, i) {
  e.preventDefault();
  e.stopPropagation();
  const item = watchlistData[i];
  if (!item) return;

  try {
    const response = await fetch('api_toggle_pantauan.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action: 'remove', slug: item.id })
    });
    const result = await response.json();
    if (result.status === 'success') {
      watchlistData.splice(i, 1);
      renderWatchlist();
    }
  } catch (error) {
    console.error('Gagal menghapus pantauan:', error);
  }
}

function renderNotif() {
  document.getElementById('notifList').innerHTML = notifData.map((n,i) => `
    <div onclick="readNotif(${i})"
         class="flex gap-3 px-5 py-3.5 border-b border-cream-dark last:border-0
                ${n.unread?'bg-green-50/60':''} hover:bg-cream transition-colors cursor-pointer">
      <span class="w-2 h-2 ${n.dot} rounded-full mt-1.5 flex-shrink-0 block"></span>
      <div>
        <p class="text-sm text-gray-800 leading-relaxed mb-0.5">${n.text}</p>
        <p class="text-xs text-gray-400">🕐 ${n.time}</p>
      </div>
    </div>`).join('');
}

function readNotif(i)  { notifData[i].unread=false; renderNotif(); }
function markAllRead() { notifData.forEach(n=>n.unread=false); renderNotif(); }

function renderHistory() {
  const container = document.getElementById('historyGrid');
  container.innerHTML = '';

  if (historyData.length === 0) {
    container.innerHTML = '<p class="col-span-2 text-center text-gray-500 text-sm py-4">Belum ada riwayat pencarian.</p>';
    return;
  }

  container.innerHTML = historyData.map(h => `
    <a href="detail.php"
       class="block bg-cream border border-cream-dark rounded-xl p-3.5 hover:border-green-pale hover:shadow-sm transition-all no-underline">
      <p class="text-xs text-gray-400 mb-1">${h.icon} ${h.commodity}</p>
      <p class="text-base font-bold text-green-deep mb-0.5">${h.price}</p>
      <p class="text-xs text-gray-400">📍 ${h.region}</p>
      <p class="text-[0.7rem] text-gray-300 mt-2 pt-2 border-t border-cream-dark">🕐 ${h.time}</p>
    </a>`).join('');
}

function clearHistory() {
  document.getElementById('historyGrid').innerHTML =
    `<p class="col-span-2 text-center py-6 text-sm text-gray-400">Belum ada riwayat.</p>`;
}

let chartInst = null;
function updateChart() {
  if (typeof Chart === 'undefined') {
    console.error("Chart.js not loaded");
    return;
  }
  const selectEl = document.getElementById('chartSelect');
  if (!selectEl) return;

  const key  = selectEl.value;
  const data = chartDataMap[key] || chartDataMap.beras;
  if (chartInst) chartInst.destroy();

  const canvas = document.getElementById('dashChart');
  if (!canvas) return;

  const ctx  = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0,0,0,200);
  grad.addColorStop(0,'rgba(82,183,136,.2)');
  grad.addColorStop(1,'rgba(82,183,136,0)');
  chartInst = new Chart(ctx,{
    type:'line',
    data:{ labels:days, datasets:[{ data, borderColor:'#2d6a4f', backgroundColor:grad,
      borderWidth:2.5, pointRadius:3, pointBackgroundColor:'#2d6a4f', pointHoverRadius:7, tension:.4, fill:true }] },
    options:{
      responsive:true, maintainAspectRatio:false,
      interaction:{intersect:false,mode:'index'},
      plugins:{ legend:{display:false},
        tooltip:{ backgroundColor:'#1a3a2a', titleColor:'rgba(255,255,255,.6)', bodyColor:'white',
          bodyFont:{weight:'bold',size:13}, padding:12, cornerRadius:8,
          callbacks:{label:c=>' '+fmt(c.parsed.y)} } },
      scales:{
        x:{ grid:{display:false}, border:{display:false},
            ticks:{font:{size:11,family:'Plus Jakarta Sans'},color:'#9ca3af'} },
        y:{ grid:{color:'rgba(0,0,0,.04)'}, border:{display:false},
            ticks:{font:{size:11,family:'Plus Jakarta Sans'},color:'#9ca3af',
              callback:v=>'Rp '+new Intl.NumberFormat('id-ID').format(v/1000)+'rb'} }
      }
    }
  });
}
async function doLogout() {
  try {
   
    const response = await fetch('logout.php', { credentials: 'include' });
    const result = await response.json();

    if (result.success) {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('username');
      localStorage.removeItem('role');
      
      
      window.location.href = 'login.php';
    }
  } catch (error) {
    console.error("Gagal logout:", error);
    localStorage.clear();
    window.location.href = 'login.php';
  }
}

function openSidebar()  { document.getElementById('sidebar').classList.remove('-translate-x-full'); document.getElementById('overlay').classList.remove('hidden'); }
function closeSidebar() { document.getElementById('sidebar').classList.add('-translate-x-full'); document.getElementById('overlay').classList.add('hidden'); }

async function fetchBerasBPS() {
  try {
    const response = await fetch('coba_api.php');
    const dataBPS = await response.json();
    if (dataBPS.status === 'OK') {
        const content = dataBPS.datacontent;
        const keyPrefix = '122770125';
        let history = [];
        for (let m = 1; m <= 12; m++) {
            const key = keyPrefix + m;
            if (content[key]) history.push(content[key]);
        }
        if (history.length > 0) {
            let chartData = history.slice(-7);
            while (chartData.length < 7 && chartData.length > 0) {
                chartData.unshift(chartData[0]);
            }
            if (chartData.length === 7) {
                chartDataMap.beras = chartData;
            }
            
            const latestPrice = history[history.length - 1];
            const berasItem = watchlistData.find(w => w.id === 'beras');
            if (berasItem) {
                berasItem.price = latestPrice;
                if (history.length > 1) {
                    const prevPrice = history[history.length - 2];
                    const change = ((latestPrice - prevPrice) / prevPrice) * 100;
                    berasItem.change = parseFloat(change.toFixed(1));
                }
                renderWatchlist();
            }
        }
    }
  } catch (error) {
    console.error('Gagal sinkronisasi API beras', error);
  }
}

async function fetchWatchlist() {
    try {
        const response = await fetch('api_pantauan.php');
        const result = await response.json();
        
        if (result.status === "success") {
            watchlistData = result.data; // Sekarang isinya data asli dari DB
            renderWatchlist(); // Panggil fungsi render yang sudah ada
        }
    } catch (error) {
        console.error("Gagal load pantauan:", error);
    }
}

async function fetchHistoryData() {
    try {
        const response = await fetch('api_riwayat.php');
        const result = await response.json();
        
        if (result.status === "success") {
            historyData = result.data; 
            renderHistory();
            
            const totalSearchCountEl = document.getElementById('totalSearchCount');
            if (totalSearchCountEl) {
                totalSearchCountEl.textContent = result.total_count || 0;
            }
        }
    } catch (error) {
        console.error("Gagal load riwayat:", error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Beri sedikit jeda agar Tailwind selesai merender container (mencegah canvas 0px)
    setTimeout(async () => {
      initUser();
      await fetchWatchlist();
      await fetchHistoryData();
      await fetchBerasBPS();
      renderNotif();  
      updateChart();
    }, 100);
});
</script>
</body>
</html>





