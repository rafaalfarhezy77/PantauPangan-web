let berasBPSHistory = [];

// ── DATA ──
let commodities = [];

async function fetchKomoditasDB() {
  try {
    const response = await fetch('api/api_komoditas.php');
    const result = await response.json();
    
    if (result.status === "success") {
      // Map data dari database agar formatnya sesuai dengan yang dibaca script lama
      commodities = result.data.map(item => ({
        id: item.slug_id,
        icon: item.icon,
        name: item.nama,
        unit: 'per kg', // Bisa lu tambahkan kolom unit di DB nanti kalau mau dinamis
        price: parseFloat(item.harga_default),
        change: parseFloat(item.perubahan_default),
        kategori: item.kategori.toLowerCase().includes('pokok') ? 'pokok' : 
                  item.kategori.toLowerCase().includes('bumbu') ? 'bumbu' :
                  item.kategori.toLowerCase().includes('protein') ? 'protein' : 'sayur'
      }));
    }
  } catch (error) {
    console.error("Gagal memuat komoditas dari Database:", error);
  }
}

async function fetchDataBerasBPS() {
  try {
    const response = await fetch('api/coba_api.php');
    const dataBPS = await response.json();
    if (dataBPS.status !== "OK") return;

    const content = dataBPS.datacontent;
    const keyPrefix = "122770125"; // Beras Premium — kode variabel BPS

    // Ambil data bulan 1 sampai 12 secara berurutan
    berasBPSHistory = [];
    for (let m = 1; m <= 12; m++) {
      const key = keyPrefix + m;
      if (content[key]) {
        berasBPSHistory.push(content[key]);
      }
    }

    // Update harga & perubahan beras dari data BPS terbaru
    if (berasBPSHistory.length > 0) {
      const latestPrice = berasBPSHistory[berasBPSHistory.length - 1];
      const berasIndex = commodities.findIndex(c => c.id === 'beras');
      if (berasIndex !== -1) {
        commodities[berasIndex].price = latestPrice;
        // Hitung persentase perubahan dari bulan sebelumnya (seperti di detail.php)
        if (berasBPSHistory.length > 1) {
          const prevPrice = berasBPSHistory[berasBPSHistory.length - 2];
          const change = ((latestPrice - prevPrice) / prevPrice) * 100;
          commodities[berasIndex].change = parseFloat(change.toFixed(1));
        }
      }
    }
  } catch (error) {
    console.error("Gagal sinkronisasi history BPS", error);
  }
}

async function fetchProvinsiBPS() {
  try {
    const response = await fetch('api/provinsi_api.php');
    if (!response.ok) throw new Error('Gagal memanggil API Provinsi');
    
    const result = await response.json();
    
    if (result.status === "OK") {
      // Data provinsi ada di result.data[1] berdasarkan file data_prov.json
      const provinces = result.data[1];
      const selectElement = document.getElementById('searchProvince');
      
      // Bersihkan pilihan yang sudah ada kecuali "Semua Provinsi"
      selectElement.innerHTML = '<option value="">Semua Provinsi</option>';
      
      provinces.forEach(prov => {
        const option = document.createElement('option');
        option.value = prov.domain_name; // Menggunakan nama provinsi untuk pencarian
        option.textContent = prov.domain_name;
        selectElement.appendChild(option);
      });
      console.log("Daftar Provinsi berhasil dimuat dari BPS.");
    }
  } catch (error) {
    console.error("Gagal memuat provinsi dari API:", error);
    // Fallback: isi dengan daftar provinsi statis
    const selectElement = document.getElementById('searchProvince');
    if (selectElement) {
      selectElement.innerHTML = '<option value="">Semua Provinsi</option>';
      provinsiStatis.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p; opt.textContent = p;
        selectElement.appendChild(opt);
      });
    }
  }
}

const priceHistory = {
  '7H': [14000,14100,13900,14200,14400,14350,14500],
  '1B': Array.from({length:30},(_,i)=>13500+Math.round(Math.sin(i/5)*400+i*20+Math.random()*200)),
  '3B': Array.from({length:13},(_,i)=>13000+Math.round(i*100+Math.random()*600)),
  '1T': Array.from({length:12},(_,i)=>12500+Math.round(i*180+Math.random()*500)),
};

