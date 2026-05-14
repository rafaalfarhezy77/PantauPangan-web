let dbHistory = [];

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

      const searchCommodity = document.getElementById('searchCommodity');
      if (searchCommodity) {
         searchCommodity.innerHTML = '<option value="">Pilih komoditas...</option>';
         commodities.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.name;
            opt.textContent = c.name;
            searchCommodity.appendChild(opt);
         });
      }

      // Populate dropdown prediksi komoditas di halaman utama
      const prediksiKomEl = document.getElementById('prediksiKomoditas');
      if (prediksiKomEl) {
        prediksiKomEl.innerHTML = '';
        commodities.forEach(c => {
          const opt = document.createElement('option');
          opt.value = c.id;
          opt.textContent = c.icon + ' ' + c.name;
          prediksiKomEl.appendChild(opt);
        });
        updatePrediksiKabKota(); // Panggil agar init kab/kota
      }

      // Populate dropdown prediksi inflasi komoditas
      const inflasiKomoEl = document.getElementById('inflasiKomoditas');
      if (inflasiKomoEl) {
        inflasiKomoEl.innerHTML = '';
        commodities.forEach(c => {
          const opt = document.createElement('option');
          opt.value = c.id;
          opt.textContent = c.icon + ' ' + c.name;
          inflasiKomoEl.appendChild(opt);
        });
        updateInflasiKabKota();
      }
    }
  } catch (error) {
    console.error("Gagal memuat komoditas dari Database:", error);
  }
}

async function fetchHistoryDB(slug) {
  try {
    const response = await fetch(`api/api_history.php?slug=${slug}`);
    const result = await response.json();
    if (result.status === 'success') {
      const history = result.data.map(item => item.harga);
      if (history.length > 0) {
        dbHistory = history;
        const latestPrice = history[history.length - 1];
        
        // Update price dan change di object commodity
        const index = commodities.findIndex(c => c.id === slug);
        if (index !== -1) {
          commodities[index].price = latestPrice;
          if (history.length > 1) {
            const prevPrice = history[history.length - 2];
            const change = ((latestPrice - prevPrice) / prevPrice) * 100;
            commodities[index].change = parseFloat(change.toFixed(1));
          }
        }
      } else {
        dbHistory = [];
      }
    }
  } catch (error) {
    console.error("Gagal fetch history DB:", error);
    dbHistory = [];
  }
}

