@extends('layouts.app')
@section('title', $komoditas->nama_komoditas)

@section('content')
<div class="max-w-5xl mx-auto space-y-6">

    {{-- Header Komoditas --}}
    <div class="bg-gradient-to-br from-green-deep to-green-mid rounded-2xl p-6 text-white relative overflow-hidden">
        <div class="absolute inset-0 opacity-[0.04]"
             style="background-image:url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2260%22 height=%2260%22><path fill=%22white%22 d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/></svg>')">
        </div>
        <div class="relative z-10 flex items-center gap-5">
            <div class="w-16 h-16 bg-white/15 border border-white/20 backdrop-blur-sm rounded-2xl
                        flex items-center justify-center text-4xl flex-shrink-0">
                {{ $komoditas->icon ?? '🌾' }}
            </div>
            <div>
                <p class="text-green-pale text-sm font-medium mb-1">{{ $komoditas->kategori ?? 'Komoditas Pangan' }}</p>
                <h1 class="text-3xl font-bold text-white tracking-tight">{{ $komoditas->nama_komoditas }}</h1>
                @if($hargaTerkini)
                <div class="flex items-center gap-4 mt-2">
                    <span class="text-xl font-bold">Rp {{ number_format($hargaTerkini['harga'], 0, ',', '.') }}/kg</span>
                    <span class="text-sm font-bold px-2.5 py-1 rounded-full
                                 {{ $hargaTerkini['naik'] ? 'bg-green-400/20 text-green-300' : 'bg-red-400/20 text-red-300' }}">
                        {{ $hargaTerkini['naik'] ? '▲' : '▼' }} {{ abs($hargaTerkini['perubahan']) }}%
                    </span>
                </div>
                <p class="text-white/50 text-xs mt-1">Data: {{ $hargaTerkini['tanggal'] }} · Nasional</p>
                @else
                <p class="text-white/50 text-sm mt-1">Belum ada data harga</p>
                @endif
            </div>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {{-- Chart Historis --}}
        <div class="lg:col-span-2 bg-white border border-cream-dark rounded-2xl p-6 shadow-sm">
            <div class="flex items-center justify-between mb-4">
                <div>
                    <p class="font-bold text-green-deep">📈 Tren Harga 30 Hari</p>
                    <p class="text-xs text-gray-400 mt-0.5">Data harga nasional</p>
                </div>
            </div>
            @if($historis->count() > 0)
            <canvas id="hargaChart" class="w-full" style="height: 220px;"></canvas>
            @else
            <div class="flex items-center justify-center h-48 text-gray-300 text-sm flex-col gap-2">
                <span class="text-4xl">📉</span>
                <p>Belum ada data historis</p>
            </div>
            @endif
        </div>

        {{-- Harga Terkini Stats --}}
        <div class="space-y-4">
            @if($hargaTerkini)
            <div class="bg-white border border-cream-dark rounded-2xl p-5 shadow-sm">
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Harga Nasional</p>
                <p class="text-3xl font-bold text-green-deep">Rp {{ number_format($hargaTerkini['harga'], 0, ',', '.') }}</p>
                <p class="text-xs text-gray-400 mt-1">Per kilogram · {{ $hargaTerkini['tanggal'] }}</p>
                <div class="mt-3 pt-3 border-t border-cream-dark">
                    <span class="text-sm font-semibold {{ $hargaTerkini['naik'] ? 'text-green-600' : 'text-red-500' }}">
                        {{ $hargaTerkini['naik'] ? '▲' : '▼' }} {{ abs($hargaTerkini['perubahan']) }}% dari kemarin
                    </span>
                </div>
            </div>
            @endif

            {{-- Pantau Button (jika login) --}}
            @auth
            <div class="bg-cream border border-cream-dark rounded-2xl p-5">
                <p class="text-xs font-semibold text-gray-500 mb-2">Pantau Komoditas Ini</p>
                <button id="pantauBtn"
                        onclick="togglePantauan('{{ $komoditas->slug_komoditas }}')"
                        class="w-full py-2.5 bg-green-deep text-white text-sm font-semibold rounded-xl
                               hover:bg-green-mid transition-colors border-0 cursor-pointer">
                    ⭐ Tambah ke Pantauan
                </button>
            </div>
            @endauth
        </div>
    </div>

    {{-- Perbandingan Provinsi --}}
    @if($perbandingan->count() > 0)
    <div class="bg-white border border-cream-dark rounded-2xl overflow-hidden shadow-sm">
        <div class="px-6 py-4 border-b border-cream-dark">
            <p class="font-bold text-green-deep">🗺️ Perbandingan Harga Antar Provinsi</p>
            <p class="text-xs text-gray-400 mt-0.5">Data terkini · {{ $perbandingan->first()->tanggal }}</p>
        </div>
        <div class="divide-y divide-cream-dark max-h-96 overflow-y-auto">
            @foreach($perbandingan as $idx => $row)
            <div class="flex items-center justify-between px-6 py-3 hover:bg-cream/50">
                <div class="flex items-center gap-3">
                    <span class="w-6 text-center text-xs font-bold text-gray-400">{{ $idx + 1 }}</span>
                    <span class="text-sm font-medium text-gray-800">{{ $row->provinsi }}</span>
                </div>
                <span class="text-sm font-bold text-green-deep">
                    Rp {{ number_format($row->harga, 0, ',', '.') }}
                </span>
            </div>
            @endforeach
        </div>
    </div>
    @endif

</div>
@endsection

@push('scripts')
@if($historis->count() > 0)
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
const ctx = document.getElementById('hargaChart').getContext('2d');
new Chart(ctx, {
    type: 'line',
    data: {
        labels: {!! json_encode($historis->pluck('tanggal')->map(fn($t) => \Carbon\Carbon::parse($t)->format('d/m'))->values()) !!},
        datasets: [{
            label: 'Harga (Rp)',
            data: {!! json_encode($historis->pluck('harga')->values()) !!},
            borderColor: '#2d6a4f',
            backgroundColor: 'rgba(45,106,79,0.08)',
            borderWidth: 2,
            tension: 0.4,
            fill: true,
            pointRadius: 3,
            pointBackgroundColor: '#2d6a4f',
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            y: {
                ticks: {
                    callback: v => 'Rp ' + v.toLocaleString('id-ID'),
                    font: { size: 10 }
                },
                grid: { color: '#f0ebe0' }
            },
            x: {
                ticks: { font: { size: 10 } },
                grid: { display: false }
            }
        }
    }
});

async function togglePantauan(slug) {
    const btn = document.getElementById('pantauBtn');
    btn.disabled = true;
    btn.textContent = '⏳ Loading...';

    const res = await fetch('/api/v1/pantauan/toggle', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
            'Accept': 'application/json',
        },
        body: JSON.stringify({ slug_komoditas: slug })
    });

    const data = await res.json();
    btn.disabled = false;

    if (data.action === 'added') {
        btn.textContent = '✅ Dipantau';
        btn.className = btn.className.replace('bg-green-deep', 'bg-green-light');
    } else {
        btn.textContent = '⭐ Tambah ke Pantauan';
    }
}
</script>
@endif
@endpush