const labels = {
  '7H': ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'],
  '1B': Array.from({length:30},(_,i)=>`H-${30-i}`),
  '3B': ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agt','Sep','Okt','Nov','Nov','Des'],
  '1T': ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agt','Sep','Okt','Nov','Des'],
};

const newsData = [
  { cat:'Kebijakan', icon:'🏛️', title:'Pemerintah Tetapkan HET Beras untuk Stabilkan Harga di Seluruh Wilayah', source:'Bapanas · 6 Mar 2025', featured:true, emoji:'🌾', body:'Badan Pangan Nasional (Bapanas) menetapkan Harga Eceran Tertinggi (HET) beras medium sebesar Rp 12.500 per kilogram dan beras premium Rp 15.400 per kilogram berlaku mulai awal Maret 2025. Kebijakan ini bertujuan melindungi konsumen dari lonjakan harga menjelang Ramadan dan Lebaran.' },
  { cat:'Harga', icon:'📈', title:'Harga Cabai Rawit Merah Melonjak 40% di Pasar Induk Kramat Jati', source:'Kontan · 5 Mar 2025', body:'Harga cabai rawit merah di Pasar Induk Kramat Jati, Jakarta, naik signifikan hingga Rp 68.000 per kilogram akibat curah hujan tinggi yang merusak panen di sentra produksi Jawa Timur dan Jawa Tengah.' },
  { cat:'Produksi', icon:'🌱', title:'Produksi Bawang Merah Bima Musim Ini Diprediksi Naik 15 Persen', source:'Kompas · 4 Mar 2025', body:'Dinas Pertanian Kabupaten Bima mencatat peningkatan luas tanam bawang merah sebesar 20% dibanding tahun lalu. Dengan kondisi cuaca yang mendukung, produksi diperkirakan meningkat 15% dan berdampak positif pada stabilitas harga.' },
  { cat:'Distribusi', icon:'🚚', title:'Tol Trans Jawa Pangkas Biaya Distribusi Pangan hingga 18 Persen', source:'Bisnis Indonesia · 3 Mar 2025', body:'Kementerian Perhubungan melaporkan efisiensi distribusi pangan dari Jawa Timur ke Jawa Barat meningkat signifikan setelah pengoperasian penuh ruas Tol Trans Jawa. Biaya logistik turun rata-rata 18% dan waktu tempuh berkurang 30%.' },
  { cat:'Teknologi', icon:'💡', title:'Petani Milenial Sulsel Gunakan AI untuk Prediksi Harga Jual Optimal', source:'Tempo · 2 Mar 2025', body:'Kelompok tani milenial di Sulawesi Selatan mulai memanfaatkan aplikasi berbasis kecerdasan buatan untuk memprediksi waktu jual optimal komoditas pangan. Hasilnya, pendapatan petani meningkat rata-rata 22% dalam satu musim tanam.' },
];

const tickerData = [
  { name:'Beras Premium', price:'Rp 14.500', change:'+1.2%', up:true },
  { name:'Jagung', price:'Rp 5.200', change:'-0.8%', up:false },
  { name:'Cabai Merah', price:'Rp 32.000', change:'+8.4%', up:true },
  { name:'Bawang Merah', price:'Rp 28.500', change:'-3.1%', up:false },
  { name:'Telur Ayam', price:'Rp 27.000', change:'+2.1%', up:true },
  { name:'Daging Sapi', price:'Rp 135.000', change:'+0.5%', up:true },
  { name:'Minyak Goreng', price:'Rp 17.500', change:'0.0%', up:null },
  { name:'Kedelai', price:'Rp 9.800', change:'+0.5%', up:true },
  { name:'Kentang', price:'Rp 12.000', change:'+0.3%', up:true },
  { name:'Tomat', price:'Rp 8.500', change:'-5.2%', up:false },
  { name:'Bawang Putih', price:'Rp 38.000', change:'+1.0%', up:true },
  { name:'Daging Ayam', price:'Rp 32.500', change:'-1.8%', up:false },
];