async function fetchProvinsiDB() {
  try {
    const response = await fetch('api/api_list_provinsi.php');
    if (!response.ok) throw new Error('Gagal memanggil API list provinsi');
    
    const result = await response.json();
    
    if (result.status === "success") {
      const provinces = result.data;
      const selectElement = document.getElementById('searchProvince');
      
      selectElement.innerHTML = '<option value="">Semua Provinsi</option>';
      
      provinces.forEach(prov => {
        const option = document.createElement('option');
        option.value = prov; 
        option.textContent = prov;
        selectElement.appendChild(option);
      });
      console.log("Daftar Provinsi berhasil dimuat dari Database.");
    } else {
      throw new Error(result.message || 'Error format respons API');
    }
  } catch (error) {
    console.error("Gagal memuat provinsi:", error);
    const selectElement = document.getElementById('searchProvince');
    if (selectElement) {
      selectElement.innerHTML = '<option value="">Semua Provinsi</option>';
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
  { name:'Gula Pasir', price:'Rp 17.500', change:'+0.5%', up:true },
  { name:'Cabai Merah', price:'Rp 32.000', change:'+8.4%', up:true },
  { name:'Bawang Merah', price:'Rp 28.500', change:'-3.1%', up:false },
  { name:'Telur Ayam', price:'Rp 27.000', change:'+2.1%', up:true },
  { name:'Daging Sapi', price:'Rp 135.000', change:'+0.5%', up:true },
  { name:'Minyak Goreng', price:'Rp 17.500', change:'0.0%', up:null },
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

async function selectCommodity(id) {
  const loading = document.getElementById('chartLoading');
  if (loading) loading.style.display = 'flex';
  
  activeCommodityId = id;
  const c = commodities.find(x=>x.id===id);
  if (!c) {
    if (loading) loading.style.display = 'none';
    return;
  }
  document.getElementById('chartCommodityName').textContent = c.icon+' '+c.name;
  
  await fetchHistoryDB(id);
  document.getElementById('chartPriceNow').textContent = fmt(c.price)+'/'+c.unit.split(' ').pop();
  
  renderCommodities();
  updateChart();
  
  if (loading) {
    setTimeout(() => { loading.style.display = 'none'; }, 300);
  }
}

function changePeriod(p, btn) {
  const loading = document.getElementById('chartLoading');
  currentPeriod = p;
  document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  
  if (loading) loading.style.display = 'flex';
  
  // Berikan sedikit jeda agar animasi loading terlihat
  setTimeout(() => {
    updateChart();
    if (loading) loading.style.display = 'none';
  }, 400);
}

// ── CHART ──
function generateChartData(period, commodity) {
  const len = { '7H': 7, '1B': 30, '3B': 13, '1T': 12 }[period];

  if (dbHistory && dbHistory.length > 0) {
    let data = dbHistory.slice(-len);
    while (data.length > 0 && data.length < len) {
      data.unshift(data[0]);
    }
    return data;
  }

  const c = commodities.find(x => x.id === commodity);
  const base = c ? c.price : 15000;

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
async function updateSearchKabKota() {
  const provEl = document.getElementById('searchProvince');
  const kabEl  = document.getElementById('searchKabKota');
  const fieldEl = document.getElementById('searchKabKotaField');
  const slugName = document.getElementById('searchCommodity').value;
  if (!provEl || !kabEl || !fieldEl) return;

  const provinsi = provEl.value;
  const komoditasData = slugName ? commodities.find(c => c.name === slugName) : null;
  
  if (!provinsi || provinsi === '' || provinsi === 'Semua Provinsi' || !komoditasData) {
    kabEl.disabled = true;
    kabEl.innerHTML = '<option value="">Pilih Komoditas & Provinsi</option>';
    return;
  }

  kabEl.disabled = false;
  kabEl.innerHTML = '<option value="">Memuat...</option>';

  try {
    const res = await fetch(`api/kab_kota_by_provinsi.php?provinsi=${encodeURIComponent(provinsi)}&slug=${encodeURIComponent(komoditasData.id)}`);
    const json = await res.json();
    if (json.error) throw new Error(json.error);

    kabEl.innerHTML = '<option value="">Semua Kab/Kota</option>';
    if (json.kab_kota && json.kab_kota.length > 0) {
      json.kab_kota.forEach(k => {
        const opt = document.createElement('option');
        opt.value = k.nama;
        opt.textContent = k.nama;
        kabEl.appendChild(opt);
      });
    } else {
      kabEl.innerHTML = '<option value="">Tidak ada data</option>';
    }
  } catch (err) {
    console.error("Gagal load kab/kota search:", err);
    kabEl.innerHTML = '<option value="">Gagal memuat</option>';
  }
}

async function doSearch() {
  const btn = document.getElementById('searchBtn');
  const commodity = document.getElementById('searchCommodity').value;
  const province = document.getElementById('searchProvince').value;
  const kabKota = document.getElementById('searchKabKota')?.value;

  if (!commodity) { alert('Pilih komoditas terlebih dahulu.'); return; }

  const komoditasData = commodities.find(c => c.name === commodity);
  if (!komoditasData) return;

  // Loading state
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="btn-spinner"></span> Mencari...';
  }

  try {
    const response = await fetch(`api/api_harga_provinsi.php?slug=${komoditasData.id}`);
    const result = await response.json();

    if (result.status === 'success') {
      let filteredData = result.data;
      
      if (kabKota && kabKota !== '') {
        // Jika pilih Kab/Kota spesifik
        filteredData = filteredData.filter(r => r.wilayah === kabKota);
        document.getElementById('searchResultLabel').textContent = `Hasil untuk "${commodity}" di ${kabKota} — Diperbarui hari ini`;
      } else if (province && province !== '') {
        // Jika pilih Provinsi (tapi tidak pilih Kab/Kota)
        filteredData = filteredData.filter(r => r.wilayah === province && r.tipe_wilayah === 'provinsi');
        document.getElementById('searchResultLabel').textContent = `Hasil untuk "${commodity}" di ${province} — Diperbarui hari ini`;
      } else {
        // Jika tidak pilih provinsi, ambil 6 teratas yang bertipe provinsi
        filteredData = filteredData.filter(r => r.tipe_wilayah === 'provinsi');
        filteredData = filteredData.slice(0, 6);
        document.getElementById('searchResultLabel').textContent = `Hasil untuk "${commodity}" (6 Provinsi Teratas) — Diperbarui hari ini`;
      }

      if (filteredData.length === 0) {
        document.getElementById('searchResultLabel').textContent = `Tidak ada data untuk "${commodity}"`;
        document.getElementById('resultsGrid').innerHTML = '';
      } else {
        document.getElementById('resultsGrid').innerHTML = filteredData.map(r => `
          <div class="result-card">
            <div class="result-commodity">${r.wilayah}</div>
            <div class="result-price">${fmt(r.harga)}</div>
            <div class="result-unit">${komoditasData.unit || 'per kg'}</div>
            <div class="result-change ${r.perubahan > 0 ? 'up' : r.perubahan < 0 ? 'down' : 'flat'}">
              ${r.perubahan > 0 ? '▲' : r.perubahan < 0 ? '▼' : '—'} ${Math.abs(r.perubahan)}%
            </div>
          </div>
        `).join('');
      }

      const sr = document.getElementById('searchResults');
      sr.classList.add('visible');
      sr.scrollIntoView({ behavior:'smooth', block:'nearest' });
    }

    // Simpan Riwayat ke Database (hanya jika sukses)
    if (localStorage.getItem('isLoggedIn') === 'true') {
        try {
            await fetch('api/api_riwayat.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', 
                body: JSON.stringify({ slug: komoditasData.id })
            });
        } catch (err) {
            console.error("Gagal menyimpan riwayat:", err);
        }
    }

  } catch (e) {
    console.error("Gagal mencari harga:", e);
    alert("Terjadi kesalahan saat mencari harga. Silakan coba lagi.");
  } finally {
    // Reset button state
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = 'Cari Harga';
    }
  }
}
function quickSearch(keyword) {
  const matched = commodities.find(c => c.name.toLowerCase().includes(keyword.toLowerCase()));
  if (matched) {
    document.getElementById('searchCommodity').value = matched.name;
    doSearch();
    document.getElementById('cari').scrollIntoView({ behavior:'smooth' });
  } else {
    alert("Data komoditas belum tersedia.");
  }
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
  const sections = ['beranda','cari','peta','harga','inflasi','berita'];
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
  fetchProvinsiDB();

  // 3. Ambil data komoditas dari DB terlebih dahulu
  await fetchKomoditasDB();

  // 4. Render semua elemen dengan data yang sudah lengkap
  initTicker();
  await selectCommodity('beras'); // Render grafik beras menggunakan DB history

  // 5. Prediksi tidak dimuat otomatis — user menekan tombol Cek Prediksi
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

// ── PREDIKSI HARGA (HALAMAN UTAMA) ──
const periodeLabelHome = { '7':'7 Hari', '30':'1 Bulan', '90':'3 Bulan', '120':'4 Bulan' };
let homePrediksiChartInst = null;

function onHomePrediksiChange() {
  renderHomePrediksiChart();
}

async function updatePrediksiKabKota() {
  const provEl = document.getElementById('prediksiWilayah');
  const kabEl  = document.getElementById('prediksiKabKota');
  const slugEl = document.getElementById('prediksiKomoditas');
  if (!provEl || !kabEl || !slugEl) return;

  const provinsi = provEl.value;
  const slug = slugEl.value;

  if (!provinsi || provinsi === 'Semua Provinsi' || !slug) {
    kabEl.disabled = true;
    kabEl.innerHTML = '<option value="">Pilih Komoditas & Provinsi</option>';
    return;
  }

  kabEl.disabled = false;
  kabEl.innerHTML = '<option value="">Memuat...</option>';

  try {
    const res = await fetch(`api/kab_kota_by_provinsi.php?provinsi=${encodeURIComponent(provinsi)}&slug=${encodeURIComponent(slug)}`);
    const json = await res.json();
    if (json.error) throw new Error(json.error);

    kabEl.innerHTML = '<option value="">Semua Kab/Kota</option>';
    if (json.kab_kota && json.kab_kota.length > 0) {
      json.kab_kota.forEach(k => {
        const opt = document.createElement('option');
        opt.value = k.nama;
        opt.textContent = k.nama;
        kabEl.appendChild(opt);
      });
    } else {
      kabEl.innerHTML = '<option value="">Tidak ada data</option>';
    }
  } catch (err) {
    console.error("Gagal load kab/kota:", err);
    kabEl.innerHTML = '<option value="">Gagal memuat</option>';
  }
}

async function renderHomePrediksiChart() {
  const slugEl    = document.getElementById('prediksiKomoditas');
  const wilayahEl = document.getElementById('prediksiWilayah');
  const kabEl     = document.getElementById('prediksiKabKota');
  const periodeEl = document.getElementById('prediksiPeriode');
  const btn       = document.getElementById('prediksiCekBtn');
  if (!slugEl || !wilayahEl || !periodeEl) return;

  const slug    = slugEl.value;
  let wilayah   = wilayahEl.value;
  const hari    = parseInt(periodeEl.value);
  
  if (kabEl && kabEl.value && !kabEl.disabled) {
    wilayah = kabEl.value; // Override dengan kab/kota jika dipilih
  }
  
  if (!slug) return;

  const loadingEl     = document.getElementById('prediksiLoadingHome');
  const placeholderEl = document.getElementById('prediksiPlaceholderHome');
  const canvasEl      = document.getElementById('homePrediksiChart');
  const subtitleEl    = document.getElementById('prediksiSubtitleHome');
  const labelPeriode  = periodeLabelHome[String(hari)] || (hari + ' Hari');
  const komoditasNama = slugEl.options[slugEl.selectedIndex]?.textContent || slug;

  // Tampilkan loading, sembunyikan placeholder dan chart
  if (placeholderEl) placeholderEl.style.display = 'none';
  if (canvasEl)      canvasEl.style.display      = 'none';
  if (loadingEl)     loadingEl.style.display      = 'flex';

  // Nonaktifkan tombol sementara
  if (btn) { 
    btn.disabled = true; 
    btn.innerHTML = '<span class="btn-spinner"></span> Menghitung...'; 
  }

  if (subtitleEl) subtitleEl.textContent = `Prediksi Tren Harga ${komoditasNama} ${labelPeriode} ke Depan (Memuat...)`;

  try {
    const res  = await fetch(`api/predict_prophet.php?slug=${encodeURIComponent(slug)}&wilayah=${encodeURIComponent(wilayah)}&hari=${hari}`);
    const data = await res.json();

    if (loadingEl) loadingEl.style.display = 'none';

    if (data.error) {
      // Tampilkan placeholder kembali jika error
      if (placeholderEl) {
        placeholderEl.innerHTML = `<span class="prediksi-placeholder-icon">⚠️</span><p>${data.error}</p>`;
        placeholderEl.style.display = 'flex';
      }
      if (btn) { btn.disabled = false; btn.innerHTML = '🔍 Cek Prediksi'; }
      return;
    }

    // Tampilkan canvas
    if (canvasEl) canvasEl.style.display = 'block';

    const labelHistoris  = data.historis.map(d => d.tanggal);
    const hargaHistoris  = data.historis.map(d => d.harga);
    const labelPrediksi  = data.prediksi.map(d => d.tanggal);
    const hargaPrediksi  = data.prediksi.map(d => d.harga);
    const semuaLabel     = labelHistoris.concat(labelPrediksi);
    const arrPrediksi    = Array(labelHistoris.length).fill(null);
    arrPrediksi[labelHistoris.length - 1] = hargaHistoris[hargaHistoris.length - 1];
    const dataPrediksiFinal = arrPrediksi.concat(hargaPrediksi);

    if (subtitleEl) {
        if (data.algoritma && data.algoritma.includes('prophet')) {
             subtitleEl.textContent = `Prediksi Tren Harga ${komoditasNama} ${labelPeriode} ke Depan (Prophet AI)`;
        } else {
             subtitleEl.textContent = `Prediksi Tren Harga ${komoditasNama} ${labelPeriode} ke Depan (Regresi Linear)`;
        }
    }

    if (homePrediksiChartInst) homePrediksiChartInst.destroy();
    const ctx = canvasEl.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 280);
    grad.addColorStop(0, 'rgba(45,106,79,.18)');
    grad.addColorStop(1, 'rgba(45,106,79,0)');

    const datasets = [
      {
        label: 'Harga Historis',
        data: hargaHistoris,
        borderColor: '#2d6a4f',
        backgroundColor: grad,
        borderWidth: 2.5,
        pointRadius: 1,
        fill: true,
        tension: 0.3
      },
      {
        label: `Prediksi ${labelPeriode}`,
        data: dataPrediksiFinal,
        borderColor: '#e53935',
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 2,
        pointBackgroundColor: '#e53935',
        fill: false,
        tension: 0
      }
    ];

    if (data.algoritma && data.algoritma.includes('prophet') && data.prediksi[0].harga_min) {
        const arrMin = Array(labelHistoris.length).fill(null);
        arrMin[labelHistoris.length - 1] = hargaHistoris[hargaHistoris.length - 1];
        const hargaMinFinal = arrMin.concat(data.prediksi.map(d => d.harga_min));

        const arrMax = Array(labelHistoris.length).fill(null);
        arrMax[labelHistoris.length - 1] = hargaHistoris[hargaHistoris.length - 1];
        const hargaMaxFinal = arrMax.concat(data.prediksi.map(d => d.harga_max));

        datasets.push({
            label: 'Margin Atas',
            data: hargaMaxFinal,
            borderColor: 'rgba(229,57,53,0.2)',
            backgroundColor: 'rgba(229,57,53,0.05)',
            fill: 1,
            borderDash: [2, 4],
            pointRadius: 0,
            tension: 0
        });

        datasets.push({
            label: 'Margin Bawah',
            data: hargaMinFinal,
            borderColor: 'rgba(229,57,53,0.2)',
            backgroundColor: 'rgba(229,57,53,0.05)',
            fill: 1,
            borderDash: [2, 4],
            pointRadius: 0,
            tension: 0
        });
    }

    homePrediksiChartInst = new Chart(ctx, {
      type: 'line',
      data: {
        labels: semuaLabel,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: { boxWidth: 12, usePointStyle: true, font: { family: 'Plus Jakarta Sans', size: 11 } }
          },
          tooltip: {
            backgroundColor: '#1a3a2a',
            titleColor: 'rgba(255,255,255,.6)',
            bodyColor: 'white',
            bodyFont: { weight: 'bold', size: 13 },
            padding: 12,
            cornerRadius: 8,
            callbacks: { label: c => c.parsed.y !== null ? ' Rp ' + c.parsed.y.toLocaleString('id-ID') : '' }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { font: { size: 11, family: 'Plus Jakarta Sans' }, color: '#8a8a8a', maxTicksLimit: 12 }
          },
          y: {
            grid: { color: 'rgba(0,0,0,.05)' },
            border: { display: false },
            ticks: { font: { size: 11, family: 'Plus Jakarta Sans' }, color: '#8a8a8a', callback: v => 'Rp ' + new Intl.NumberFormat('id-ID').format(v / 1000) + 'rb' }
          }
        }
      }
    });
  } catch (e) {
    if (loadingEl) loadingEl.style.display = 'none';
    if (placeholderEl) {
      placeholderEl.innerHTML = `<span class="prediksi-placeholder-icon">⚠️</span><p>Gagal memuat data prediksi.</p>`;
      placeholderEl.style.display = 'flex';
    }
    console.error('Gagal render prediksi home:', e);
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '🔍 Cek Prediksi'; }
  }
}

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

