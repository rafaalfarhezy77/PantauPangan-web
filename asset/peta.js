// ══════════════════════════════════════
// PantauPangan — Peta Komoditas Interaktif
// ══════════════════════════════════════

// ── Kategori & Warna ──
const CATEGORIES = {
  'Pangan Pokok':  { color: '#2d6a4f', icon: '🌾' },
  'Hortikultura':  { color: '#e63946', icon: '🌶️' },
  'Perkebunan':    { color: '#d4a373', icon: '🌴' },
  'Perikanan':     { color: '#0077b6', icon: '🐟' },
};

// ── Mock Data Provinsi ──
const PROVINCE_DATA = {
  "ACEH": {
    kategori: "Pangan Pokok",
    kabupaten: [
      { nama: "Kab. Aceh Utara", komoditas: "Beras" },
      { nama: "Kab. Bireuen", komoditas: "Beras" },
      { nama: "Kab. Aceh Tengah", komoditas: "Kopi Gayo" },
      { nama: "Kab. Pidie", komoditas: "Beras" },
    ]
  },
  "SUMATERA UTARA": {
    kategori: "Perkebunan",
    kabupaten: [
      { nama: "Kab. Simalungun", komoditas: "Kelapa Sawit" },
      { nama: "Kab. Deli Serdang", komoditas: "Kelapa Sawit" },
      { nama: "Kab. Langkat", komoditas: "Karet" },
      { nama: "Kab. Karo", komoditas: "Sayuran" },
      { nama: "Kab. Tapanuli Utara", komoditas: "Kopi" },
    ]
  },
  "SUMATERA BARAT": {
    kategori: "Pangan Pokok",
    kabupaten: [
      { nama: "Kab. Agam", komoditas: "Beras" },
      { nama: "Kab. Tanah Datar", komoditas: "Beras" },
      { nama: "Kab. Solok", komoditas: "Beras" },
      { nama: "Kab. Pesisir Selatan", komoditas: "Jagung" },
    ]
  },
  "RIAU": {
    kategori: "Perkebunan",
    kabupaten: [
      { nama: "Kab. Kampar", komoditas: "Kelapa Sawit" },
      { nama: "Kab. Rokan Hilir", komoditas: "Kelapa Sawit" },
      { nama: "Kab. Bengkalis", komoditas: "Kelapa Sawit" },
      { nama: "Kab. Siak", komoditas: "Kelapa Sawit" },
    ]
  },
  "JAMBI": {
    kategori: "Perkebunan",
    kabupaten: [
      { nama: "Kab. Bungo", komoditas: "Karet" },
      { nama: "Kab. Merangin", komoditas: "Karet" },
      { nama: "Kab. Batanghari", komoditas: "Kelapa Sawit" },
    ]
  },
  "SUMATERA SELATAN": {
    kategori: "Perkebunan",
    kabupaten: [
      { nama: "Kab. Musi Banyuasin", komoditas: "Kelapa Sawit" },
      { nama: "Kab. Ogan Komering Ulu", komoditas: "Kopi Robusta" },
      { nama: "Kab. Muara Enim", komoditas: "Karet" },
    ]
  },
  "BENGKULU": {
    kategori: "Perkebunan",
    kabupaten: [
      { nama: "Kab. Rejang Lebong", komoditas: "Kopi" },
      { nama: "Kab. Bengkulu Utara", komoditas: "Kelapa Sawit" },
    ]
  },
  "LAMPUNG": {
    kategori: "Pangan Pokok",
    kabupaten: [
      { nama: "Kab. Lampung Tengah", komoditas: "Jagung" },
      { nama: "Kab. Lampung Timur", komoditas: "Beras" },
      { nama: "Kab. Tanggamus", komoditas: "Kopi Robusta" },
    ]
  },
  "KEPULAUAN BANGKA BELITUNG": {
    kategori: "Perikanan",
    kabupaten: [
      { nama: "Kab. Bangka", komoditas: "Ikan Laut" },
      { nama: "Kab. Belitung", komoditas: "Udang" },
    ]
  },
  "KEPULAUAN RIAU": {
    kategori: "Perikanan",
    kabupaten: [
      { nama: "Kab. Bintan", komoditas: "Ikan Laut" },
      { nama: "Kab. Karimun", komoditas: "Ikan Laut" },
    ]
  },
  "DKI JAKARTA": {
    kategori: "Pangan Pokok",
    kabupaten: [
      { nama: "Jakarta Utara", komoditas: "Pusat Distribusi" },
      { nama: "Jakarta Barat", komoditas: "Pusat Distribusi" },
    ]
  },
  "JAWA BARAT": {
    kategori: "Pangan Pokok",
    kabupaten: [
      { nama: "Kab. Indramayu", komoditas: "Beras" },
      { nama: "Kab. Karawang", komoditas: "Beras" },
      { nama: "Kab. Subang", komoditas: "Beras" },
      { nama: "Kab. Garut", komoditas: "Cabai Merah" },
      { nama: "Kab. Bandung", komoditas: "Sayuran" },
      { nama: "Kab. Cianjur", komoditas: "Beras" },
    ]
  },
  "JAWA TENGAH": {
    kategori: "Pangan Pokok",
    kabupaten: [
      { nama: "Kab. Demak", komoditas: "Beras" },
      { nama: "Kab. Sragen", komoditas: "Beras" },
      { nama: "Kab. Brebes", komoditas: "Bawang Merah" },
      { nama: "Kab. Tegal", komoditas: "Bawang Merah" },
      { nama: "Kab. Wonosobo", komoditas: "Kentang" },
    ]
  },
  "DI YOGYAKARTA": {
    kategori: "Pangan Pokok",
    kabupaten: [
      { nama: "Kab. Sleman", komoditas: "Beras" },
      { nama: "Kab. Bantul", komoditas: "Beras" },
      { nama: "Kab. Kulon Progo", komoditas: "Beras" },
    ]
  },
  "JAWA TIMUR": {
    kategori: "Hortikultura",
    kabupaten: [
      { nama: "Kab. Banyuwangi", komoditas: "Cabai Rawit" },
      { nama: "Kab. Kediri", komoditas: "Cabai Merah" },
      { nama: "Kab. Nganjuk", komoditas: "Bawang Merah" },
      { nama: "Kab. Probolinggo", komoditas: "Bawang Merah" },
      { nama: "Kab. Jember", komoditas: "Tembakau" },
      { nama: "Kab. Lamongan", komoditas: "Beras" },
    ]
  },
  "BANTEN": {
    kategori: "Pangan Pokok",
    kabupaten: [
      { nama: "Kab. Serang", komoditas: "Beras" },
      { nama: "Kab. Pandeglang", komoditas: "Beras" },
      { nama: "Kab. Lebak", komoditas: "Jagung" },
    ]
  },
  "BALI": {
    kategori: "Hortikultura",
    kabupaten: [
      { nama: "Kab. Tabanan", komoditas: "Beras" },
      { nama: "Kab. Bangli", komoditas: "Sayuran" },
      { nama: "Kab. Karangasem", komoditas: "Cabai" },
    ]
  },
  "NUSA TENGGARA BARAT": {
    kategori: "Pangan Pokok",
    kabupaten: [
      { nama: "Kab. Lombok Timur", komoditas: "Jagung" },
      { nama: "Kab. Sumbawa", komoditas: "Jagung" },
      { nama: "Kab. Bima", komoditas: "Bawang Merah" },
    ]
  },
  "NUSA TENGGARA TIMUR": {
    kategori: "Pangan Pokok",
    kabupaten: [
      { nama: "Kab. Kupang", komoditas: "Jagung" },
      { nama: "Kab. Timor Tengah Selatan", komoditas: "Jagung" },
      { nama: "Kab. Manggarai", komoditas: "Kopi" },
    ]
  },
  "KALIMANTAN BARAT": {
    kategori: "Perkebunan",
    kabupaten: [
      { nama: "Kab. Ketapang", komoditas: "Kelapa Sawit" },
      { nama: "Kab. Sambas", komoditas: "Beras" },
      { nama: "Kab. Sanggau", komoditas: "Kelapa Sawit" },
    ]
  },
  "KALIMANTAN TENGAH": {
    kategori: "Perkebunan",
    kabupaten: [
      { nama: "Kab. Kotawaringin Barat", komoditas: "Kelapa Sawit" },
      { nama: "Kab. Kapuas", komoditas: "Kelapa Sawit" },
    ]
  },
  "KALIMANTAN SELATAN": {
    kategori: "Pangan Pokok",
    kabupaten: [
      { nama: "Kab. Barito Kuala", komoditas: "Beras" },
      { nama: "Kab. Hulu Sungai Utara", komoditas: "Beras" },
      { nama: "Kab. Tapin", komoditas: "Beras" },
    ]
  },
  "KALIMANTAN TIMUR": {
    kategori: "Perkebunan",
    kabupaten: [
      { nama: "Kab. Kutai Kartanegara", komoditas: "Kelapa Sawit" },
      { nama: "Kab. Paser", komoditas: "Kelapa Sawit" },
    ]
  },
  "KALIMANTAN UTARA": {
    kategori: "Perkebunan",
    kabupaten: [
      { nama: "Kab. Bulungan", komoditas: "Kelapa Sawit" },
      { nama: "Kab. Nunukan", komoditas: "Kelapa Sawit" },
    ]
  },
  "SULAWESI UTARA": {
    kategori: "Perkebunan",
    kabupaten: [
      { nama: "Kab. Minahasa", komoditas: "Cengkeh" },
      { nama: "Kab. Bolaang Mongondow", komoditas: "Jagung" },
    ]
  },
  "SULAWESI TENGAH": {
    kategori: "Perkebunan",
    kabupaten: [
      { nama: "Kab. Parigi Moutong", komoditas: "Kakao" },
      { nama: "Kab. Donggala", komoditas: "Kakao" },
    ]
  },
  "SULAWESI SELATAN": {
    kategori: "Pangan Pokok",
    kabupaten: [
      { nama: "Kab. Bone", komoditas: "Beras" },
      { nama: "Kab. Wajo", komoditas: "Beras" },
      { nama: "Kab. Pinrang", komoditas: "Beras" },
      { nama: "Kab. Luwu", komoditas: "Kakao" },
      { nama: "Kab. Enrekang", komoditas: "Bawang Merah" },
    ]
  },
  "SULAWESI TENGGARA": {
    kategori: "Perikanan",
    kabupaten: [
      { nama: "Kab. Muna", komoditas: "Ikan Laut" },
      { nama: "Kab. Konawe", komoditas: "Kakao" },
    ]
  },
  "GORONTALO": {
    kategori: "Pangan Pokok",
    kabupaten: [
      { nama: "Kab. Gorontalo", komoditas: "Jagung" },
      { nama: "Kab. Boalemo", komoditas: "Jagung" },
    ]
  },
  "SULAWESI BARAT": {
    kategori: "Perkebunan",
    kabupaten: [
      { nama: "Kab. Mamuju", komoditas: "Kelapa Sawit" },
      { nama: "Kab. Polewali Mandar", komoditas: "Kakao" },
    ]
  },
  "MALUKU": {
    kategori: "Perikanan",
    kabupaten: [
      { nama: "Kab. Maluku Tengah", komoditas: "Ikan Tuna" },
      { nama: "Kab. Seram Bagian Barat", komoditas: "Cengkeh" },
    ]
  },
  "MALUKU UTARA": {
    kategori: "Perkebunan",
    kabupaten: [
      { nama: "Kab. Halmahera Utara", komoditas: "Cengkeh" },
      { nama: "Kab. Halmahera Selatan", komoditas: "Kelapa" },
    ]
  },
  "PAPUA": {
    kategori: "Pangan Pokok",
    kabupaten: [
      { nama: "Kab. Merauke", komoditas: "Beras" },
      { nama: "Kab. Jayapura", komoditas: "Ubi Jalar" },
    ]
  },
  "PAPUA BARAT": {
    kategori: "Perikanan",
    kabupaten: [
      { nama: "Kab. Manokwari", komoditas: "Ikan Laut" },
      { nama: "Kab. Fakfak", komoditas: "Pala" },
    ]
  },
};

