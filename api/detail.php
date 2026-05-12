<?php
require __DIR__ . '/Server/koneksi.php';
session_start();
?>

<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Detail Komoditas — PantauPangan</title>
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
  .anim-0 { animation: fadeUp .5s ease both; }
  .anim-1 { animation: fadeUp .5s .1s ease both; }
  .anim-2 { animation: fadeUp .5s .2s ease both; }
</style>
</head>
<body class="bg-cream min-h-screen">

<!-- ── NAVBAR ── -->
<nav class="sticky top-0 z-50 bg-cream/95 backdrop-blur-sm border-b border-black/5 h-16 flex items-center gap-3 px-4 md:px-8">
  <button onclick="history.back()"
    class="flex items-center gap-1.5 text-sm font-medium text-gray-400 bg-white border border-cream-dark
           px-3.5 py-2 rounded-full hover:border-green-pale hover:text-green-deep transition-colors cursor-pointer font-sans">
    ← Kembali
  </button>

  <div class="flex items-center gap-1.5 text-xs text-gray-400 hidden sm:flex">
    <a href="../index.html" class="hover:text-green-mid transition-colors no-underline text-gray-400">Beranda</a>
    <span>›</span>
    <a href="../index.html#harga" class="hover:text-green-mid transition-colors no-underline text-gray-400">Komoditas</a>
    <span>›</span>
    <span id="breadcrumb" class="text-green-deep font-semibold">Beras Premium</span>
  </div>

  <div class="ml-auto flex gap-2">
    <button id="watchBtn" onclick="toggleWatch()"
      class="flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-white border border-cream-dark
             px-3.5 py-2 rounded-full hover:border-green-pale hover:text-green-deep transition-all cursor-pointer font-sans">
      ⭐ Pantau
    </button>
    <a href="dashboard.php"
      class="flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-white border border-cream-dark
             px-3.5 py-2 rounded-full hover:border-green-pale hover:text-green-deep transition-all no-underline">
      📊 Dashboard
    </a>
  </div>
</nav>

<!-- ── HERO ── -->
<div class="relative bg-gradient-to-br from-green-deep to-green-mid overflow-hidden">
  <div class="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2260%22 height=%2260%22><path fill=%22white%22 d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/></svg>')]"></div>
  <span id="heroEmoji" class="absolute right-8 top-1/2 -translate-y-1/2 text-[8rem] opacity-10 pointer-events-none select-none hidden md:block">🌾</span>

  <div class="relative z-10 px-6 md:px-10 py-10 flex flex-wrap items-end justify-between gap-6">
    <div>
      <div id="heroCat"
        class="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 text-green-pale
               text-[0.72rem] font-semibold uppercase tracking-widest px-3.5 py-1.5 rounded-full mb-4">
        🌾 Pangan Pokok
      </div>
      <h1 id="heroName" class="text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight mb-3">
        <span class="mr-2">🌾</span>Beras Premium
      </h1>
      <p id="heroDesc" class="text-sm text-white/60 leading-relaxed max-w-lg">
        Beras kualitas premium yang banyak dikonsumsi masyarakat Indonesia.
      </p>
    </div>

    <div class="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-6 min-w-[210px] flex-shrink-0">
      <p class="text-[0.72rem] text-white/50 uppercase tracking-wider mb-1.5">Harga Rata-rata Nasional</p>
      <p id="heroPrice" class="text-4xl font-bold text-white tracking-tight leading-none mb-1">Rp 14.500</p>
      <p id="heroUnit"  class="text-xs text-white/40 mb-3">per kilogram · Hari ini</p>
      <span id="heroBadge"
        class="inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-full bg-green-400/20 text-green-300">
        ▲ +1.2% dari kemarin
      </span>
    </div>
  </div>
</div>