// ============================================================
// ── PREDIKSI INFLASI ──
// ============================================================
let inflasiPeriod = 30;
let inflasiFaktor = { raya: true, cuaca: false, bbm: false };
let inflasiChartInst = null;

function setInflasiPeriod(val, btn) {
  inflasiPeriod = val;
  document.querySelectorAll('.inflasi-period-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function toggleInflasiFaktor(key) {
  inflasiFaktor[key] = !inflasiFaktor[key];
  const item  = document.getElementById('inflasiFactor' + key.charAt(0).toUpperCase() + key.slice(1));
  const check = document.getElementById('inflasiCheck'  + key.charAt(0).toUpperCase() + key.slice(1));
  const activeClass = { raya: 'active-raya', cuaca: 'active-cuaca', bbm: 'active-bbm' }[key];

  if (!item || !check) return;

  if (inflasiFaktor[key]) {
    item.classList.add(activeClass);
    check.classList.add('checked');
    check.textContent = '✓';
  } else {
    item.classList.remove(activeClass);
    check.classList.remove('checked');
    check.textContent = '';
  }
}

function inflasiShowState(state) {
  // state: 'placeholder' | 'loading' | 'result'
  document.getElementById('inflasiPlaceholder').style.display   = state === 'placeholder' ? 'flex'  : 'none';
  document.getElementById('inflasiLoading').style.display        = state === 'loading'     ? 'flex'  : 'none';
  document.getElementById('inflasiMetricsCard').style.display    = state === 'result'      ? 'block' : 'none';
  document.getElementById('inflasiChartCard').style.display      = state === 'result'      ? 'block' : 'none';
  document.getElementById('inflasiKontribusiCard').style.display = state === 'result'      ? 'block' : 'none';
}

async function runInflasiPrediksi() {
  const slug    = document.getElementById('inflasiKomoditas').value;
  let wilayah   = document.getElementById('inflasiProvinsi').value;
  const kabEl   = document.getElementById('inflasiKabKota');
  const btn     = document.getElementById('inflasiRunBtn');

  if (kabEl && kabEl.value && !kabEl.disabled) {
    wilayah = kabEl.value; // Override dengan kab/kota jika dipilih
  }

  if (!slug) { alert('Pilih komoditas terlebih dahulu.'); return; }

  inflasiShowState('loading');
  btn.disabled = true;
  btn.textContent = '⏳ Menghitung...';

  const params = new URLSearchParams({
    slug, wilayah,
    hari: inflasiPeriod,
    faktor_raya:  inflasiFaktor.raya,
    faktor_cuaca: inflasiFaktor.cuaca,
    faktor_bbm:   inflasiFaktor.bbm,
  });

  try {
    // Panggil lewat PHP proxy (agar Railway URL tidak exposed, konsisten dengan endpoint /predict)
    const res  = await fetch(`api/predict_inflasi.php?${params}`);
    const data = await res.json();

    if (data.error) {
      inflasiShowState('placeholder');
      document.getElementById('inflasiPlaceholder').innerHTML =
        `<div class="inflasi-placeholder-icon">⚠️</div><p>${data.error}<br><small>${data.detail||''}</small></p>`;
      return;
    }

    renderInflasiResult(data);
    inflasiShowState('result');

  } catch (e) {
    console.error('Inflasi fetch error:', e);
    inflasiShowState('placeholder');
    document.getElementById('inflasiPlaceholder').innerHTML =
      `<div class="inflasi-placeholder-icon">⚠️</div><p>Gagal menghubungi server prediksi.</p>`;
  } finally {
    btn.disabled = false;
    btn.textContent = '📉 Jalankan Prediksi Inflasi';
  }
}

function renderInflasiResult(data) {
  const komoEl = document.getElementById('inflasiKomoditas');
  const komoNama = komoEl.options[komoEl.selectedIndex]?.textContent || data.slug;
  const periodeLabel = { 7: '7 hari', 30: '1 bulan', 120: '4 bulan' }[data.hari_prediksi] || data.hari_prediksi + ' hari';

  // --- Meta ---
  document.getElementById('inflasiResultMeta').innerHTML =
    `Komoditas: <span>${komoNama}</span> &nbsp;|&nbsp; Wilayah: <span>${data.wilayah}</span> &nbsp;|&nbsp; Periode: <span>${periodeLabel} ke depan</span>`;

  // --- Metrics ---
  const pct = data.total_inflasi_pct;
  const valEl = document.getElementById('inflasiMetricInflasi');
  valEl.textContent = (pct >= 0 ? '+' : '') + pct.toFixed(1).replace('.', ',') + '%';
  valEl.className = 'inflasi-metric-val ' + (pct >= 20 ? 'danger' : pct >= 10 ? 'warn' : 'ok');

  document.getElementById('inflasiMetricInflasiSub').textContent = 'dalam ' + periodeLabel;
  document.getElementById('inflasiMetricHarga').textContent = 'Rp ' + data.harga_akhir_prediksi.toLocaleString('id-ID');
  document.getElementById('inflasiMetricHargaSub').textContent = 'dari Rp ' + data.harga_awal.toLocaleString('id-ID') + ' saat ini';
  document.getElementById('inflasiMetricConf').textContent = data.confidence + '%';

  // --- Status Banner ---
  const banner    = document.getElementById('inflasiStatusBanner');
  const iconEl    = document.getElementById('inflasiStatusIcon');
  const titleEl   = document.getElementById('inflasiStatusTitle');
  const textEl    = document.getElementById('inflasiStatusText');
  banner.style.display = 'flex';

  const faktors = [];
  if (data.faktor_aktif?.hari_raya) faktors.push('hari raya');
  if (data.faktor_aktif?.cuaca)    faktors.push('cuaca ekstrem');
  if (data.faktor_aktif?.bbm)      faktors.push('kenaikan BBM');
  const faktStr = faktors.length ? faktors.join(', ') : 'pola musiman';

  if (pct >= 20) {
    banner.className = 'inflasi-banner danger';
    iconEl.textContent = '🚨';
    titleEl.textContent = 'Bahaya — Inflasi Sangat Tinggi';
    textEl.textContent = `${komoNama} di ${data.wilayah} diprediksi naik ${pct.toFixed(1).replace('.', ',')}% dalam ${periodeLabel}, dipengaruhi ${faktStr}. Segera lakukan operasi pasar dan koordinasi stok antar wilayah.`;
  } else if (pct >= 10) {
    banner.className = 'inflasi-banner warn';
    iconEl.textContent = '⚠️';
    titleEl.textContent = 'Waspada — Inflasi Cukup Signifikan';
    textEl.textContent = `${komoNama} di ${data.wilayah} diprediksi naik ${pct.toFixed(1).replace('.', ',')}% dalam ${periodeLabel}, dipengaruhi ${faktStr}. Pemantauan distribusi dan stok pasar perlu diintensifkan.`;
  } else if (pct > 0) {
    banner.className = 'inflasi-banner warn';
    iconEl.textContent = '📊';
    titleEl.textContent = 'Normal — Inflasi dalam Batas Wajar';
    textEl.textContent = `${komoNama} di ${data.wilayah} diprediksi naik ${pct.toFixed(1).replace('.', ',')}% dalam ${periodeLabel}. Tidak ada tindakan mendesak, cukup pantau rutin.`;
  } else {
    banner.className = 'inflasi-banner ok';
    iconEl.textContent = '✅';
    titleEl.textContent = 'Aman — Harga Diprediksi Stabil atau Turun';
    textEl.textContent = `${komoNama} di ${data.wilayah} diprediksi tidak mengalami kenaikan signifikan dalam ${periodeLabel}.`;
  }

  // --- Chart (gunakan Chart.js yang sama seperti prediksi harga) ---
  renderInflasiChart(data, komoNama, periodeLabel);

  // --- Kontribusi Faktor ---
  renderInflasiKontribusi(data);
}

function renderInflasiChart(data, komoNama, periodeLabel) {
  document.getElementById('inflasiChartSub').textContent =
    `Historis 4 minggu terakhir + proyeksi ${periodeLabel}`;

  if (inflasiChartInst) inflasiChartInst.destroy();
  const ctx = document.getElementById('inflasiChart').getContext('2d');

  // Buat data dari historis_agregat + prediksi bar
  const labels   = data.historis_agregat.map(h => h.label).concat(['Prediksi']);
  const actuals  = data.historis_agregat.map(h => h.pct);
  const predArr  = Array(data.historis_agregat.length).fill(null).concat([data.total_inflasi_pct]);
  const isRed    = data.total_inflasi_pct >= 10;

  const gradGreen = ctx.createLinearGradient(0, 0, 0, 220);
  gradGreen.addColorStop(0, 'rgba(82,183,136,.25)');
  gradGreen.addColorStop(1, 'rgba(82,183,136,0)');

  inflasiChartInst = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Historis (%)',
          data: actuals.concat([null]),
          backgroundColor: 'rgba(82,183,136,0.7)',
          borderColor: '#52b788',
          borderWidth: 1.5,
          borderRadius: 5,
          order: 1
        },
        {
          label: 'Prediksi (%)',
          data: predArr,
          backgroundColor: isRed ? 'rgba(192,57,43,0.75)' : 'rgba(183,119,13,0.75)',
          borderColor: isRed ? '#c0392b' : '#b7770d',
          borderWidth: 1.5,
          borderRadius: 5,
          order: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: { boxWidth: 12, usePointStyle: true, font: { family: 'Plus Jakarta Sans', size: 11 } }
        },
        tooltip: {
          backgroundColor: '#1a3a2a',
          titleColor: 'rgba(255,255,255,.6)',
          bodyColor: 'white',
          bodyFont: { weight: 'bold', size: 13 },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: c => c.parsed.y !== null ? ` ${c.parsed.y >= 0 ? '+' : ''}${c.parsed.y.toFixed(1).replace('.', ',')}%` : ''
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: { font: { size: 11, family: 'Plus Jakarta Sans' }, color: '#8a8a8a' }
        },
        y: {
          grid: { color: 'rgba(0,0,0,.05)' },
          border: { display: false },
          ticks: {
            font: { size: 11, family: 'Plus Jakarta Sans' },
            color: '#8a8a8a',
            callback: v => (v >= 0 ? '+' : '') + v.toFixed(1) + '%'
          }
        }
      }
    }
  });
}