// ── INIT TICKER ──
function initTicker() {
  const t = document.getElementById('ticker');
  const items = [...tickerData, ...tickerData].map(d => `
    <div class="ticker-item">
      <span class="t-name">${d.name}</span>
      <span class="t-price">${d.price}</span>
      <span class="${d.up===true?'t-up':d.up===false?'t-down':''}">${d.up===true?'▲':d.up===false?'▼':'—'} ${d.change}</span>
    </div>
  `).join('');
  t.innerHTML = items;
}

// ── INIT COMMODITY LIST ──
let activeKategori = 'semua';
let activeCommodityId = 'beras';
let currentPeriod = '7H';
let chartInstance = null;
 
function fmt(n) { return 'Rp '+n.toLocaleString('id-ID'); }
 
function renderCommodities() {
  const list = document.getElementById('commodityList');
  const filtered = activeKategori === 'semua' ? commodities : commodities.filter(c=>c.kategori===activeKategori);
  list.innerHTML = filtered.map(c => `
    <div class="commodity-card ${c.id===activeCommodityId?'active':''}" onclick="selectCommodity('${c.id}')">
      <div class="c-icon">${c.icon}</div>
      <div class="c-info">
        <div class="c-name">${c.name}</div>
        <div class="c-unit">${c.unit}</div>
      </div>
      <div class="c-right">
        <div class="c-price">${fmt(c.price)}</div>
        <div class="c-change ${c.change>0?'up':c.change<0?'down':''}">${c.change>0?'▲'+c.change+'%':c.change<0?'▼'+Math.abs(c.change)+'%':'—'}</div>
        <a href="api/detail.php?id=${c.id}" onclick="event.stopPropagation()"
           style="display:inline-block;margin-top:5px;font-size:.7rem;font-weight:600;color:var(--green-mid);
                  background:var(--green-mist);padding:2px 9px;border-radius:20px;text-decoration:none;
                  transition:background .2s"
           onmouseover="this.style.background='var(--green-pale)'"
           onmouseout="this.style.background='var(--green-mist)'">
          Detail →
        </a>
      </div>
    </div>
  `).join('');
}

function filterKategori(k, btn) {
  activeKategori = k;
  document.querySelectorAll('#kategoriTabs .tab-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');

  // Cek apakah komoditas aktif saat ini ada dalam kategori yang dipilih
  const filtered = k === 'semua' ? commodities : commodities.filter(c => c.kategori === k);
  const isActiveInCategory = filtered.some(c => c.id === activeCommodityId);

  if (!isActiveInCategory && filtered.length > 0) {
    // Pilih otomatis komoditas pertama dari kategori baru
    activeCommodityId = filtered[0].id;
    const c = filtered[0];
    document.getElementById('chartCommodityName').textContent = c.icon + ' ' + c.name;
    document.getElementById('chartPriceNow').textContent = fmt(c.price) + '/' + c.unit.split(' ').pop();
    updateChart();
  }

  renderCommodities();
}

function selectCommodity(id) {
  activeCommodityId = id;
  const c = commodities.find(x=>x.id===id);
  document.getElementById('chartCommodityName').textContent = c.icon+' '+c.name;
  document.getElementById('chartPriceNow').textContent = fmt(c.price)+'/'+c.unit.split(' ').pop();
  renderCommodities();
  updateChart();
}

// ── CHART ──
function generateChartData(period, commodity) {
  const len = { '7H': 7, '1B': 30, '3B': 13, '1T': 12 }[period];

  // Jika beras dan ada data BPS, gunakan untuk semua period (sama seperti detail.php)
  if (commodity === 'beras' && berasBPSHistory.length > 0) {
    // Ambil data dari ujung array (terbaru), lalu pad jika kurang dari panjang period
    let data = berasBPSHistory.slice(-len);
    while (data.length > 0 && data.length < len) {
      data.unshift(data[0]);
    }
    return data;
  }

  // Untuk komoditas lain, gunakan perhitungan persentase deterministik
  const c = commodities.find(x => x.id === commodity);
  const base = c.price;

  return Array.from({length: len}, (_, i) => {
    return Math.round(base * (0.95 + (i / (len * 20))));
  });
}