<!-- ── CONTENT ── -->
<div class="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-6">

  <!-- Stat pills -->
  <div class="anim-0 flex flex-wrap gap-3">
    <div class="bg-white border border-cream-dark rounded-2xl p-4 flex-1 min-w-[120px] hover:shadow-sm transition-all">
      <p class="text-[0.68rem] text-gray-400 uppercase tracking-wider mb-1.5">Tertinggi (7H)</p>
      <p id="pillHigh" class="text-lg font-bold text-green-deep">Rp 14.500</p>
      <p class="text-[0.7rem] text-gray-400 mt-0.5">Jawa Barat</p>
    </div>
    <div class="bg-white border border-cream-dark rounded-2xl p-4 flex-1 min-w-[120px] hover:shadow-sm transition-all">
      <p class="text-[0.68rem] text-gray-400 uppercase tracking-wider mb-1.5">Terendah (7H)</p>
      <p id="pillLow" class="text-lg font-bold text-green-deep">Rp 13.900</p>
      <p class="text-[0.7rem] text-gray-400 mt-0.5">Jawa Timur</p>
    </div>
    <div class="bg-white border border-cream-dark rounded-2xl p-4 flex-1 min-w-[120px] hover:shadow-sm transition-all">
      <p class="text-[0.68rem] text-gray-400 uppercase tracking-wider mb-1.5">Rata-rata</p>
      <p id="pillAvg" class="text-lg font-bold text-green-deep">Rp 14.200</p>
      <p class="text-[0.7rem] text-gray-400 mt-0.5">7 hari terakhir</p>
    </div>
    <div class="bg-white border border-cream-dark rounded-2xl p-4 flex-1 min-w-[120px] hover:shadow-sm transition-all">
      <p class="text-[0.68rem] text-gray-400 uppercase tracking-wider mb-1.5">Volatilitas</p>
      <p id="pillVol" class="text-lg font-bold text-green-deep">Rendah</p>
      <p class="text-[0.7rem] text-gray-400 mt-0.5">Relatif stabil</p>
    </div>
    <div class="bg-white border border-cream-dark rounded-2xl p-4 flex-1 min-w-[120px] hover:shadow-sm transition-all">
      <p class="text-[0.68rem] text-gray-400 uppercase tracking-wider mb-1.5">Perubahan Bulanan</p>
      <p id="pillMonthly" class="text-lg font-bold text-green-700">+3.2%</p>
      <p class="text-[0.7rem] text-gray-400 mt-0.5">vs bulan lalu</p>
    </div>
  </div>

  <!-- Chart + Info -->
  <div class="anim-1 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">

    <!-- Chart -->
    <div class="bg-white border border-cream-dark rounded-2xl overflow-hidden">
      <div class="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-cream-dark">
        <div>
          <p class="font-bold text-green-deep text-sm">Grafik Harga</p>
          <p id="chartSub" class="text-xs text-gray-400 mt-0.5">Beras Premium — Rata-rata Nasional</p>
        </div>
        <div class="flex gap-1">
          <button class="period-btn active text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-mid text-white border-0 cursor-pointer font-sans" onclick="changePeriod('7H',this)">7H</button>
          <button class="period-btn text-xs font-semibold px-3 py-1.5 rounded-lg bg-cream text-gray-400 border-0 cursor-pointer font-sans hover:bg-green-mist hover:text-green-deep transition-colors" onclick="changePeriod('1B',this)">1B</button>
          <button class="period-btn text-xs font-semibold px-3 py-1.5 rounded-lg bg-cream text-gray-400 border-0 cursor-pointer font-sans hover:bg-green-mist hover:text-green-deep transition-colors" onclick="changePeriod('3B',this)">3B</button>
          <button class="period-btn text-xs font-semibold px-3 py-1.5 rounded-lg bg-cream text-gray-400 border-0 cursor-pointer font-sans hover:bg-green-mist hover:text-green-deep transition-colors" onclick="changePeriod('1T',this)">1T</button>
        </div>
      </div>
      <div class="p-6"><div class="h-56 relative"><canvas id="detailChart"></canvas></div></div>
    </div>

    <!-- Info -->
    <div class="bg-white border border-cream-dark rounded-2xl overflow-hidden">
      <div class="px-6 py-4 border-b border-cream-dark">
        <p class="font-bold text-green-deep text-sm">ℹ️ Info Komoditas</p>
      </div>
      <div id="infoList"></div>
    </div>
  </div>

  <!-- Prediksi Chart (AI) -->
  <div class="anim-1 bg-white border border-cream-dark rounded-2xl overflow-hidden">
    <div class="px-6 py-4 border-b border-cream-dark flex flex-wrap items-center justify-between gap-3">
      <div>
        <p class="font-bold text-green-deep text-sm">🤖 Prediksi Harga (AI)</p>
        <p class="text-xs text-gray-400 mt-0.5">Prediksi Tren Harga Beras 7 Hari ke Depan (Regresi Linear)</p>
      </div>
      <select id="prediksiRegion" onchange="renderPrediksiChart(this.value)" class="text-xs font-semibold px-3 py-1.5 rounded-lg bg-cream border border-cream-dark text-gray-600 outline-none focus:border-green-pale focus:ring-1 focus:ring-green-pale transition-all cursor-pointer">
        <option value="Semua Provinsi">Semua Provinsi</option>
        <option value="Aceh">Aceh</option>
        <option value="Sumatera Utara">Sumatera Utara</option>
        <option value="Sumatera Barat">Sumatera Barat</option>
        <option value="Riau">Riau</option>
        <option value="Jambi">Jambi</option>
        <option value="Sumatera Selatan">Sumatera Selatan</option>
        <option value="Bengkulu">Bengkulu</option>
        <option value="Lampung">Lampung</option>
        <option value="Kepulauan Bangka Belitung">Kepulauan Bangka Belitung</option>
        <option value="Kepulauan Riau">Kepulauan Riau</option>
        <option value="DKI Jakarta">DKI Jakarta</option>
        <option value="Jawa Barat">Jawa Barat</option>
        <option value="Jawa Tengah">Jawa Tengah</option>
        <option value="DI Yogyakarta">DI Yogyakarta</option>
        <option value="Jawa Timur">Jawa Timur</option>
        <option value="Banten">Banten</option>
        <option value="Bali">Bali</option>
        <option value="Nusa Tenggara Barat">Nusa Tenggara Barat</option>
        <option value="Nusa Tenggara Timur">Nusa Tenggara Timur</option>
        <option value="Kalimantan Barat">Kalimantan Barat</option>
        <option value="Kalimantan Tengah">Kalimantan Tengah</option>
        <option value="Kalimantan Selatan">Kalimantan Selatan</option>
        <option value="Kalimantan Timur">Kalimantan Timur</option>
        <option value="Kalimantan Utara">Kalimantan Utara</option>
        <option value="Sulawesi Utara">Sulawesi Utara</option>
        <option value="Sulawesi Tengah">Sulawesi Tengah</option>
        <option value="Sulawesi Selatan">Sulawesi Selatan</option>
        <option value="Sulawesi Tenggara">Sulawesi Tenggara</option>
        <option value="Gorontalo">Gorontalo</option>
        <option value="Sulawesi Barat">Sulawesi Barat</option>
        <option value="Maluku">Maluku</option>
        <option value="Maluku Utara">Maluku Utara</option>
        <option value="Papua Barat">Papua Barat</option>
        <option value="Papua">Papua</option>
        <option value="Papua Selatan">Papua Selatan</option>
        <option value="Papua Tengah">Papua Tengah</option>
        <option value="Papua Pegunungan">Papua Pegunungan</option>
      </select>
    </div>
    <div class="p-6">
      <div class="h-64 relative w-full"><canvas id="hargaChart"></canvas></div>
    </div>
  </div>

  <!-- Tabel Provinsi -->
  <div class="anim-1 bg-white border border-cream-dark rounded-2xl overflow-hidden">
    <div class="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-cream-dark">
      <div>
        <p class="font-bold text-green-deep text-sm">📍 Harga per Provinsi</p>
        <p class="text-xs text-gray-400 mt-0.5">Perbandingan di 10 provinsi utama</p>
      </div>
      <a href="../index.html#cari"
         class="text-xs font-semibold text-green-mid bg-green-mist px-3 py-1.5 rounded-full hover:bg-green-pale transition-colors no-underline">
        Cari Provinsi Lain →
      </a>
    </div>
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-cream border-b border-cream-dark">
          <tr>
            <th class="text-left text-[0.7rem] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">#</th>
            <th class="text-left text-[0.7rem] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Provinsi</th>
            <th class="text-left text-[0.7rem] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Harga</th>
            <th class="text-left text-[0.7rem] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Perubahan</th>
            <th class="text-left text-[0.7rem] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody id="regionTableBody"></tbody>
      </table>
    </div>
  </div>

  <!-- Berita + Komoditas Serupa -->
  <div class="anim-2 grid grid-cols-1 md:grid-cols-2 gap-5">

    <!-- Berita -->
    <div class="bg-white border border-cream-dark rounded-2xl overflow-hidden">
      <div class="px-6 py-4 border-b border-cream-dark">
        <p class="font-bold text-green-deep text-sm">📰 Berita Terkait</p>
        <p id="newsSub" class="text-xs text-gray-400 mt-0.5">Seputar Beras Premium</p>
      </div>
      <div id="relatedNews"></div>
    </div>

    <!-- Komoditas Serupa -->
    <div class="bg-white border border-cream-dark rounded-2xl overflow-hidden">
      <div class="px-6 py-4 border-b border-cream-dark">
        <p class="font-bold text-green-deep text-sm">🔗 Komoditas Serupa</p>
      </div>
      <div id="similarGrid" class="grid grid-cols-2 gap-3 p-5"></div>
    </div>
  </div>

