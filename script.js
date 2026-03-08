// ── DATA ──
const commodities = [
  { id:'beras', icon:'🌾', name:'Beras Premium', unit:'per kg', price:14500, change:+1.2, kategori:'pokok' },
  { id:'jagung', icon:'🌽', name:'Jagung Pipilan', unit:'per kg', price:5200, change:-0.8, kategori:'pokok' },
  { id:'kedelai', icon:'🫘', name:'Kedelai Lokal', unit:'per kg', price:9800, change:+0.5, kategori:'pokok' },
  { id:'cabai', icon:'🌶️', name:'Cabai Merah Keriting', unit:'per kg', price:32000, change:+8.4, kategori:'bumbu' },
  { id:'bawang', icon:'🧅', name:'Bawang Merah', unit:'per kg', price:28500, change:-3.1, kategori:'bumbu' },
  { id:'bawangputih', icon:'🧄', name:'Bawang Putih', unit:'per kg', price:38000, change:+1.0, kategori:'bumbu' },
  { id:'tomat', icon:'🍅', name:'Tomat', unit:'per kg', price:8500, change:-5.2, kategori:'sayur' },
  { id:'kentang', icon:'🥔', name:'Kentang', unit:'per kg', price:12000, change:+0.3, kategori:'sayur' },
  { id:'minyak', icon:'🫙', name:'Minyak Goreng', unit:'per liter', price:17500, change:0, kategori:'pokok' },
  { id:'telur', icon:'🥚', name:'Telur Ayam', unit:'per kg', price:27000, change:+2.1, kategori:'protein' },
  { id:'daging', icon:'🥩', name:'Daging Sapi', unit:'per kg', price:135000, change:+0.5, kategori:'protein' },
  { id:'ayam', icon:'🍗', name:'Daging Ayam', unit:'per kg', price:32500, change:-1.8, kategori:'protein' },
];

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
      </div>
    </div>
  `).join('');
}

function filterKategori(k, btn) {
  activeKategori = k;
  document.querySelectorAll('#kategoriTabs .tab-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
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
  const c = commodities.find(x=>x.id===commodity);
  const base = c.price;
  const len = {
    '7H': 7, '1B': 30, '3B': 13, '1T': 12
  }[period];
  return Array.from({length:len},(_,i)=>
    Math.round(base * (0.9 + 0.1*Math.random() + (i/(len*3))*c.change/100))
  );
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

function doSearch() {
  const commodity = document.getElementById('searchCommodity').value;
  const province = document.getElementById('searchProvince').value;

  if (!commodity) { alert('Pilih komoditas terlebih dahulu.'); return; }

  const mult = regionPriceMultiplier[province] || regionPriceMultiplier['default'];
  const base = commodities.find(c=>c.name===commodity)?.price || 15000;

  const regions = province ? [province] : ['Jawa Barat','Jawa Tengah','Jawa Timur','DKI Jakarta','Bali','Sumatera Utara'];
  const results = regions.map(r => {
    const m = regionPriceMultiplier[r] || 1;
    const p = Math.round(base * m * (0.97 + Math.random()*0.06));
    const ch = ((Math.random()-0.4)*6).toFixed(1);
    return { region: r, price: p, change: parseFloat(ch) };
  });

  document.getElementById('searchResultLabel').textContent =
    `Hasil untuk "${commodity}"${province?' di '+province:' (6 Provinsi Representatif)'} — Diperbarui hari ini`;

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
initTicker();
renderCommodities();
renderBerita();
updateChart();
selectCommodity('beras');

// Trigger fade-in for elements already in view
setTimeout(()=>{
  document.querySelectorAll('.fade-in').forEach(el=>{
    if (el.getBoundingClientRect().top < window.innerHeight - 60)
      el.classList.add('visible');
  });
}, 100);