function updateChart() {
  const data = generateChartData(currentPeriod, activeCommodityId);
  const lab = labels[currentPeriod];
  const max = Math.max(...data);
  const min = Math.min(...data);
  const avg = Math.round(data.reduce((a,b)=>a+b,0)/data.length);

  document.getElementById('statHigh').textContent = fmt(max);
  document.getElementById('statLow').textContent = fmt(min);
  document.getElementById('statAvg').textContent = fmt(avg);

  if (chartInstance) chartInstance.destroy();

  const ctx = document.getElementById('priceChart').getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 220);
  grad.addColorStop(0, 'rgba(82,183,136,.25)');
  grad.addColorStop(1, 'rgba(82,183,136,0)');

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: lab,
      datasets: [{
        data,
        borderColor: '#2d6a4f',
        backgroundColor: grad,
        borderWidth: 2.5,
        pointRadius: 3,
        pointBackgroundColor: '#2d6a4f',
        pointHoverRadius: 6,
        tension: .4,
        fill: true,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1a3a2a',
          titleColor: 'rgba(255,255,255,.6)',
          bodyColor: 'white',
          bodyFont: { weight: 'bold', size: 13 },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: ctx => ' ' + fmt(ctx.parsed.y)
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 11, family: 'Plus Jakarta Sans' }, color: '#8a8a8a', maxTicksLimit: 7 },
          border: { display: false },
        },
        y: {
          grid: { color: 'rgba(0,0,0,.05)' },
          ticks: {
            font: { size: 11, family: 'Plus Jakarta Sans' },
            color: '#8a8a8a',
            callback: v => 'Rp '+new Intl.NumberFormat('id-ID').format(v/1000)+'rb'
          },
          border: { display: false },
        }
      }
    }
  });
}

function changePeriod(p, btn) {
  currentPeriod = p;
  document.querySelectorAll('.period-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  updateChart();
}

// ── SEARCH ──
const regionPriceMultiplier = {
  'DKI Jakarta': 1.08, 'Jawa Barat': 1.03, 'Jawa Tengah': 0.98,
  'Jawa Timur': 0.97, 'Bali': 1.05, 'Kalimantan Timur': 1.12,
  'Papua': 1.25, 'default': 1.0
};

async function doSearch() {
  const commodity = document.getElementById('searchCommodity').value;
  const province = document.getElementById('searchProvince').value;

  if (!commodity) { alert('Pilih komoditas terlebih dahulu.'); return; }

  const mult = regionPriceMultiplier[province] || regionPriceMultiplier['default'];
  const base = commodities.find(c=>c.name===commodity)?.price || 15000;

  const regions = province ? [province] : ['Jawa Barat','Jawa Tengah','Jawa Timur','DKI Jakarta','Bali','Sumatera Utara'];
  const results = regions.map(r => {
    const m = regionPriceMultiplier[r] || 1;
    const p = Math.round(base * m);
    const ch = 0.5;
    return { region: r, price: p, change: ch };
  });

  // Tampilkan hasil di UI (Kode aslinya tidak berubah)
  document.getElementById('searchResultLabel').textContent = `Hasil untuk "${commodity}"${province?' di '+province:' (6 Provinsi Representatif)'} — Diperbarui hari ini`;
  document.getElementById('resultsGrid').innerHTML = results.map(r=>`
    <div class="result-card">
      <div class="result-commodity">${r.region}</div>
      <div class="result-price">${fmt(r.price)}</div>
      <div class="result-unit">${commodities.find(c=>c.name===commodity)?.unit||'per kg'}</div>
      <div class="result-change ${r.change>0?'up':r.change<0?'down':'flat'}">
        ${r.change>0?'▲':r.change<0?'▼':'—'} ${Math.abs(r.change)}%
      </div>
    </div>
  `).join('');

  const sr = document.getElementById('searchResults');
  sr.classList.add('visible');
  sr.scrollIntoView({ behavior:'smooth', block:'nearest' });

  // === KODE BARU: Simpan Riwayat ke Database ===
  const komoditasData = commodities.find(c => c.name === commodity);
  // Cek apakah user sudah login dan komoditas valid
  if (komoditasData && localStorage.getItem('isLoggedIn') === 'true') {
      try {
          await fetch('api/api_riwayat.php', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include', // Wajib agar cookie session PHP ikut terkirim
              body: JSON.stringify({ slug: komoditasData.id })
          });
      } catch (err) {
          console.error("Gagal menyimpan riwayat:", err);
      }
  }
}
function quickSearch(commodity) {
  document.getElementById('searchCommodity').value = commodity;
  doSearch();
  document.getElementById('cari').scrollIntoView({ behavior:'smooth' });
}

