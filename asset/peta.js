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
        { nama: "Kab. Pesisir Selatan", komoditas: "Gula Pasir" },
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
        { nama: "Kab. Lampung Tengah", komoditas: "Gula Pasir" },
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
        { nama: "Kab. Lebak", komoditas: "Gula Pasir" },
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
        { nama: "Kab. Lombok Timur", komoditas: "Gula Pasir" },
        { nama: "Kab. Sumbawa", komoditas: "Gula Pasir" },
      { nama: "Kab. Bima", komoditas: "Bawang Merah" },
    ]
  },
  "NUSA TENGGARA TIMUR": {
    kategori: "Pangan Pokok",
    kabupaten: [
        { nama: "Kab. Kupang", komoditas: "Gula Pasir" },
        { nama: "Kab. Timor Tengah Selatan", komoditas: "Gula Pasir" },
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
        { nama: "Kab. Bolaang Mongondow", komoditas: "Gula Pasir" },
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
        { nama: "Kab. Gorontalo", komoditas: "Gula Pasir" },
        { nama: "Kab. Boalemo", komoditas: "Gula Pasir" },
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
  zoomControl: false,
  scrollWheelZoom: false,
  doubleClickZoom: false,
  touchZoom: false,
  boxZoom: false,
  keyboard: false,
});

// Tile layer — CartoDB Positron (clean & light)
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; <a href="https://carto.com/">CARTO</a> | PantauPangan',
  subdomains: 'abcd',
  maxZoom: 19,
}).addTo(map);

// ── Kunci Geser Vertikal (Hanya Horizontal) ──
let dragLat;
map.on('dragstart', function() {
  dragLat = map.getCenter().lat;
});
map.on('drag', function() {
  const center = map.getCenter();
  if (center.lat !== dragLat) {
    map.setView([dragLat, center.lng], map.getZoom(), {animate: false});
  }
});

// ── State ──
let geojsonLayer = null;
let selectedLayer = null;
let currentSlug = 'beras'; // Default komoditas untuk panel peta

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
async function openPanel(provinceName, staticData) {
  const panel = document.getElementById('sidePanel');
  const cat = staticData ? (CATEGORIES[staticData.kategori] || { color: '#6b7280', icon: '📦' }) : { color: '#2d6a4f', icon: '🗺️' };

  // Tampilkan panel dengan loading state dulu
  document.getElementById('panelTitle').textContent = titleCase(provinceName);
  document.getElementById('panelSubtitle').textContent = 'Memuat data...';

  const badge = document.getElementById('panelBadge');
  badge.textContent = staticData ? `${cat.icon} ${staticData.kategori}` : '🗺️ Provinsi';
  badge.style.background = cat.color + '18';
  badge.style.color = cat.color;

  const list = document.getElementById('panelList');
  list.innerHTML = `<div class="flex items-center justify-center py-8 text-gray-400 text-sm">⏳ Memuat kab/kota...</div>`;

  panel.classList.remove('hidden');
  panel.firstElementChild.className = panel.firstElementChild.className.replace('panel-exit', '');
  panel.firstElementChild.classList.add('panel-enter');

  // Fetch data real dari API
  try {
    const url = `api/kab_kota_by_provinsi.php?provinsi=${encodeURIComponent(provinceName)}&slug=${encodeURIComponent(currentSlug)}`;
    const res  = await fetch(url);
    const json = await res.json();

    if (json.error) throw new Error(json.error);

    // Update subtitle dengan info harga provinsi
    let subtitleText = `${json.total} kab/kota terpantau`;
    if (json.harga_provinsi) {
      const hargaFmt = 'Rp ' + json.harga_provinsi.toLocaleString('id-ID');
      subtitleText += ` · Rata-rata provinsi: ${hargaFmt}`;
    }
    document.getElementById('panelSubtitle').textContent = subtitleText;

    if (json.kab_kota.length === 0) {
      list.innerHTML = `<div class="text-center py-8 text-gray-400 text-sm">📭 Belum ada data kab/kota untuk komoditas ini.</div>`;
    } else {
      list.innerHTML = json.kab_kota.map((k, i) => {
        const hargaFmt = k.harga ? 'Rp ' + k.harga.toLocaleString('id-ID') : '—';
        const tglFmt   = k.tanggal ? new Date(k.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
        return `<div class="flex items-center justify-between gap-3 bg-gray-50 rounded-xl p-3 hover:bg-green-mist/40 transition-colors">
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center text-xs font-bold text-gray-400 shrink-0">${i + 1}</div>
            <div class="min-w-0">
              <div class="text-sm font-semibold text-green-deep truncate">${k.nama}</div>
              <div class="text-[10px] text-gray-400 mt-0.5">${tglFmt}</div>
            </div>
          </div>
          <div class="text-right shrink-0">
            <div class="text-sm font-bold text-green-mid">${hargaFmt}</div>
            <div class="text-[10px] text-gray-400">/kg</div>
          </div>
        </div>`;
      }).join('');
    }
  } catch (err) {
    // Fallback ke data statis jika API gagal / belum ada data
    if (staticData && staticData.kabupaten) {
      list.innerHTML = staticData.kabupaten.map((k, i) =>
        `<div class="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
           <div class="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center text-xs font-bold text-gray-400 shrink-0">${i + 1}</div>
           <div>
             <div class="text-sm font-semibold text-green-deep">${k.nama}</div>
             <div class="text-xs text-gray-400 mt-0.5">${cat.icon} ${k.komoditas}</div>
           </div>
         </div>`
      ).join('');
      document.getElementById('panelSubtitle').textContent = `${staticData.kabupaten.length} kab/kota (data statis)`;
    } else {
      list.innerHTML = `<div class="text-center py-8 text-gray-400 text-sm">⚠️ Gagal memuat data.</div>`;
      document.getElementById('panelSubtitle').textContent = 'Gagal memuat data dari database';
    }
  }
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

  // Kembalikan map ke posisi statis awal
  map.setView([-2.5, 118], 5);
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
    click: async (e) => {
      // Reset previous selection
      if (selectedLayer) geojsonLayer.resetStyle(selectedLayer);

      selectedLayer = e.target;
      e.target.setStyle({ weight: 3, color: '#1a3a2a', fillOpacity: 0.85 });
      // Selalu buka panel; API akan handle jika tidak ada data
      await openPanel(titleCase(normalizeName(rawName)), data);
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

  // Update stats dari GeoJSON
  document.getElementById('statProvinsi').textContent = geojsonData.features.length;

  // Update jumlah komoditas dari API
  fetch('api/api_komoditas.php')
    .then(r => r.json())
    .then(d => {
      if (Array.isArray(d)) document.getElementById('statKomoditas').textContent = d.length;
    })
    .catch(() => {
      const allKomoditas = new Set();
      Object.values(PROVINCE_DATA).forEach(p => p.kabupaten.forEach(k => allKomoditas.add(k.komoditas)));
      document.getElementById('statKomoditas').textContent = allKomoditas.size;
    });

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
