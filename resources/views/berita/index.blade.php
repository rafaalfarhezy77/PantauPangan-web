<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Kabar Pangan — PantauPangan</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Lora:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{{ asset('asset/style.css') }}">

<style>
  /* Base Overrides & Page Theme */
  body {
    background-color: var(--cream);
    color: var(--text);
  }

  /* Adjust Navbar for static display */
  #navbar {
    background: white;
    box-shadow: var(--shadow-sm);
  }

  /* Hero Section for News Center */
  .news-hero {
    background: linear-gradient(135deg, var(--green-deep) 0%, var(--green-mid) 100%);
    padding: 100px 24px 60px;
    text-align: center;
    color: white;
    position: relative;
    overflow: hidden;
  }

  .news-hero::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 50%);
    pointer-events: none;
  }

  .news-hero-content {
    max-width: 800px;
    margin: 0 auto;
    position: relative;
    z-index: 2;
  }

  .news-hero-label {
    display: inline-block;
    background: rgba(255,255,255,0.15);
    backdrop-filter: blur(4px);
    color: #b7e4c7;
    font-size: 0.85rem;
    font-weight: 700;
    padding: 6px 16px;
    border-radius: 50px;
    margin-bottom: 16px;
    text-transform: uppercase;
    letter-spacing: 1px;
    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  }

  .news-hero-title {
    font-size: 2.5rem;
    font-weight: 800;
    font-family: 'Plus Jakarta Sans', sans-serif;
    line-height: 1.25;
    margin-bottom: 12px;
    letter-spacing: -0.5px;
  }

  .news-hero-desc {
    font-size: 1.1rem;
    color: #d8f3dc;
    max-width: 600px;
    margin: 0 auto;
    line-height: 1.6;
  }

  /* Interactive Controls: Search & Category Filter */
  .news-controls-container {
    max-width: 1200px;
    margin: -30px auto 40px;
    padding: 0 24px;
    position: relative;
    z-index: 10;
  }

  .news-controls-box {
    background: white;
    border-radius: var(--radius);
    padding: 24px;
    box-shadow: var(--shadow-md);
    border: 1px solid rgba(45,106,79,0.08);
  }

  /* Live Search styling */
  .search-wrapper {
    position: relative;
    margin-bottom: 20px;
  }

  .search-input {
    width: 100%;
    padding: 16px 20px 16px 52px;
    font-size: 1rem;
    border: 2px solid var(--cream-dark);
    border-radius: var(--radius-sm);
    outline: none;
    font-family: inherit;
    transition: all 0.25s ease;
    box-shadow: 0 2px 6px rgba(0,0,0,0.02);
  }

  .search-input:focus {
    border-color: var(--green-mid);
    box-shadow: 0 4px 12px rgba(45,106,79,0.08);
  }

  .search-icon-el {
    position: absolute;
    left: 20px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 1.2rem;
    color: var(--text-light);
    pointer-events: none;
  }

  /* Category chips */
  .filter-label {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--green-deep);
    margin-bottom: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .chips-container {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .chip-btn {
    padding: 8px 18px;
    border-radius: 50px;
    border: 1.5px solid var(--cream-dark);
    background: var(--cream);
    color: var(--text-light);
    font-size: 0.88rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: inherit;
  }

  .chip-btn:hover {
    border-color: var(--green-mid);
    background: var(--green-pale);
    color: var(--green-deep);
  }

  .chip-btn.active {
    background: var(--green-deep);
    border-color: var(--green-deep);
    color: white;
    box-shadow: 0 4px 10px rgba(26,58,42,0.15);
  }

  /* Grid of News Cards */
  .news-grid-section {
    max-width: 1200px;
    margin: 0 auto 80px;
    padding: 0 24px;
  }

  .berita-grid-all {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 24px;
    transition: opacity 0.3s ease;
  }

  .news-item-card {
    background: white;
    border-radius: var(--radius);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
    border: 1px solid rgba(0,0,0,0.04);
    display: flex;
    flex-direction: column;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
  }

  .news-item-card:hover {
    transform: translateY(-6px);
    box-shadow: var(--shadow-lg);
    border-color: rgba(45,106,79,0.12);
  }

  .card-img-wrapper {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    background: var(--cream-dark);
  }

  .card-img-wrapper img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s cubic-bezier(0.165, 0.84, 0.44, 1);
  }

  .news-item-card:hover .card-img-wrapper img {
    transform: scale(1.05);
  }

  .card-category-tag {
    position: absolute;
    top: 14px;
    left: 14px;
    background: rgba(26, 58, 42, 0.88);
    backdrop-filter: blur(4px);
    color: white;
    font-size: 0.72rem;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 50px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .card-body-content {
    padding: 20px;
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  .card-meta-info {
    font-size: 0.78rem;
    color: var(--text-light);
    margin-bottom: 8px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }

  .card-meta-source {
    font-weight: 700;
    color: var(--green-deep);
  }

  .card-meta-divider {
    color: var(--cream-dark);
  }

  .card-title-el {
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--text);
    line-height: 1.35;
    margin-bottom: 10px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    transition: color 0.2s ease;
  }

  .news-item-card:hover .card-title-el {
    color: var(--green-mid);
  }

  .card-teaser-el {
    font-size: 0.88rem;
    color: var(--text-light);
    line-height: 1.55;
    margin-bottom: 18px;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .card-footer-btns {
    margin-top: auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .card-read-more-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    background: var(--green-mist);
    color: var(--green-deep);
    font-size: 0.78rem;
    font-weight: 700;
    border-radius: 50px;
    text-decoration: none;
    transition: all 0.2s ease;
  }

  .card-read-more-btn:hover {
    background: var(--green-pale);
    color: var(--green-mid);
  }

  /* No Results Page state */
  .no-results {
    grid-column: 1 / -1;
    text-align: center;
    padding: 60px 24px;
    background: white;
    border-radius: var(--radius);
    box-shadow: var(--shadow-sm);
  }

  .no-results-emoji {
    font-size: 3rem;
    margin-bottom: 12px;
  }

  .no-results-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 6px;
  }

  .no-results-desc {
    color: var(--text-light);
    font-size: 0.92rem;
  }

  /* Premium details modal styling (aligned with index.html) */
  .modal-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.5);
    backdrop-filter: blur(4px);
    z-index: 1000;
    display: none;
    align-items: center;
    justify-content: center;
    padding: 24px;
    animation: fadeIn 0.2s ease;
  }

  .modal-overlay.open {
    display: flex !important;
  }

  .modal-box {
    background: white;
    border-radius: var(--radius);
    padding: 32px !important;
    max-width: 650px !important;
    width: 100% !important;
    max-height: 88vh !important;
    display: flex !important;
    flex-direction: column !important;
    box-shadow: var(--shadow-lg) !important;
    animation: fadeUp .3s cubic-bezier(0.165, 0.84, 0.44, 1);
  }

  .modal-title {
    font-size: 1.35rem !important;
    line-height: 1.3 !important;
    margin-bottom: 8px !important;
    font-weight: 700;
    color: var(--text);
  }

  .modal-source {
    font-size: 0.78rem;
    color: var(--text-light);
    margin-bottom: 12px;
  }

  .modal-scroll-content {
    flex: 1 !important;
    overflow-y: auto !important;
    margin: 16px 0 !important;
    padding-right: 12px !important;
  }

  .modal-scroll-content::-webkit-scrollbar {
    width: 6px;
  }
  .modal-scroll-content::-webkit-scrollbar-track {
    background: transparent;
  }
  .modal-scroll-content::-webkit-scrollbar-thumb {
    background: rgba(45, 106, 79, 0.2);
    border-radius: 99px;
  }
  .modal-scroll-content::-webkit-scrollbar-thumb:hover {
    background: rgba(45, 106, 79, 0.4);
  }

  .modal-body p {
    font-size: 0.95rem;
    line-height: 1.7;
    color: var(--text);
    margin-bottom: 14px;
  }

  /* Responsive styling updates */
  @media (max-width: 768deg) {
    .news-hero {
      padding: 90px 20px 45px;
    }
    .news-hero-title {
      font-size: 2rem;
    }
    .news-hero-desc {
      font-size: 0.95rem;
    }
    .news-controls-container {
      margin-top: -20px;
    }
  }

  @media (max-width: 576px) {
    .modal-overlay {
      padding: 16px !important;
    }
    .modal-box {
      padding: 24px 18px 18px !important;
      max-height: 92vh !important;
      border-radius: 18px !important;
    }
    .modal-title {
      font-size: 1.18rem !important;
    }
    .modal-scroll-content {
      margin: 12px 0 !important;
      padding-right: 6px !important;
    }
    #modalImage {
      border-radius: 10px !important;
      margin: 10px 0 !important;
    }
    .modal-body p {
      font-size: 0.88rem !important;
      line-height: 1.65 !important;
    }
    .modal-footer-btn-container {
      flex-direction: column-reverse !important;
      gap: 8px !important;
      margin-top: 14px !important;
    }
    .modal-footer-btn-container a,
    .modal-footer-btn-container button {
      width: 100% !important;
      text-align: center !important;
      justify-content: center !important;
      padding: 11px 22px !important;
      font-size: 0.88rem !important;
    }
  }