function renderInflasiKontribusi(data) {
  const k = data.kontribusi;
  const total = Object.values(k).reduce((a, b) => a + Math.abs(b), 0) || 1;

  const faktorsConfig = [
    { key: 'hari_raya',   icon: '🎉', name: 'Hari Raya Besar',          desc: 'Permintaan melonjak menjelang hari raya keagamaan',   cls: 'fi-raya-bg',  pctCls: 'danger', barColor: '#e74c3c', aktif: data.faktor_aktif?.hari_raya },
    { key: 'cuaca',       icon: '🌧️', name: 'Cuaca Ekstrem',             desc: 'Gangguan panen akibat curah hujan tinggi / kemarau', cls: 'fi-cuaca-bg', pctCls: 'blue',   barColor: '#2471a3', aktif: data.faktor_aktif?.cuaca },
    { key: 'bbm',         icon: '⛽',  name: 'Kenaikan Harga BBM',        desc: 'Biaya distribusi dan logistik meningkat',           cls: 'fi-bbm-bg',  pctCls: 'danger', barColor: '#e74c3c', aktif: data.faktor_aktif?.bbm },
    { key: 'musiman',     icon: '📈',  name: 'Faktor Musiman & Tren',     desc: 'Pola historis dan siklus produksi komoditas',       cls: '',            pctCls: 'warn',   barColor: '#f39c12', aktif: true },
  ];

  const rows = faktorsConfig
    .filter(f => f.aktif && k[f.key] !== undefined)
    .map(f => {
      const val  = k[f.key];
      const pct  = val >= 0 ? '+' + val.toFixed(1).replace('.', ',') + '%' : val.toFixed(1).replace('.', ',') + '%';
      const barW = Math.round(Math.abs(val) / total * 100);
      return `
        <div class="inflasi-faktor-row">
          <div class="inflasi-faktor-row-icon ${f.cls}">${f.icon}</div>
          <div class="inflasi-faktor-row-body">
            <div class="inflasi-faktor-row-name">${f.name}</div>
            <div class="inflasi-faktor-row-desc">${f.desc}</div>
          </div>
          <div class="inflasi-faktor-row-impact">
            <div class="inflasi-faktor-pct ${f.pctCls}">${pct}</div>
            <div class="inflasi-faktor-lbl">kontribusi</div>
            <div class="inflasi-bar-bg">
              <div class="inflasi-bar-fill" style="width:${barW}%;background:${f.barColor}"></div>
            </div>
          </div>
        </div>`;
    }).join('');

  document.getElementById('inflasiKontribusiRows').innerHTML = rows;
}

