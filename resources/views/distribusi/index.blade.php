@extends('layouts.app')
@section('title', 'Daftar Distribusi Pupuk')

@section('content')
<div class="space-y-6 fade-up">

    {{-- Header --}}
    <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
            <h1 class="text-2xl font-bold text-green-deep">Realisasi Distribusi Pupuk Subsidi</h1>
            <p class="text-sm text-gray-500 mt-1">
                Data penyaluran kuota pupuk subsidi dari Pemerintah ke berbagai provinsi. (Menggunakan DB Server 2)
            </p>
        </div>
        <div class="flex gap-2">
            <a href="{{ route('distribusi.dashboard') }}" 
               class="px-5 py-2.5 rounded-xl border border-cream-dark bg-white text-green-deep font-semibold text-sm hover:bg-gray-50 transition-all no-underline">
                📊 Dashboard Terdistribusi
            </a>
            <a href="{{ route('distribusi.create') }}" 
               class="px-5 py-2.5 rounded-xl bg-green-mid text-white font-semibold text-sm hover:bg-green-deep transition-all no-underline shadow-lg shadow-green-950/20">
                📝 Ajukan Alokasi Pupuk
            </a>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {{-- Left: Main Table (Distribusi Pupuk) --}}
        <div class="lg:col-span-2 bg-white border border-cream-dark rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div class="px-6 py-4 border-b border-cream-dark bg-green-mist/10 flex items-center justify-between">
                <h3 class="font-bold text-green-deep text-sm">🚚 Riwayat Penyaluran Wilayah</h3>
                <span class="text-[10px] font-semibold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full">DB Server 2</span>
            </div>
            
            <div class="overflow-x-auto flex-1">
                <table class="w-full text-left text-sm border-collapse">
                    <thead>
                        <tr class="bg-gray-50 border-b border-cream-dark text-gray-400 font-semibold text-xs">
                            <th class="px-6 py-4">Provinsi</th>
                            <th class="px-6 py-4">Pupuk</th>
                            <th class="px-6 py-4">Periode</th>
                            <th class="px-6 py-4 text-right">Kuota</th>
                            <th class="px-6 py-4 text-right">Realisasi</th>
                            <th class="px-6 py-4 text-center">Persentase</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-cream-dark">
                        @if($distribusi->count() > 0)
                            @foreach($distribusi as $item)
                                @php
                                    $percentage = $item->kuota_ton > 0 ? round(($item->realisasi_ton / $item->kuota_ton) * 100, 1) : 0;
                                @endphp
                                <tr class="hover:bg-cream/20 transition-colors">
                                    <td class="px-6 py-4 font-semibold text-green-deep">{{ $item->provinsi }}</td>
                                    <td class="px-6 py-4">
                                        <div class="flex flex-col">
                                            <span class="font-bold text-blue-900">{{ $item->kode_pupuk }}</span>
                                            <span class="text-[10px] text-gray-400">{{ $item->pupuk->nama_pupuk }}</span>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 text-gray-500 font-medium">{{ $item->periode }}</td>
                                    <td class="px-6 py-4 text-right text-gray-700 font-semibold">{{ number_format($item->kuota_ton, 1) }} Ton</td>
                                    <td class="px-6 py-4 text-right text-green-mid font-bold">{{ number_format($item->realisasi_ton, 1) }} Ton</td>
                                    <td class="px-6 py-4 text-center">
                                        <div class="flex flex-col items-center gap-1">
                                            <span class="text-xs font-bold text-gray-600">{{ $percentage }}%</span>
                                            <div class="w-16 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                                <div class="bg-green-mid h-full" style="width: {{ min($percentage, 100) }}%"></div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            @endforeach
                        @else
                            <tr>
                                <td colspan="6" class="px-6 py-12 text-center text-gray-400 italic">Tidak ada data distribusi pupuk.</td>
                            </tr>
                        @endif
                    </tbody>
                </table>
            </div>
        </div>

        {{-- Right: Master Pupuk Subsidi List --}}
        <div class="bg-white border border-cream-dark rounded-2xl shadow-sm p-6 space-y-4 h-fit">
            <div class="border-b border-cream-dark pb-3">
                <h3 class="font-bold text-green-deep text-sm flex items-center gap-2">
                    <span>🧪</span> Master Jenis Pupuk Subsidi
                </h3>
                <p class="text-xs text-gray-400 mt-1">Daftar harga eceran tertinggi subsidi vs non-subsidi.</p>
            </div>

            <div class="space-y-4">
                @foreach($pupukList as $p)
                    <div class="p-4 bg-cream/35 border border-cream-dark rounded-xl space-y-2 hover:border-green-light/45 transition-colors">
                        <div class="flex items-center justify-between">
                            <span class="font-bold text-blue-900 text-sm">{{ $p->kode_pupuk }}</span>
                            <span class="text-xs font-semibold text-green-deep bg-green-mist px-2 py-0.5 rounded-full">
                                {{ $p->nama_pupuk }}
                            </span>
                        </div>
                        <p class="text-xs text-gray-500 line-clamp-2 leading-relaxed" title="{{ $p->deskripsi }}">
                            {{ $p->deskripsi ?? 'Tidak ada deskripsi.' }}
                        </p>
                        <div class="flex items-center justify-between pt-1 border-t border-cream-dark text-xs">
                            <div>
                                <span class="text-gray-400 block text-[9px] uppercase font-bold">Harga Subsidi</span>
                                <span class="font-bold text-green-mid">Rp {{ number_format($p->harga_subsidi, 0, ',', '.') }}/{{ $p->satuan }}</span>
                            </div>
                            <div class="text-right">
                                <span class="text-gray-400 block text-[9px] uppercase font-bold">Harga Pasar</span>
                                <span class="font-semibold text-gray-500 line-through">Rp {{ number_format($p->harga_nonsubsidi, 0, ',', '.') }}</span>
                            </div>
                        </div>
                    </div>
                @endforeach
            </div>
        </div>

    </div>

</div>
@endsection