// ── Alias untuk nama provinsi GeoJSON -> key mock data ──
const NAME_ALIASES = {
  "NANGGROE ACEH DARUSSALAM": "ACEH",
  "BANGKA BELITUNG": "KEPULAUAN BANGKA BELITUNG",
  "JAKARTA RAYA": "DKI JAKARTA",
  "YOGYAKARTA": "DI YOGYAKARTA",
  "IRIAN JAYA BARAT": "PAPUA BARAT",
};

// ── GeoJSON Sources (fallback order) ──
const GEOJSON_URLS = [
  "https://raw.githubusercontent.com/superpikar/indonesia-geojson/master/indonesia.geojson",
  "https://raw.githubusercontent.com/ans-4175/peta-indonesia-geojson/master/indonesia-prov.geojson",
];

// ══════════════════════════════
// MAP INITIALIZATION
// ══════════════════════════════
const map = L.map('map', {
  center: [-2.5, 118],
  zoom: 5,
  minZoom: 4,
  maxZoom: 10,
  zoomControl: false,
});

// Zoom control kanan atas
L.control.zoom({ position: 'topright' }).addTo(map);

// Tile layer — CartoDB Positron (clean & light)
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; <a href="https://carto.com/">CARTO</a> | PantauPangan',
  subdomains: 'abcd',
  maxZoom: 19,
}).addTo(map);

