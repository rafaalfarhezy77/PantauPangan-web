{{-- Sidebar navigasi reusable — disesuaikan berdasarkan role user --}}
@php
    $role = auth()->user()?->role ?? 'guest';
    $current = request()->routeIs('dashboard') ? 'dashboard' :
        (request()->routeIs('panen*') ? 'panen' :
        (request()->routeIs('admin.dashboard') ? 'admin' :
        (request()->routeIs('admin.komoditas*') ? 'komoditas-admin' :
        (request()->routeIs('admin.berita*') ? 'berita-admin' : ''))));
@endphp

<aside class="fixed top-0 left-0 z-40 h-screen w-60 flex flex-col
              bg-green-deep text-white shadow-xl transition-transform -translate-x-full md:translate-x-0"
       id="sidebar">

    {{-- Brand --}}
    <div class="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div class="w-10 h-10 bg-white/15 border border-white/20 rounded-xl flex items-center justify-center text-xl">🌾</div>
        <div>
            <span class="font-bold text-white text-base tracking-tight">Pantau<span class="text-green-pale">Pangan</span></span>
            <p class="text-[10px] text-white/40 leading-none mt-0.5">{{ auth()->user()?->username ?? 'Tamu' }}</p>
        </div>
    </div>

    {{-- Role Badge --}}
    <div class="px-5 pt-3 pb-1">
        @php
            $roleLabels = [
                'superadmin'       => ['👑', 'SuperAdmin', 'bg-red-900/60 text-red-200'],
                'admin-komoditas'  => ['📦', 'Admin Komoditas', 'bg-amber-800/50 text-amber-200'],
                'admin-berita'     => ['📰', 'Admin Berita', 'bg-blue-900/50 text-blue-200'],
                'petani'           => ['🌾', 'Petani', 'bg-green-900/60 text-green-200'],
                'pembeli'          => ['🛒', 'Pembeli', 'bg-purple-900/50 text-purple-200'],
            ];
            $label = $roleLabels[$role] ?? ['👤', ucfirst($role), 'bg-white/10 text-white/70'];
        @endphp
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold {{ $label[2] }}">
            {{ $label[0] }} {{ $label[1] }}
        </span>
    </div>

    {{-- Nav Items --}}
    <nav class="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {{-- Dashboard --}}
        <a href="{{ route('dashboard') }}"
           class="sidebar-link {{ $current === 'dashboard' ? 'active' : '' }}">
            <span>📊</span> Dashboard
        </a>

        {{-- Petani --}}
        @if(in_array($role, ['petani']))
        <div class="sidebar-section">Catatan Petani</div>
        <a href="{{ route('panen') }}"
           class="sidebar-link {{ $current === 'panen' ? 'active' : '' }}">
            <span>🌾</span> Catat Panen
        </a>
        <a href="{{ route('panen.create') }}"
           class="sidebar-link">
            <span>➕</span> Tambah Panen
        </a>
        @endif

        {{-- Distribusi Pupuk (UAS Basda) --}}
        @if(in_array($role, ['petani', 'superadmin']))
        <div class="sidebar-section">Distribusi Pupuk (UAS)</div>
        <a href="{{ route('distribusi.dashboard') }}"
           class="sidebar-link {{ request()->routeIs('distribusi.dashboard') ? 'active' : '' }}">
            <span>📊</span> Dashboard Basda
        </a>
        <a href="{{ route('distribusi.index') }}"
           class="sidebar-link {{ request()->routeIs('distribusi.index') ? 'active' : '' }}">
            <span>🚚</span> Realisasi Distribusi
        </a>
        <a href="{{ route('distribusi.create') }}"
           class="sidebar-link {{ request()->routeIs('distribusi.create') ? 'active' : '' }}">
            <span>📝</span> Ajukan Alokasi
        </a>
        @endif

        {{-- Admin Panel --}}
        @if($role === 'superadmin')
        <div class="sidebar-section">Admin Panel</div>
        <a href="{{ route('admin.dashboard') }}"
           class="sidebar-link {{ $current === 'admin' ? 'active' : '' }}">
            <span>🛡️</span> Manajemen User
        </a>
        @endif

        @if(in_array($role, ['admin-komoditas', 'superadmin']))
        <a href="{{ route('admin.komoditas') }}"
           class="sidebar-link {{ $current === 'komoditas-admin' ? 'active' : '' }}">
            <span>📦</span> Import Komoditas
        </a>
        @endif

        @if(in_array($role, ['admin-berita', 'superadmin']))
        <a href="{{ route('admin.berita') }}"
           class="sidebar-link {{ $current === 'berita-admin' ? 'active' : '' }}">
            <span>📰</span> Kelola Berita
        </a>
        @endif

        {{-- Halaman Publik --}}
        <div class="sidebar-section">Jelajahi</div>
        <a href="{{ route('beranda') }}" class="sidebar-link">
            <span>🏠</span> Beranda
        </a>
        <a href="{{ route('berita') }}" class="sidebar-link">
            <span>📖</span> Berita
        </a>
        <a href="{{ route('peta') }}" class="sidebar-link">
            <span>🗺️</span> Peta Harga
        </a>
    </nav>

    {{-- Footer: Profile + Logout --}}
    <div class="px-3 py-4 border-t border-white/10 space-y-0.5">
        <a href="{{ route('profile.edit') }}" class="sidebar-link">
            <span>⚙️</span> Pengaturan Profil
        </a>
        <form method="POST" action="{{ route('logout') }}">
            @csrf
            <button type="submit"
                    class="w-full sidebar-link text-red-400 hover:bg-red-900/30 hover:text-red-300">
                <span>🚪</span> Keluar
            </button>
        </form>
    </div>
</aside>

{{-- Mobile overlay --}}
<div id="sidebarOverlay"
     class="fixed inset-0 z-30 bg-black/50 hidden md:hidden"
     onclick="toggleSidebar()"></div>

<style>
.sidebar-link {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 12px;
    border-radius: 10px;
    font-size: 0.8125rem;
    font-weight: 500;
    color: rgba(255,255,255,0.65);
    transition: all 0.15s;
    text-decoration: none;
    border: none;
    background: transparent;
    width: 100%;
    text-align: left;
    cursor: pointer;
}
.sidebar-link:hover {
    background: rgba(255,255,255,0.08);
    color: #fff;
}
.sidebar-link.active {
    background: rgba(255,255,255,0.12);
    color: #fff;
    font-weight: 600;
}
.sidebar-section {
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.3);
    padding: 12px 12px 4px;
}
</style>

<script>
function toggleSidebar() {
    const sb = document.getElementById('sidebar');
    const ov = document.getElementById('sidebarOverlay');
    sb.classList.toggle('-translate-x-full');
    ov.classList.toggle('hidden');
}
</script>