</div>

<script>
let C = {}; // Kosongkan dulu

async function fetchDetailKomoditas() {
  try {
    const response = await fetch('api_komoditas.php');
    const result = await response.json();
    
    if (result.status === "success") {
      // Cari komoditas berdasarkan slug_id (contoh: ?id=jagung)
      const dataDB = result.data.find(item => item.slug_id === commodityId) || result.data[0]; 
      
      // Susun ulang objek C
      C = {
        id: dataDB.slug_id,
        icon: dataDB.icon,
        name: dataDB.nama,
        cat: dataDB.kategori,
        catIcon: dataDB.icon,
        desc: dataDB.deskripsi,
        price: parseFloat(dataDB.harga_default),
        unit: 'per kilogram',
        change: parseFloat(dataDB.perubahan_default),
        info: [
          {k:'Kategori', v:dataDB.kategori},
          {k:'Kode BPS', v:dataDB.kode_api_bps || '-'}
        ],
        news: [], // Bisa ditambah tabel berita nanti
        similar: [] 
      };
      
      // Ambil komoditas serupa berdasarkan kategori yang sama
      C.similar = result.data
        .filter(item => item.kategori === dataDB.kategori && item.slug_id !== C.id)
        .slice(0, 4) // Ambil maksimal 4 komoditas serupa
        .map(s => ({
          id: s.slug_id,
          icon: s.icon,
          name: s.nama,
          price: parseFloat(s.harga_default),
          change: parseFloat(s.perubahan_default)
        }));

      // Tambahkan fetch berita dari database
      try {
        const newsResponse = await fetch(`api_berita.php?slug=${commodityId}`);
        if (newsResponse.ok) {
          C.news = await newsResponse.json();
        } else {
          C.news = [];
        }
      } catch (e) {
        console.error("Gagal load berita", e);
        C.news = [];
      }
      
      // Jika yang di-klik adalah beras, panggil BPS untuk update harganya
      if (C.id === 'beras' || C.id === 'beras-med') {
         await fetchBerasBPS();
      }
      
      initPageElements(); // Panggil fungsi untuk me-render UI
    }
  } catch (err) {
    console.error("Gagal load detail komoditas", err);
  }
}