// ── State ──
let geojsonLayer = null;
let selectedLayer = null;

// ══════════════════════════════
// HELPERS
// ══════════════════════════════

function normalizeName(name) {
  return (name || '')
    .toUpperCase()
    .replace(/^PROV(?:INSI)?\.?\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function findProvinceData(rawName) {
  const norm = normalizeName(rawName);
  const aliased = NAME_ALIASES[norm] || norm;
  return PROVINCE_DATA[aliased] || PROVINCE_DATA[norm] || null;
}

function getProvinceName(props) {
  const keys = ['state', 'NAME_1', 'name', 'Provinsi', 'provinsi', 'PROVINSI', 'shapeName', 'ADM1_EN'];
  for (const k of keys) {
    if (props[k]) return props[k];
  }
  return Object.values(props).find(v => typeof v === 'string' && v.length > 2) || 'Unknown';
}

function darkenColor(hex, pct) {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.max(0, (num >> 16) - Math.round(255 * pct));
  const g = Math.max(0, ((num >> 8) & 0xff) - Math.round(255 * pct));
  const b = Math.max(0, (num & 0xff) - Math.round(255 * pct));
  return `rgb(${r},${g},${b})`;
}

// ══════════════════════════════
// LEGEND
// ══════════════════════════════
function buildLegend() {
  const el = document.getElementById('legendItems');
  el.innerHTML = Object.entries(CATEGORIES).map(([name, { color, icon }]) =>
    `<div class="flex items-center gap-2.5">
       <div class="w-4 h-4 rounded shrink-0" style="background:${color}"></div>
       <span class="text-xs text-gray-600">${icon} ${name}</span>
     </div>`
  ).join('');
}

// ══════════════════════════════
// SIDE PANEL
// ══════════════════════════════
function openPanel(name, data) {
  const panel = document.getElementById('sidePanel');
  const cat = CATEGORIES[data.kategori] || { color: '#6b7280', icon: '📦' };

  document.getElementById('panelTitle').textContent = titleCase(name);
  document.getElementById('panelSubtitle').textContent = `${data.kabupaten.length} kabupaten/kota terpantau`;
  
  const badge = document.getElementById('panelBadge');
  badge.textContent = `${cat.icon} ${data.kategori}`;
  badge.style.background = cat.color + '18';
  badge.style.color = cat.color;

  const list = document.getElementById('panelList');
  list.innerHTML = data.kabupaten.map((k, i) =>
    `<div class="flex items-start gap-3 bg-gray-50 rounded-xl p-3 hover:bg-green-mist/40 transition-colors">
       <div class="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center text-xs font-bold text-gray-400 shrink-0">${i + 1}</div>
       <div>
         <div class="text-sm font-semibold text-green-deep">${k.nama}</div>
         <div class="text-xs text-gray-400 mt-0.5">${cat.icon} ${k.komoditas}</div>
       </div>
     </div>`
  ).join('');

  panel.classList.remove('hidden');
  panel.firstElementChild.className = panel.firstElementChild.className.replace('panel-exit', '');
  panel.firstElementChild.classList.add('panel-enter');
}

function closePanel() {
  const panel = document.getElementById('sidePanel');
  const inner = panel.firstElementChild;
  inner.classList.remove('panel-enter');
  inner.classList.add('panel-exit');
  setTimeout(() => { panel.classList.add('hidden'); inner.classList.remove('panel-exit'); }, 250);

  if (selectedLayer) {
    geojsonLayer.resetStyle(selectedLayer);
    selectedLayer = null;
  }
}

function titleCase(str) {
  return str.toLowerCase().replace(/(?:^|\s|[-])\w/g, m => m.toUpperCase());
}

// ══════════════════════════════
// GEOJSON STYLING & INTERACTION
// ══════════════════════════════
function getStyle(feature) {
  const name = getProvinceName(feature.properties);
  const data = findProvinceData(name);
  const cat = data ? CATEGORIES[data.kategori] : null;
  return {
    fillColor: cat ? cat.color : '#d1d5db',
    weight: 1.5,
    color: '#ffffff',
    fillOpacity: 0.55,
    opacity: 0.8,
  };
}

function onEachFeature(feature, layer) {
  const rawName = getProvinceName(feature.properties);
  const data = findProvinceData(rawName);

  layer.on({
    mouseover: (e) => {
      const l = e.target;
      l.setStyle({ weight: 2.5, color: '#1a3a2a', fillOpacity: 0.75 });
      l.bringToFront();

      // Show hover bar
      const cat = data ? CATEGORIES[data.kategori] : null;
      const bar = document.getElementById('hoverBar');
      document.getElementById('hoverName').textContent = titleCase(normalizeName(rawName));
      document.getElementById('hoverKategori').textContent = data ? `${cat.icon} ${data.kategori} — ${data.kabupaten.length} kab/kota` : 'Data belum tersedia';
      document.getElementById('hoverDot').style.background = cat ? cat.color : '#d1d5db';
      bar.classList.remove('hidden');
    },
    mouseout: (e) => {
      if (selectedLayer !== e.target) geojsonLayer.resetStyle(e.target);
      document.getElementById('hoverBar').classList.add('hidden');
    },
    click: (e) => {
      // Reset previous selection
      if (selectedLayer) geojsonLayer.resetStyle(selectedLayer);

      if (data) {
        selectedLayer = e.target;
        e.target.setStyle({ weight: 3, color: '#1a3a2a', fillOpacity: 0.85 });
        openPanel(normalizeName(rawName), data);
      } else {
        selectedLayer = null;
        closePanel();
      }

      map.fitBounds(e.target.getBounds(), { padding: [50, 50], maxZoom: 7 });
    },
  });
}

// ══════════════════════════════
// LOAD GEOJSON
// ══════════════════════════════
async function loadGeoJSON() {
  let geojsonData = null;

  for (const url of GEOJSON_URLS) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      geojsonData = await res.json();
      if (geojsonData && geojsonData.features) break;
    } catch (_) { /* try next URL */ }
  }

  if (!geojsonData || !geojsonData.features) {
    document.getElementById('loadingOverlay').classList.add('hidden');
    const errEl = document.getElementById('errorOverlay');
    errEl.classList.remove('hidden');
    errEl.classList.add('flex');
    document.getElementById('errorMsg').textContent =
      'Tidak dapat memuat data GeoJSON dari server. Periksa koneksi internet Anda.';
    return;
  }

  // Render GeoJSON
  geojsonLayer = L.geoJSON(geojsonData, {
    style: getStyle,
    onEachFeature: onEachFeature,
  }).addTo(map);

  // Update stats
  const matched = geojsonData.features.filter(f => findProvinceData(getProvinceName(f.properties))).length;
  document.getElementById('statProvinsi').textContent = matched;

  const allKomoditas = new Set();
  Object.values(PROVINCE_DATA).forEach(p => p.kabupaten.forEach(k => allKomoditas.add(k.komoditas)));
  document.getElementById('statKomoditas').textContent = allKomoditas.size;

  // Fit bounds
  map.fitBounds(geojsonLayer.getBounds(), { padding: [30, 30] });

  // Hide loading
  const overlay = document.getElementById('loadingOverlay');
  overlay.style.opacity = '0';
  setTimeout(() => overlay.classList.add('hidden'), 500);
}

// ══════════════════════════════
// INIT
// ══════════════════════════════
buildLegend();
loadGeoJSON();