</style>
</head>
<body>

<!-- NAVBAR -->
<nav id="navbar">
  <a href="{{ route('beranda') }}" class="nav-brand">
    <div class="nav-logo">🌾</div>
    <span class="nav-title">Pantau<span>Pangan</span></span>
  </a>
  <ul class="nav-links">
    <li><a href="index.html#beranda">Beranda</a></li>
    <li><a href="index.html#cari">Cari Harga</a></li>
    <li><a href="index.html#peta">Peta</a></li>
    <li><a href="index.html#harga">Grafik &amp; Prediksi</a></li>
    <li><a href="index.html#inflasi">Prediksi Inflasi</a></li>
    <li><a href="berita.html" class="active">Berita</a></li>
  </ul>
  <div class="nav-right">
    <a href="{{ route('login') }}" class="btn-login" id="navLoginBtn"> <img src="{{ asset('img/login_icon.png') }}" alt=""> Masuk</a>
    <div class="nav-avatar-wrap" id="navAvatarWrap" style="display:none;position:relative">
      <div class="nav-avatar" id="navAvatar" onclick="toggleAvatarDropdown()">TA</div>
      <div class="avatar-dropdown" id="avatarDropdown">
        <div class="avatar-dropdown-header">
          <div class="avatar-dropdown-name" id="dropdownName">Tani Arga</div>
          <div class="avatar-dropdown-email" id="dropdownEmail">tani.arga@pantaupangan.id</div>
        </div>
        <a href="api/dashboard.php">👤 Dashboard</a>
        <button class="logout-btn" onclick="doLogout()">🚪 Keluar</button>
      </div>
    </div>
    <button class="hamburger" id="hamburgerBtn" onclick="toggleMobileNav()" aria-label="Menu">
      <span></span><span></span><span></span>
    </button>
  </div>