const chartLabels = {
  '7H': ['Sen','Sel','Rab','Kam','Jum','Sab','Min'],
  '1B': Array.from({length:30},(_,i)=>`H-${30-i}`),
  '3B': ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agt','Sep','Okt','Nov','Nov','Des'],
  '1T': ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agt','Sep','Okt','Nov','Des'],
};

const params      = new URLSearchParams(window.location.search);
const commodityId = params.get('id') || 'beras';
const fmt         = n => 'Rp ' + n.toLocaleString('id-ID');
let chartInst     = null;
let currentPeriod = '7H';
let isWatching    = false;
let realHistory   = null;

async function fetchBerasBPS() {
  if (commodityId !== 'beras' && commodityId !== 'beras-med') return;
  try {
    const response = await fetch('coba_api.php');
    const dataBPS = await response.json();
    if (dataBPS.status === 'OK') {
        const content = dataBPS.datacontent;
        const keyPrefix = commodityId === 'beras' ? '122770125' : '122770131'; 
        let history = [];
        for (let m = 1; m <= 12; m++) {
            const key = keyPrefix + m;
            if (content[key]) history.push(content[key]);
        }
        if (history.length > 0) {
            realHistory = history;
            const latestPrice = history[history.length - 1];
            C.price = latestPrice;
            if (history.length > 1) {
                const prevPrice = history[history.length - 2];
                const change = ((latestPrice - prevPrice) / prevPrice) * 100;
                C.change = parseFloat(change.toFixed(1));
            }
        }
    }
  } catch (error) {
    console.error('API Error:', error);
  }
}