// ── BERITA ──
function renderBerita() {
  const featured = newsData.find(n=>n.featured);
  const rest = newsData.filter(n=>!n.featured);

  document.getElementById('beritaGrid').innerHTML = `
    <div class="news-featured" onclick="openModal(${newsData.indexOf(featured)})">
      <div class="news-featured-bg"></div>
      <div class="news-featured-emoji">${featured.emoji}</div>
      <div class="news-featured-content">
        <span class="news-category">${featured.cat}</span>
        <div class="news-featured-title">${featured.title}</div>
        <div class="news-meta">
          <span>${featured.source}</span>
        </div>
      </div>
    </div>
    <div class="news-list">
      ${rest.map((n,i)=>`
        <div class="news-card" onclick="openModal(${newsData.indexOf(n)})">
          <div class="news-card-icon">${n.icon}</div>
          <div>
            <div class="news-card-title">${n.title}</div>
            <div class="news-card-meta">${n.source} · <span class="news-category" style="font-size:.7rem;padding:2px 7px">${n.cat}</span></div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function openModal(idx) {
  const n = newsData[idx];
  document.getElementById('modalCategory').textContent = n.cat;
  document.getElementById('modalTitle').textContent = n.title;
  document.getElementById('modalSource').textContent = n.source;
  document.getElementById('modalBody').textContent = n.body;
  document.getElementById('newsModal').classList.add('open');
}

function closeModal(e) {
  if (e.target.id==='newsModal') document.getElementById('newsModal').classList.remove('open');
}

// ── SCROLL EFFECTS ──
window.addEventListener('scroll', ()=>{
  const nav = document.getElementById('navbar');
  nav.classList.toggle('scrolled', window.scrollY > 10);

  // Active nav link
  const sections = ['beranda','cari','harga','berita'];
  const links = document.querySelectorAll('.nav-links a');
  sections.forEach((id,i)=>{
    const el = document.getElementById(id);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.top <= 100 && rect.bottom > 100) {
      links.forEach(l=>l.classList.remove('active'));
      links[i].classList.add('active');
    }
  });

  // Fade-in on scroll
  document.querySelectorAll('.fade-in:not(.visible)').forEach(el=>{
    if (el.getBoundingClientRect().top < window.innerHeight - 60) {
      el.classList.add('visible');
    }
  });
});

// ── START ──
async function initApp() {
  // 1. Render elemen yang tidak bergantung pada harga (agar UI tidak kosong)
  renderBerita();

  // 2. Ambil data provinsi (tidak bergantung pada komoditas, bisa paralel)
  fetchProvinsiBPS();

  // 3. Ambil data komoditas dari DB terlebih dahulu
  await fetchKomoditasDB();

  // 4. Baru ambil data BPS — pastikan array commodities sudah terisi
  //    agar update harga & change beras berhasil
  await fetchDataBerasBPS();

  // 5. Render semua elemen dengan data yang sudah lengkap
  initTicker();
  renderCommodities();
  selectCommodity('beras'); // Grafik beras langsung pakai data BPS
}

// Eksekusi fungsi inisialisasi saat script dimuat
initApp();

// Trigger fade-in for elements already in view
setTimeout(()=>{
  document.querySelectorAll('.fade-in').forEach(el=>{
    if (el.getBoundingClientRect().top < window.innerHeight - 60)
      el.classList.add('visible');
  });
}, 100);

// ── SCROLL EFFECTS ──

// ── LOGIN & AUTH ──
let currentUser = null;

function openLoginModal() {
  document.getElementById('loginModal').classList.add('open');
  document.getElementById('loginError').classList.remove('show');
}
function closeLoginModal() { document.getElementById('loginModal').classList.remove('open'); }
function closeLoginModalOverlay(e) { if (e.target.id === 'loginModal') closeLoginModal(); }
function switchTab(tab) {
  document.getElementById('formMasuk').style.display = tab === 'masuk' ? 'block' : 'none';
  document.getElementById('formDaftar').style.display = tab === 'daftar' ? 'block' : 'none';
  document.getElementById('tabMasuk').classList.toggle('active', tab === 'masuk');
  document.getElementById('tabDaftar').classList.toggle('active', tab === 'daftar');
  document.getElementById('loginError').classList.remove('show');
}
function showLoginError(msg) {
  const el = document.getElementById('loginError');
  el.textContent = msg; el.classList.add('show');
}
function toTitleCase(str) {
  return str.replace(/\w\S*/g, t => t.charAt(0).toUpperCase() + t.substr(1).toLowerCase());
}