</nav>

<!-- MOBILE NAV DRAWER -->
<div class="mobile-nav" id="mobileNav">
  <ul>
    <li><a href="index.html#beranda" onclick="closeMobileNav()"><span class="mobile-nav-icon">🏠</span> Beranda</a></li>
    <li><a href="index.html#cari" onclick="closeMobileNav()"><span class="mobile-nav-icon">🔍</span> Cari Harga</a></li>
    <li><a href="index.html#peta" onclick="closeMobileNav()"><span class="mobile-nav-icon">🗺️</span> Peta</a></li>
    <li><a href="index.html#harga" onclick="closeMobileNav()"><span class="mobile-nav-icon">📊</span> Grafik &amp; Prediksi</a></li>
    <li><a href="index.html#inflasi" onclick="closeMobileNav()"><span class="mobile-nav-icon">📉</span> Prediksi Inflasi</a></li>
    <li><a href="berita.html" class="active" onclick="closeMobileNav()"><span class="mobile-nav-icon">📰</span> Berita</a></li>
  </ul>
</div>

<!-- HERO BANNER -->
<section class="news-hero">
  <div class="news-hero-content">
    <span class="news-hero-label">Pusat Kabar Pangan</span>
    <h1 class="news-hero-title">Kabar &amp; Analisis Terkini Pangan</h1>
    <p class="news-hero-desc">Dapatkan liputan akurat, kebijakan komoditas, dan berita inflasi pangan terpopuler langsung dari redaksi media terpercaya Indonesia.</p>
  </div>