function genData(period) {
  const len = {'7H':7,'1B':30,'3B':13,'1T':12}[period];
  
  if ((commodityId === 'beras' || commodityId === 'beras-med') && realHistory && realHistory.length > 0) {
      let data = realHistory.slice(-len);
      while (data.length > 0 && data.length < len) {
          data.unshift(data[0]);
      }
      return data;
  }

  return Array.from({length:len},(_,i)=>
    Math.round(C.price*(0.93+i/(len*4)+Math.random()*0.05))
  );
}

function initPageElements() {
  renderPrediksiChart(); // Panggil render grafik prediksi
  document.title = C.name + ' — PantauPangan';
  document.getElementById('breadcrumb').textContent = C.name;
  document.getElementById('heroEmoji').textContent  = C.icon;
  document.getElementById('heroCat').textContent    = C.catIcon + ' ' + C.cat;
  document.getElementById('heroName').innerHTML     = `<span class="mr-2">${C.icon}</span>${C.name}`;
  document.getElementById('heroDesc').textContent   = C.desc;
  document.getElementById('heroPrice').textContent  = fmt(C.price);
  document.getElementById('heroUnit').textContent   = C.unit + ' · Hari ini';
  document.getElementById('chartSub').textContent   = C.name + ' — Rata-rata Nasional';
  document.getElementById('newsSub').textContent    = 'Seputar ' + C.name;

  const badge = document.getElementById('heroBadge');
  if (C.change > 0) {
    badge.className = 'inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-full bg-green-400/20 text-green-300';
    badge.textContent = `▲ +${C.change}% dari kemarin`;
  } else if (C.change < 0) {
    badge.className = 'inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-full bg-red-400/20 text-red-300';
    badge.textContent = `▼ ${C.change}% dari kemarin`;
  } else {
    badge.className = 'inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-full bg-white/10 text-white/60';
    badge.textContent = '— Stabil';
  }

  const d = genData('7H');
  const hi = Math.max(...d), lo = Math.min(...d), avg = Math.round(d.reduce((a,b)=>a+b,0)/d.length);
  document.getElementById('pillHigh').textContent    = fmt(hi);
  document.getElementById('pillLow').textContent     = fmt(lo);
  document.getElementById('pillAvg').textContent     = fmt(avg);
  document.getElementById('pillVol').textContent     = Math.abs(C.change)>5?'Tinggi':Math.abs(C.change)>2?'Sedang':'Rendah';
  const mo = (C.change*2.5).toFixed(1);
  const mp = document.getElementById('pillMonthly');
  mp.textContent  = C.change>=0?`+${mo}%`:`${mo}%`;
  mp.className    = 'text-lg font-bold ' + (C.change>=0?'text-green-700':'text-red-600');

  renderInfo(); renderRegion(); renderNews(); renderSimilar(); updateChart();
}

