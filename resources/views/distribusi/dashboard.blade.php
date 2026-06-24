@extends('layouts.app')
@section('title', 'Dashboard Terdistribusi')

@section('content')
<div class="space-y-6 fade-up">

    {{-- Header --}}
    <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
            <h1 class="text-2xl font-bold text-green-deep">Dashboard Basis Data Terdistribusi</h1>
            <p class="text-sm text-gray-500 mt-1">
                Bukti integrasi multi-database secara real-time antara PC 1 (Harga Pangan) dan PC 2 (Distribusi Pupuk).
            </p>
        </div>
        <div class="flex gap-2">
            <a href="{{ route('distribusi.index') }}" 
               class="px-5 py-2.5 rounded-xl border border-cream-dark bg-white text-green-deep font-semibold text-sm hover:bg-gray-50 transition-all no-underline">
                📦 Kelola Distribusi
            </a>
            <a href="{{ route('distribusi.create') }}" 
               class="px-5 py-2.5 rounded-xl bg-green-mid text-white font-semibold text-sm hover:bg-green-deep transition-all no-underline shadow-lg shadow-green-950/20">
                📝 Ajukan Pupuk Subsidi
            </a>
        </div>
    </div>

    {{-- Server Status Indicators --}}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {{-- Server 1 Card --}}
        <div class="bg-white border border-cream-dark rounded-2xl p-6 shadow-sm relative overflow-hidden">
            <div class="absolute top-0 right-0 w-24 h-24 bg-green-mist/20 rounded-full -mr-8 -mt-8"></div>
            <div class="flex items-start justify-between">
                <div class="space-y-2">
                    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-mist text-green-deep">
                        <span class="w-2 h-2 rounded-full bg-green-light animate-pulse"></span>
                        DB Server 1 (Aktif)
                    </span>
                    <h3 class="text-lg font-bold text-green-deep">PC 1: Server Pangan</h3>
                    <div class="text-xs text-gray-500 space-y-1">
                        <p><strong>Host:</strong> <code class="bg-gray-100 px-1 py-0.5 rounded">{{ $server1_host }}</code></p>
                        <p><strong>Database:</strong> <code class="bg-gray-100 px-1 py-0.5 rounded">{{ $server1_db }}</code></p>
                        <p><strong>Skema Tabel:</strong> <code class="bg-gray-50 px-1 py-0.5 rounded text-gray-600">users, komoditas, harga_harian, hasil_panen</code></p>
                    </div>
                </div>
                <div class="text-3xl">🖥️</div>
            </div>
        </div>

        {{-- Server 2 Card --}}
        <div class="bg-white border border-cream-dark rounded-2xl p-6 shadow-sm relative overflow-hidden">
            <div class="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-8 -mt-8"></div>
            <div class="flex items-start justify-between">
                <div class="space-y-2">
                    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                        <span class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                        DB Server 2 (Aktif - LAN Remote)
                    </span>
                    <h3 class="text-lg font-bold text-green-deep">PC 2: Server Pupuk Subsidi</h3>
                    <div class="text-xs text-gray-500 space-y-1">
                        <p><strong>Host:</strong> <code class="bg-gray-100 px-1 py-0.5 rounded">{{ $server2_host }}</code></p>
                        <p><strong>Database:</strong> <code class="bg-gray-100 px-1 py-0.5 rounded">{{ $server2_db }}</code></p>
                        <p><strong>Skema Tabel:</strong> <code class="bg-gray-50 px-1 py-0.5 rounded text-gray-600">pupuk, distribusi_pupuk, alokasi_pupuk</code></p>
                    </div>
                </div>
                <div class="text-3xl">📡</div>
            </div>
        </div>

    </div>

    {{-- Combined Real-time Stats Cards --}}
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div class="bg-white border border-cream-dark rounded-2xl p-5 shadow-sm">
            <p class="text-xs text-gray-400 font-semibold uppercase tracking-wider">Komoditas Pokok (DB1)</p>
            <h4 class="text-2xl font-bold text-green-deep mt-1">{{ $totalKomoditas }} Jenis</h4>
            <p class="text-[10px] text-gray-400 mt-2">Dikelola di Server 1</p>
        </div>

        <div class="bg-white border border-cream-dark rounded-2xl p-5 shadow-sm">
            <p class="text-xs text-gray-400 font-semibold uppercase tracking-wider">Pupuk Subsidi (DB2)</p>
            <h4 class="text-2xl font-bold text-green-deep mt-1">{{ $totalJenisPupuk }} Jenis</h4>
            <p class="text-[10px] text-gray-400 mt-2">Dikelola di Server 2</p>
        </div>

        <div class="bg-white border border-cream-dark rounded-2xl p-5 shadow-sm">
            <p class="text-xs text-gray-400 font-semibold uppercase tracking-wider">Kuota Pupuk (DB2)</p>
            <h4 class="text-2xl font-bold text-blue-900 mt-1">{{ number_format($totalKuotaTon, 0) }} Ton</h4>
            <p class="text-[10px] text-gray-400 mt-2">Alokasi Wilayah Periode Ini</p>
        </div>

        <div class="bg-white border border-cream-dark rounded-2xl p-5 shadow-sm">
            <p class="text-xs text-gray-400 font-semibold uppercase tracking-wider">Realisasi Distribusi (DB2)</p>
            <h4 class="text-2xl font-bold text-green-mid mt-1">
                {{ number_format($totalRealisasi, 0) }} Ton 
                <span class="text-sm font-semibold text-green-light">({{ $persentaseTotal }}%)</span>
            </h4>
            <div class="w-full bg-gray-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
                <div class="bg-green-mid h-full rounded-full" style="width: {{ $persentaseTotal }}%"></div>
            </div>
        </div>

    </div>

    {{-- Distributed Content Grid --}}
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {{-- Left: Data from DB Server 1 --}}
        <div class="bg-white border border-cream-dark rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div class="px-6 py-4 border-b border-cream-dark bg-green-mist/10 flex items-center justify-between">
                <h3 class="font-bold text-green-deep text-sm flex items-center gap-2">
                    <span>🌾</span> Data Harga Komoditas (DB Server 1)
                </h3>
                <span class="text-[10px] font-semibold bg-green-mist text-green-deep px-2 py-0.5 rounded-full">Koneksi: mysql</span>
            </div>
            
            <div class="p-6 flex-1">
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-sm">
                        <thead>
                            <tr class="border-b border-cream-dark text-gray-400 font-semibold text-xs">
                                <th class="pb-3">Nama Komoditas</th>
                                <th class="pb-3">Provinsi</th>
                                <th class="pb-3 text-right">Harga Terkini</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-cream-dark">
                            @foreach($komoditasList->take(5) as $komoditas)
                                @php
                                    $hargaGroup = $hargaTerkini->get($komoditas->slug_komoditas);
                                    $latest = $hargaGroup ? $hargaGroup->first() : null;
                                @endphp
                                <tr class="hover:bg-cream/20">
                                    <td class="py-3 font-semibold text-green-deep">
                                        {{ $komoditas->icon }} {{ $komoditas->nama_komoditas }}
                                    </td>
                                    <td class="py-3 text-gray-500">
                                        {{ $latest ? $latest->provinsi : 'Nasional' }}
                                    </td>
                                    <td class="py-3 text-right font-bold text-gray-700">
                                        {{ $latest ? 'Rp ' . number_format($latest->harga, 0, ',', '.') : '—' }}
                                    </td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {{-- Right: Data from DB Server 2 --}}
        <div class="bg-white border border-cream-dark rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div class="px-6 py-4 border-b border-cream-dark bg-blue-50/20 flex items-center justify-between">
                <h3 class="font-bold text-green-deep text-sm flex items-center gap-2">
                    <span>🧪</span> Realisasi Kuota Pupuk Subsidi (DB Server 2)
                </h3>
                <span class="text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">Koneksi: mysql_pupuk</span>
            </div>

            <div class="p-6 flex-1">
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-sm">
                        <thead>
                            <tr class="border-b border-cream-dark text-gray-400 font-semibold text-xs">
                                <th class="pb-3">Wilayah</th>
                                <th class="pb-3">Jenis Pupuk</th>
                                <th class="pb-3 text-right">Kuota</th>
                                <th class="pb-3 text-right">Realisasi</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-cream-dark">
                            @php $count = 0; @endphp
                            @foreach($distribusiTerkini as $provinsi => $items)
                                @foreach($items->take(2) as $dist)
                                    @if($count < 5)
                                    <tr class="hover:bg-cream/20">
                                        <td class="py-3 font-semibold text-green-deep">{{ $provinsi }}</td>
                                        <td class="py-3">
                                            <span class="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-md font-bold">
                                                {{ $dist->pupuk->nama_pupuk }}
                                            </span>
                                        </td>
                                        <td class="py-3 text-right text-gray-500 font-medium">{{ number_format($dist->kuota_ton, 0) }} Ton</td>
                                        <td class="py-3 text-right text-green-mid font-bold">{{ number_format($dist->realisasi_ton, 0) }} Ton</td>
                                    </tr>
                                    @php $count++; @endphp
                                    @endif
                                @endforeach
                            @endforeach
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

    </div>

    {{-- Pengajuan Alokasi Saya (Kombinasi User DB1 & Data Alokasi DB2) --}}
    <div class="bg-white border border-cream-dark rounded-2xl shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-cream-dark bg-green-mist/10 flex items-center justify-between">
            <h3 class="font-bold text-green-deep text-sm flex items-center gap-2">
                <span>📝</span> Riwayat Pengajuan Alokasi Anda (Data Tersimpan di DB Server 2)
            </h3>
            <span class="text-xs text-gray-500 font-semibold">User: {{ auth()->user()->username }} (ID: {{ auth()->id() }})</span>
        </div>

        <div class="p-6">
            @if($alokasiku->count() > 0)
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-sm">
                        <thead>
                            <tr class="border-b border-cream-dark text-gray-400 font-semibold text-xs">
                                <th class="pb-3">Tanggal</th>
                                <th class="pb-3">Jenis Pupuk</th>
                                <th class="pb-3">Jumlah Pengajuan</th>
                                <th class="pb-3">Provinsi</th>
                                <th class="pb-3">Status</th>
                                <th class="pb-3">Catatan</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-cream-dark">
                            @foreach($alokasiku as $alokasi)
                                <tr>
                                    <td class="py-3.5 text-gray-500">{{ $alokasi->tanggal_pengajuan->format('d M Y') }}</td>
                                    <td class="py-3.5 font-bold text-blue-900">{{ $alokasi->kode_pupuk }}</td>
                                    <td class="py-3.5 text-gray-700 font-semibold">{{ number_format($alokasi->jumlah_kg, 2) }} kg</td>
                                    <td class="py-3.5 text-gray-500">{{ $alokasi->provinsi }}</td>
                                    <td class="py-3.5">
                                        @if($alokasi->status === 'disetujui')
                                            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                                ✓ Disetujui
                                            </span>
                                        @elseif($alokasi->status === 'ditolak')
                                            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                                ✗ Ditolak
                                            </span>
                                        @else
                                            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                                                ⏱ Pending
                                            </span>
                                        @endif
                                    </td>
                                    <td class="py-3.5 text-xs text-gray-400 max-w-[200px] truncate" title="{{ $alokasi->catatan }}">
                                        {{ $alokasi->catatan ?? '—' }}
                                    </td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            @else
                <div class="text-center py-8 text-gray-400 italic">
                    <p class="text-sm">Anda belum memiliki riwayat pengajuan alokasi pupuk.</p>
                    <a href="{{ route('distribusi.create') }}" class="text-green-mid hover:text-green-deep font-semibold text-xs mt-2 inline-block no-underline">
                        Ajukan Permohonan Sekarang →
                    </a>
                </div>
            @endif
        </div>
    </div>

</div>
@endsection