// ============================================================
// ── UPDATE KAB/KOTA INFLASI ──
// ============================================================
async function updateInflasiKabKota() {
  const provEl = document.getElementById('inflasiProvinsi');
  const kabEl  = document.getElementById('inflasiKabKota');
  const slugEl = document.getElementById('inflasiKomoditas');
  if (!provEl || !kabEl || !slugEl) return;

  const provinsi = provEl.value;
  const slug = slugEl.value;

  if (!provinsi || provinsi === 'Semua Provinsi' || !slug) {
    kabEl.disabled = true;
    kabEl.innerHTML = '<option value="">Pilih Komoditas & Provinsi</option>';
    return;
  }

  kabEl.disabled = false;
  kabEl.innerHTML = '<option value="">Memuat...</option>';

  try {
    const res = await fetch(`api/kab_kota_by_provinsi.php?provinsi=${encodeURIComponent(provinsi)}&slug=${encodeURIComponent(slug)}`);
    const json = await res.json();
    if (json.error) throw new Error(json.error);

    kabEl.innerHTML = '<option value="">Semua Kab/Kota</option>';
    if (json.kab_kota && json.kab_kota.length > 0) {
      json.kab_kota.forEach(k => {
        const opt = document.createElement('option');
        opt.value = k.nama;
        opt.textContent = k.nama;
        kabEl.appendChild(opt);
      });
    } else {
      kabEl.innerHTML = '<option value="">Tidak ada data</option>';
    }
  } catch (err) {
    console.error("Gagal load kab/kota inflasi:", err);
    kabEl.innerHTML = '<option value="">Gagal memuat</option>';
  }
}