</section>

<!-- CONTROLS: SEARCH & FILTERS -->
<section class="news-controls-container">
  <div class="news-controls-box">
    <!-- Live Search -->
    <div class="search-wrapper">
      <span class="search-icon-el">🔍</span>
      <input type="text" id="newsSearch" placeholder="Cari berita berdasarkan judul, isi, atau penulis..." class="search-input">
    </div>

    <!-- Category Filters -->
    <div>
      <div class="filter-label">
        <span>🏷️</span> Filter Kategori Komoditas
      </div>
      <div class="chips-container" id="categoryChips">
        <!-- Dynamically generated chips -->
        <button class="chip-btn active" onclick="filterCategory('semua', this)">Semua Berita</button>
      </div>
    </div>
  </div>
</section>

<!-- NEWS GRID SECTION -->
<section class="news-grid-section">
  <div class="berita-grid-all" id="beritaGridAll">
    <!-- Loading placeholder -->
    <div class="no-results" style="background:transparent;box-shadow:none;">
      <div class="no-results-emoji">🔄</div>
      <div class="no-results-title">Memuat Berita...</div>
      <div class="no-results-desc">Kami sedang menghubungkan ke pangkalan data PantauPangan.</div>
    </div>
  </div>
</section>

<!-- FOOTER -->
<footer>
  <div class="footer-grid">
    <div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
        <div style="width:34px;height:34px;background:var(--green-mid);border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:16px">🌾</div>
        <div class="footer-brand-name">PantauPangan</div>
      </div>
      <p class="footer-desc">Platform informasi harga komoditas pangan yang transparan untuk mendukung kesejahteraan petani dan kebutuhan masyarakat Indonesia.</p>
    </div>
    <div>
      <div class="footer-col-title">Fitur</div>
      <ul class="footer-links">
        <li><a href="index.html#beranda">Beranda</a></li>
        <li><a href="index.html#cari">Cari Harga</a></li>
        <li><a href="index.html#peta">Peta</a></li>
        <li><a href="index.html#harga">Grafik &amp; Prediksi</a></li>
        <li><a href="index.html#inflasi">Prediksi Inflasi</a></li>
        <li><a href="berita.html">Berita Pangan</a></li>
      </ul>
    </div>
    <div>
      <div class="footer-col-title">Komoditas</div>
      <ul class="footer-links">
        <li><a href="index.html#cari">Beras & Serealia</a></li>
        <li><a href="index.html#cari">Sayuran & Umbi</a></li>
        <li><a href="index.html#cari">Protein Hewani</a></li>
        <li><a href="index.html#cari">Bumbu & Rempah</a></li>
      </ul>
    </div>
  </div>
  <div class="footer-bottom">
    <span>© 2025 PantauPangan. Data bersumber dari download CSV PIHPS (Pasar Tradisional).</span>
    <span><a href="#">Kebijakan Privasi</a> · <a href="#">Ketentuan Penggunaan</a></span>
  </div>
</footer>