function renderInfo() {
  document.getElementById('infoList').innerHTML = C.info.map(i=>`
    <div class="flex justify-between items-start px-6 py-3 border-b border-cream-dark last:border-0 gap-3">
      <span class="text-xs text-gray-400 flex-shrink-0">${i.k}</span>
      <span class="text-sm font-semibold text-gray-800 text-right">${i.v}</span>
    </div>`).join('');
}

async function renderRegion() {
  try {
    const response = await fetch(`api_harga_provinsi.php?slug=${commodityId}`);
    const result = await response.json();
    
    if (result.status === 'success' && result.data.length > 0) {
      const avgPrice = result.data.reduce((sum, item) => sum + item.harga, 0) / result.data.length;
      
      // Ambil 10 provinsi teratas (yang sudah diurutkan berdasarkan harga tertinggi dari database)
      document.getElementById('regionTableBody').innerHTML = result.data.slice(0, 10).map((r,i)=>{
        const price = r.harga;
        const chg   = r.perubahan.toFixed(1);
        const isHi  = price > avgPrice * 1.05;
        const isLo  = price < avgPrice * 0.95;
        
        return `
          <tr class="border-b border-cream-dark last:border-0 hover:bg-cream transition-colors">
            <td class="px-5 py-3 text-xs text-gray-400">${i+1}</td>
            <td class="px-4 py-3 text-sm font-semibold text-gray-800">📍 ${r.wilayah}</td>
            <td class="px-4 py-3 text-sm font-bold text-green-deep">${fmt(price)}</td>
            <td class="px-4 py-3 text-xs font-semibold ${parseFloat(chg)>=0?'text-green-700':'text-red-600'}">
              ${parseFloat(chg)>=0?'▲':'▼'} ${Math.abs(chg)}%
            </td>
            <td class="px-4 py-3">
              <span class="inline-flex items-center gap-1 text-[0.7rem] font-semibold px-2.5 py-1 rounded-full
                           ${isHi?'bg-red-50 text-red-600':isLo?'bg-orange-50 text-orange-600':'bg-green-mist text-green-deep'}">
                ${isHi?'⚠️ Tinggi':isLo?'📉 Murah':'✅ Normal'}
              </span>
            </td>
          </tr>`;
      }).join('');
    } else {
      document.getElementById('regionTableBody').innerHTML = `<tr><td colspan="5" class="px-5 py-6 text-center text-sm text-gray-400">Data provinsi tidak tersedia.</td></tr>`;
    }
  } catch (err) {
    console.error("Gagal load data provinsi", err);
  }
}

function renderNews() {
  document.getElementById('relatedNews').innerHTML = (C.news||[]).map(n=>`
    <a href="../index.html#berita"
       class="flex gap-3 px-5 py-4 border-b border-cream-dark last:border-0 hover:bg-cream transition-colors no-underline">
      <div class="w-10 h-10 bg-green-mist rounded-xl flex items-center justify-center text-lg flex-shrink-0">${n.icon}</div>
      <div>
        <p class="text-sm font-semibold text-gray-800 leading-snug mb-1">${n.title}</p>
        <p class="text-xs text-gray-400">${n.meta}</p>
      </div>
    </a>`).join('');
}

