{{-- Topbar / Header untuk halaman yang sudah login --}}
@props(['title' => '', 'subtitle' => ''])

<header class="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-cream-dark
               flex items-center justify-between px-4 md:px-6 h-14">

    {{-- Hamburger (mobile) + Title --}}
    <div class="flex items-center gap-3">
        <button onclick="toggleSidebar()"
                class="md:hidden w-9 h-9 flex items-center justify-center rounded-xl
                       hover:bg-cream-dark transition-colors border-0 bg-transparent cursor-pointer">
            <svg class="w-5 h-5 text-green-deep" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
        </button>

        @if($title)
        <div>
            <h1 class="font-bold text-green-deep text-base leading-tight">{{ $title }}</h1>
            @if($subtitle)
            <p class="text-[11px] text-gray-400">{{ $subtitle }}</p>
            @endif
        </div>
        @endif
    </div>

    {{-- Right side: notifications + user --}}
    <div class="flex items-center gap-2">
        {{-- Beranda shortcut --}}
        <a href="{{ route('beranda') }}"
           class="hidden sm:flex items-center gap-1.5 text-xs font-medium text-gray-500
                  bg-cream border border-cream-dark px-3 py-1.5 rounded-full
                  hover:border-green-pale hover:text-green-deep transition-colors no-underline">
            🏠 Beranda
        </a>

        {{-- User chip --}}
        <div class="flex items-center gap-2 bg-cream border border-cream-dark rounded-full pl-2 pr-3 py-1.5">
            <div class="w-6 h-6 bg-green-deep rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                {{ strtoupper(substr(auth()->user()->username ?? 'U', 0, 1)) }}
            </div>
            <span class="text-xs font-semibold text-green-deep hidden sm:block">
                {{ auth()->user()->username ?? 'User' }}
            </span>
        </div>
    </div>
</header>