<!-- MODAL BERITA DETAIL -->
<div class="modal-overlay" id="newsModal" onclick="closeModal(event)">
  <div class="modal-box">
    <div class="news-category" id="modalCategory" style="display:inline-block; align-self: flex-start; margin-bottom: 8px;"></div>
    <div class="modal-title" id="modalTitle"></div>
    <div class="modal-source" id="modalSource"></div>
    
    <div class="modal-scroll-content">
      <img id="modalImage" style="width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 12px; margin: 10px 0 15px;" src="" alt="News Cover">
      <div class="modal-body" id="modalBody"></div>
      <div id="modalAttribution" style="display:none; margin-top:14px; padding:10px 14px; background:#f0faf4; border-left:3px solid var(--green-light); border-radius:6px;"></div>
    </div>
    
    <div class="modal-footer-btn-container" style="display:flex; align-items:center; justify-content:space-between; margin-top:12px; flex-wrap:wrap; gap:10px;">
      <a id="modalReadMore" href="#" target="_blank" rel="noopener noreferrer"
         style="display:none; align-items:center; gap:8px; padding:10px 22px;
                background:var(--green-deep); color:#fff; font-weight:700; font-size:.88rem;
                border-radius:50px; text-decoration:none; transition:background .2s; box-shadow:0 4px 14px rgba(26,58,42,.25);"
         onmouseover="this.style.background='var(--green-mid)'"
         onmouseout="this.style.background='var(--green-deep)'">
        📖 Baca Selengkapnya <span style="font-size:1rem">↗</span>
      </a>
      <button class="modal-close" onclick="document.getElementById('newsModal').classList.remove('open')"
              style="padding:10px 22px; border-radius:50px; border:2px solid var(--cream-dark); background:transparent; color:var(--text); font-weight:600; font-size:.88rem; cursor:pointer; transition:background .2s;"
              onmouseover="this.style.background='var(--cream-dark)'"
              onmouseout="this.style.background='transparent'">Tutup</button>
    </div>
  </div>
</div>