function renderSimilar() {
  document.getElementById('similarGrid').innerHTML = (C.similar||[]).map(s=>`
    <a href="detail.php?id=${s.id}"
       class="block bg-cream border border-cream-dark rounded-xl p-4 text-center hover:border-green-pale hover:shadow-sm hover:-translate-y-0.5 transition-all no-underline">
      <span class="text-3xl block mb-2">${s.icon}</span>
      <p class="text-xs font-semibold text-gray-700 mb-1">${s.name}</p>
      <p class="text-sm font-bold text-green-deep">${fmt(s.price)}</p>
      <p class="text-xs font-semibold mt-0.5 ${s.change>0?'text-green-700':'text-red-600'}">
        ${s.change>0?'▲':'▼'} ${Math.abs(s.change)}%
      </p>
    </a>`).join('');
}

let prediksiChartInst = null;
async function renderPrediksiChart(wilayah = 'Semua Provinsi') {
  try {
    const response = await fetch(`predict.php?wilayah=${wilayah}`);
    const data = await response.json();
    if(data.error) {
       alert(data.error);
       return console.error(data.error);
    }

    const labelHistoris = data.historis.map(d => d.tanggal);
    const hargaHistoris = data.historis.map(d => d.harga);
    const labelPrediksi = data.prediksi.map(d => d.tanggal);
    const hargaPrediksi = data.prediksi.map(d => d.harga);

    const semuaLabel = labelHistoris.concat(labelPrediksi);
    const arrayPrediksi = Array(labelHistoris.length).fill(null);
    arrayPrediksi[labelHistoris.length - 1] = hargaHistoris[hargaHistoris.length - 1]; 
    const dataPrediksiFinal = arrayPrediksi.concat(hargaPrediksi);

    if (prediksiChartInst) prediksiChartInst.destroy();
    const ctx = document.getElementById('hargaChart').getContext('2d');
    prediksiChartInst = new Chart(ctx, {
      type: 'line',
      data: {
        labels: semuaLabel,
        datasets: [
          {
            label: 'Harga Historis (Asli)',
            data: hargaHistoris,
            borderColor: '#2d6a4f',
            backgroundColor: 'rgba(45, 106, 79, 0.1)',
            borderWidth: 2,
            pointRadius: 1,
            fill: true,
            tension: 0.1 
          },
          {
            label: 'Prediksi 7 Hari Kedepan',
            data: dataPrediksiFinal,
            borderColor: '#e53935',
            borderWidth: 2,
            borderDash: [5, 5],
            pointRadius: 2,
            pointBackgroundColor: '#e53935',
            fill: false,
            tension: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: {
            display: true, position: 'top',
            labels: { boxWidth: 12, usePointStyle: true, font: { family: 'Plus Jakarta Sans', size: 11 } }
          },
          tooltip: {
            backgroundColor: '#1a3a2a', titleColor: 'rgba(255,255,255,.6)', bodyColor: 'white',
            bodyFont: { weight: 'bold', size: 13 }, padding: 12, cornerRadius: 8,
            callbacks: { label: c => ' Rp ' + c.parsed.y.toLocaleString('id-ID') }
          }
        },
        scales: {
          x: {
            grid: { display: false }, border: { display: false },
            ticks: { font: { size: 11, family: 'Plus Jakarta Sans' }, color: '#9ca3af', maxTicksLimit: 10 }
          },
          y: {
            grid: { color: 'rgba(0,0,0,.04)' }, border: { display: false },
            ticks: { font: { size: 11, family: 'Plus Jakarta Sans' }, color: '#9ca3af', callback: v => 'Rp ' + (v / 1000) + 'rb' }
          }
        }
      }
    });
  } catch (e) {
    console.error("Gagal load data prediksi:", e);
  }
}

function updateChart() {
  const data   = genData(currentPeriod);
  const labels = chartLabels[currentPeriod];
  if (chartInst) chartInst.destroy();
  const ctx    = document.getElementById('detailChart').getContext('2d');
  const isDown = C.change < 0;
  const color  = isDown ? '#e53935' : '#2d6a4f';
  const grad   = ctx.createLinearGradient(0,0,0,224);
  grad.addColorStop(0, isDown?'rgba(229,57,53,.18)':'rgba(82,183,136,.2)');
  grad.addColorStop(1, 'rgba(82,183,136,0)');
  chartInst = new Chart(ctx,{
    type:'line',
    data:{ labels, datasets:[{ data, borderColor:color, backgroundColor:grad,
      borderWidth:2.5, pointRadius:3, pointBackgroundColor:color, pointHoverRadius:7, tension:.4, fill:true }] },
    options:{
      responsive:true, maintainAspectRatio:false,
      interaction:{intersect:false,mode:'index'},
      plugins:{ legend:{display:false},
        tooltip:{ backgroundColor:'#1a3a2a', titleColor:'rgba(255,255,255,.6)', bodyColor:'white',
          bodyFont:{weight:'bold',size:13}, padding:12, cornerRadius:8,
          callbacks:{label:c=>' '+fmt(c.parsed.y)} } },
      scales:{
        x:{ grid:{display:false}, border:{display:false},
            ticks:{font:{size:11,family:'Plus Jakarta Sans'},color:'#9ca3af',maxTicksLimit:8} },
        y:{ grid:{color:'rgba(0,0,0,.04)'}, border:{display:false},
            ticks:{font:{size:11,family:'Plus Jakarta Sans'},color:'#9ca3af',
              callback:v=>'Rp '+new Intl.NumberFormat('id-ID').format(v/1000)+'rb'} }
      }
    }
  });
}

function changePeriod(p, btn) {
  currentPeriod = p;
  document.querySelectorAll('.period-btn').forEach(b=>{
    b.className = 'period-btn text-xs font-semibold px-3 py-1.5 rounded-lg bg-cream text-gray-400 border-0 cursor-pointer font-sans hover:bg-green-mist hover:text-green-deep transition-colors';
  });
  btn.className = 'period-btn active text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-mid text-white border-0 cursor-pointer font-sans';
  updateChart();
}

async function toggleWatch() {
  const btn = document.getElementById('watchBtn');
  const action = isWatching ? 'remove' : 'add';

  // Disable tombol sementara
  btn.disabled = true;
  btn.style.opacity = '0.5';

  try {
    const response = await fetch('api_toggle_pantauan.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action: action, slug: commodityId })
    });
    const result = await response.json();

    if (result.status === 'success') {
      isWatching = result.is_watching;
      updateWatchButton();
    } else {
      alert('Gagal: ' + (result.message || 'Terjadi kesalahan.'));
    }
  } catch (error) {
    console.error('Gagal toggle pantauan:', error);
    alert('Terjadi kesalahan jaringan.');
  } finally {
    btn.disabled = false;
    btn.style.opacity = '1';
  }
}

function updateWatchButton() {
  const btn = document.getElementById('watchBtn');
  if (isWatching) {
    btn.textContent = '✅ Dipantau';
    btn.classList.add('bg-green-mid','text-white','border-green-mid');
    btn.classList.remove('text-gray-500','bg-white','border-cream-dark');
  } else {
    btn.textContent = '⭐ Pantau';
    btn.classList.remove('bg-green-mid','text-white','border-green-mid');
    btn.classList.add('text-gray-500','bg-white','border-cream-dark');
  }
}

async function checkWatchStatus() {
  try {
    const response = await fetch(`api_toggle_pantauan.php?action=check&slug=${commodityId}`, {
      credentials: 'include'
    });
    const result = await response.json();
    if (result.status === 'success') {
      isWatching = result.is_watching;
      updateWatchButton();
    }
  } catch (error) {
    console.error('Gagal cek status pantauan:', error);
  }
}

checkWatchStatus();
fetchDetailKomoditas();
</script>
</body>
</html>