function loginSuccess(user) {
  currentUser = user;
  closeLoginModal();
  const initials = user.name.split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase();
  document.getElementById('navLoginBtn').style.display = 'none';
  const wrap = document.getElementById('navAvatarWrap');
  wrap.style.display = 'flex'; wrap.style.alignItems = 'center';
  document.getElementById('navAvatar').textContent = initials;
  document.getElementById('dropdownName').textContent = user.name;
  document.getElementById('dropdownEmail').textContent = user.email;
  document.getElementById('mobileLoginSection').style.display = 'none';
  document.getElementById('mobileUserSection').style.display = 'block';
  document.getElementById('mobileAvatar').textContent = initials;
  document.getElementById('mobileName').textContent = user.name;
  document.getElementById('mobileEmail').textContent = user.email;
}
async function doLogout() {
  try {
   
    const response = await fetch('api/logout.php');
    const result = await response.json();

    if (result.success) {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('username');
      localStorage.removeItem('role');
      
      
      window.location.href = 'api/login.php';
    }
  } catch (error) {
    console.error("Gagal logout:", error);
    localStorage.clear();
    window.location.href = 'api/login.php';
  }
}
function toggleAvatarDropdown() { document.getElementById('avatarDropdown').classList.toggle('open'); }
document.addEventListener('click', (e) => {
  const wrap = document.getElementById('navAvatarWrap');
  if (wrap && !wrap.contains(e.target)) document.getElementById('avatarDropdown').classList.remove('open');
});
// ── HAMBURGER ──
function toggleMobileNav() {
  document.getElementById('mobileNav').classList.toggle('open');
  document.getElementById('hamburgerBtn').classList.toggle('open');
}
function closeMobileNav() {
  document.getElementById('mobileNav').classList.remove('open');
  document.getElementById('hamburgerBtn').classList.remove('open');
}
document.addEventListener('click', (e) => {
  const nav = document.getElementById('mobileNav');
  const btn = document.getElementById('hamburgerBtn');
  if (nav && nav.classList.contains('open') && !nav.contains(e.target) && !btn.contains(e.target)) closeMobileNav();
});

function checkLoginStatus() {
  const isLoggedIn = localStorage.getItem('isLoggedIn');
  const username = localStorage.getItem('username');
  const role = localStorage.getItem('role');

  if (isLoggedIn === 'true') {
    // 1. Sembunyikan tombol login (Desktop & Mobile)
    const btnLogin = document.querySelector('.btn-login');
    if (btnLogin) btnLogin.style.display = 'none';
    
    const mobileLoginSec = document.getElementById('mobileLoginSection');
    if (mobileLoginSec) mobileLoginSec.style.display = 'none';

    // 2. Buat inisial nama pengguna
    const initials = username.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();

    // 3. Tampilkan Avatar Profil (Desktop)
    const navAvatarWrap = document.getElementById('navAvatarWrap');
    if (navAvatarWrap) {
      navAvatarWrap.style.display = 'flex';
      navAvatarWrap.style.alignItems = 'center';
      
      document.getElementById('navAvatar').textContent = initials;
      document.getElementById('dropdownName').textContent = username;
      document.getElementById('dropdownEmail').textContent = `Peran: ${role}`; 
    }

    // 4. Tampilkan Avatar Profil (Mobile)
    const mobileUserSec = document.getElementById('mobileUserSection');
    if (mobileUserSec) {
      mobileUserSec.style.display = 'block';
      document.getElementById('mobileAvatar').textContent = initials;
      document.getElementById('mobileName').textContent = username;
      document.getElementById('mobileEmail').textContent = `Peran: ${role}`;
    }
  }
}

// Jalankan fungsi ini secara otomatis saat home.html selesai dimuat
document.addEventListener('DOMContentLoaded', checkLoginStatus);