<script>
  let newsData = [];
  let filteredData = [];
  let activeCategory = 'semua';
  let searchQuery = '';

  // Fetch all news from database
  async function loadAllNews() {
    try {
      const res = await fetch('api/api_berita.php?all=true');
      const json = await res.json();
      if (json.status === 'success' && json.data.length > 0) {
        newsData = json.data;
        filteredData = [...newsData];
        
        generateCategoryChips();
        renderNewsGrid();
      } else {
        showNoDataState();
      }
    } catch (err) {
      console.error("Gagal memuat berita:", err);
      showErrorState();
    }
  }

  // Populate category chips dynamically
  function generateCategoryChips() {
    const categoriesSet = new Set();
    newsData.forEach(item => {
      if (item.cat) {
        categoriesSet.add(item.cat.toUpperCase());
      }
    });

    const chipsContainer = document.getElementById('categoryChips');
    // Keep 'Semua' chip and clear others
    chipsContainer.innerHTML = `<button class="chip-btn active" onclick="filterCategory('semua', this)">Semua Berita</button>`;

    categoriesSet.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'chip-btn';
      btn.textContent = cat;
      btn.onclick = (e) => filterCategory(cat.toLowerCase(), btn);
      chipsContainer.appendChild(btn);
    });
  }

  // Search input event handler
  document.getElementById('newsSearch').addEventListener('input', function(e) {
    searchQuery = e.target.value.toLowerCase().trim();
    applyFilterAndSearch();
  });

  // Category filter handler
  function filterCategory(category, buttonEl) {
    activeCategory = category;
    
    // Manage active state class
    document.querySelectorAll('.chip-btn').forEach(btn => btn.classList.remove('active'));
    buttonEl.classList.add('active');

    applyFilterAndSearch();
  }

  // Combine live search & category filter logic
  function applyFilterAndSearch() {
    filteredData = newsData.filter(item => {
      // Category condition
      const matchesCategory = activeCategory === 'semua' || (item.cat && item.cat.toLowerCase() === activeCategory);
      
      // Search condition
      const matchesSearch = !searchQuery || 
        (item.title && item.title.toLowerCase().includes(searchQuery)) ||
        (item.body && item.body.toLowerCase().includes(searchQuery)) ||
        (item.source && item.source.toLowerCase().includes(searchQuery)) ||
        (item.penulis && item.penulis.toLowerCase().includes(searchQuery));

      return matchesCategory && matchesSearch;
    });

    renderNewsGrid();
  }

  // Render news cards grid
  function renderNewsGrid() {
    const gridEl = document.getElementById('beritaGridAll');
    
    if (filteredData.length === 0) {
      gridEl.innerHTML = `
        <div class="no-results">
          <div class="no-results-emoji">🔍</div>
          <div class="no-results-title">Berita Tidak Ditemukan</div>
          <div class="no-results-desc">Kami tidak dapat menemukan berita yang sesuai dengan kata kunci atau filter Anda.</div>
        </div>
      `;
      return;
    }

    gridEl.innerHTML = filteredData.map(item => {
      const idx = newsData.indexOf(item);
      const teaserText = item.body && item.body.length > 130 
        ? item.body.slice(0, 130).trim() + '...' 
        : (item.body || '');

      const sourceLabel = item.source && item.source !== 'Redaksi' 
        ? `(Sumber: ${item.source})` 
        : '';

      const readMoreBtnMarkup = item.link_url 
        ? `<a href="${item.link_url}" target="_blank" rel="noopener noreferrer" 
              onclick="event.stopPropagation()" class="card-read-more-btn"
              onmouseover="this.style.background='var(--green-pale)'" 
              onmouseout="this.style.background='var(--green-mist)'">
              Baca Selengkapnya <span style="font-size:0.75rem">↗</span>
           </a>`
        : '';

      return `
        <div class="news-item-card" onclick="openModal(${idx})">
          <div class="card-img-wrapper">
            <span class="card-category-tag">${item.cat}</span>
            <img src="${item.image}" alt="${item.title}" loading="lazy">
          </div>
          <div class="card-body-content">
            <div class="card-meta-info">
              <span class="card-meta-source">${item.source || 'Redaksi'}</span>
              ${item.penulis ? `
                <span class="card-meta-divider">&middot;</span>
                <span class="card-meta-author">✍️ ${item.penulis}</span>
              ` : ''}
              <span class="card-meta-divider">&middot;</span>
              <span class="card-meta-date">${item.date}</span>
            </div>
            <h3 class="card-title-el">${item.title}</h3>
            <p class="card-teaser-el">${teaserText} <span style="color:#888; font-style:italic; font-size:0.8rem">${sourceLabel}</span></p>
            <div class="card-footer-btns">
              <span style="font-size:0.72rem; color:var(--green-mid); font-weight:700; letter-spacing:0.5px;">BACA RINGKASAN →</span>
              ${readMoreBtnMarkup}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Modal open function
  function openModal(idx) {
    const n = newsData[idx];
    if (!n) return;

    document.getElementById('modalCategory').textContent = n.cat;
    document.getElementById('modalCategory').style.background = 'var(--green-mist)';
    document.getElementById('modalCategory').style.color = 'var(--green-deep)';
    document.getElementById('modalCategory').style.padding = '4px 12px';
    document.getElementById('modalCategory').style.borderRadius = '50px';
    document.getElementById('modalCategory').style.fontSize = '0.72rem';
    document.getElementById('modalCategory').style.fontWeight = '700';

    document.getElementById('modalTitle').textContent = n.title;

    // Build subtext
    let sourceLine = '';
    if (n.source && n.source !== 'Redaksi') sourceLine += n.source;
    if (n.penulis) sourceLine += (sourceLine ? ' · ✍️ ' : '✍️ ') + n.penulis;
    if (n.date) sourceLine += (sourceLine ? ' · ' : '') + n.date;
    document.getElementById('modalSource').textContent = sourceLine;

    document.getElementById('modalImage').src = n.image;

    // Render body paragraphs
    const bodyEl = document.getElementById('modalBody');
    const paragraphs = (n.body || '').split(/\n+/).filter(p => p.trim());
    if (paragraphs.length > 1) {
      bodyEl.innerHTML = paragraphs.map(p => `<p style="margin-bottom:12px; line-height:1.75;">${p}</p>`).join('');
    } else {
      bodyEl.innerHTML = `<p style="line-height:1.75;">${n.body || ''}</p>`;
    }

    // Modal attribution footer
    const attrEl = document.getElementById('modalAttribution');
    if (n.source && n.source !== 'Redaksi') {
      attrEl.innerHTML = `<span style="color:var(--text-light); font-size:.82rem; font-style:italic;">&ldquo;...&rdquo; <strong style="color:var(--green-deep)">(Sumber: ${n.source})</strong></span>`;
      attrEl.style.display = 'block';
    } else {
      attrEl.style.display = 'none';
    }

    // Modal Baca Selengkapnya button
    const readMoreEl = document.getElementById('modalReadMore');
    if (n.link_url) {
      readMoreEl.href = n.link_url;
      readMoreEl.style.display = 'inline-flex';
    } else {
      readMoreEl.style.display = 'none';
    }

    document.getElementById('newsModal').classList.add('open');
  }

  // Modal close handler
  function closeModal(e) {
    if (e.target.id === 'newsModal') {
      document.getElementById('newsModal').classList.remove('open');
    }
  }

  // Display clean errors/fallback
  function showNoDataState() {
    document.getElementById('beritaGridAll').innerHTML = `
      <div class="no-results">
        <div class="no-results-emoji">📭</div>
        <div class="no-results-title">Belum Ada Berita</div>
        <div class="no-results-desc">Redaksi belum menerbitkan berita terbaru untuk komoditas pangan saat ini.</div>
      </div>
    `;
  }

  function showErrorState() {
    document.getElementById('beritaGridAll').innerHTML = `
      <div class="no-results">
        <div class="no-results-emoji">⚠️</div>
        <div class="no-results-title">Kesalahan Koneksi</div>
        <div class="no-results-desc">Gagal memuat berita karena masalah jaringan. Silakan segarkan halaman.</div>
      </div>
    `;
  }

  // Responsive Drawer Menu toggle logic
  function toggleMobileNav() {
    const nav = document.getElementById('mobileNav');
    const burger = document.getElementById('hamburgerBtn');
    nav.classList.toggle('open');
    burger.classList.toggle('active');
  }

  function closeMobileNav() {
    const nav = document.getElementById('mobileNav');
    const burger = document.getElementById('hamburgerBtn');
    nav.classList.remove('open');
    burger.classList.remove('active');
  }

  // Handle Session State (similar to index.html for visual consistency)
  function checkSession() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const loginBtn = document.getElementById('navLoginBtn');
    const avatarWrap = document.getElementById('navAvatarWrap');
    
    if (isLoggedIn) {
      if (loginBtn) loginBtn.style.display = 'none';
      if (avatarWrap) {
        avatarWrap.style.display = 'block';
        const name = localStorage.getItem('userName') || 'User';
        const initial = name.split(' ').map(x=>x[0]).join('').substring(0, 2).toUpperCase();
        document.getElementById('navAvatar').textContent = initial;
        document.getElementById('dropdownName').textContent = name;
        document.getElementById('dropdownEmail').textContent = localStorage.getItem('userEmail') || 'user@pantaupangan.id';
      }
    } else {
      if (loginBtn) loginBtn.style.display = 'flex';
      if (avatarWrap) avatarWrap.style.display = 'none';
    }
  }

  function toggleAvatarDropdown() {
    const drop = document.getElementById('avatarDropdown');
    drop.classList.toggle('open');
  }

  function doLogout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    checkSession();
    window.location.reload();
  }

  // Document Ready trigger
  document.addEventListener('DOMContentLoaded', () => {
    loadAllNews();
    checkSession();
  });
</script>
</body>
</html>

