@extends('layouts.app')
@section('title', $berita->judul)

@section('content')
<div class="max-w-3xl mx-auto">

    {{-- Back --}}
    <a href="{{ route('berita') }}"
       class="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400
              hover:text-green-deep transition-colors no-underline mb-5">
        ← Kembali ke Berita
    </a>

    {{-- Cover Image --}}
    @if($berita->cover_image)
    <div class="rounded-2xl overflow-hidden mb-6 shadow-sm">
        <img src="{{ $berita->cover_image }}" alt="{{ $berita->judul }}"
             class="w-full object-cover max-h-80">
    </div>
    @endif

    {{-- Article Header --}}
    <div class="mb-6">
        @if($berita->slug_komoditas)
        <a href="{{ route('komoditas.detail', $berita->slug_komoditas) }}"
           class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold
                  bg-green-mist text-green-deep mb-3 no-underline hover:bg-green-pale transition-colors">
            🌾 {{ $berita->slug_komoditas }}
        </a>
        @endif

        <h1 class="text-2xl md:text-3xl font-bold text-green-deep leading-tight mb-3">
            {{ $berita->judul }}
        </h1>

        <div class="flex flex-wrap items-center gap-4 text-xs text-gray-400">
            <span>📅 {{ \Carbon\Carbon::parse($berita->tanggal)->translatedFormat('d F Y') }}</span>
            @if($berita->penulis)
            <span>✍️ {{ $berita->penulis }}</span>
            @endif
            @if($berita->sumber)
            <span>🔗
                @if($berita->link_url)
                <a href="{{ $berita->link_url }}" target="_blank" rel="noopener"
                   class="text-green-mid hover:underline">{{ $berita->sumber }}</a>
                @else
                {{ $berita->sumber }}
                @endif
            </span>
            @endif
        </div>
    </div>

    {{-- Content --}}
    <div class="bg-white border border-cream-dark rounded-2xl p-6 md:p-8 shadow-sm mb-6">
        <div class="prose prose-green max-w-none text-gray-700 leading-relaxed">
            {!! nl2br(e($berita->deskripsi)) !!}
        </div>
    </div>

    {{-- Harga terkini jika ada komoditas terkait --}}
    @if($berita->slug_komoditas)
    <div class="bg-cream border border-cream-dark rounded-2xl p-5 mb-6">
        <p class="text-xs font-semibold text-gray-500 mb-2">Komoditas Terkait</p>
        <a href="{{ route('komoditas.detail', $berita->slug_komoditas) }}"
           class="inline-flex items-center gap-2 px-4 py-2.5 bg-green-deep text-white text-sm
                  font-semibold rounded-xl hover:bg-green-mid transition-colors no-underline">
            📊 Lihat Data Harga {{ $berita->slug_komoditas }}
        </a>
    </div>
    @endif

    {{-- Berita Terkait --}}
    @if($terkait->count() > 0)
    <div>
        <h2 class="font-bold text-green-deep mb-4">📰 Berita Terkait</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            @foreach($terkait as $b)
            <a href="{{ route('berita.show', $b->id) }}"
               class="bg-white border border-cream-dark rounded-2xl overflow-hidden
                      hover:shadow-md transition-shadow no-underline group">
                @if($b->cover_image)
                <img src="{{ $b->cover_image }}" alt="{{ $b->judul }}"
                     class="w-full h-32 object-cover group-hover:scale-105 transition-transform">
                @else
                <div class="w-full h-32 bg-green-mist flex items-center justify-center text-4xl">🌾</div>
                @endif
                <div class="p-4">
                    <p class="text-xs font-semibold text-green-mid mb-1">
                        {{ \Carbon\Carbon::parse($b->tanggal)->format('d M Y') }}
                    </p>
                    <h3 class="text-sm font-bold text-green-deep line-clamp-2 leading-snug">{{ $b->judul }}</h3>
                </div>
            </a>
            @endforeach
        </div>
    </div>
    @endif

</div>
@endsection
