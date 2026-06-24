@extends('layouts.app')
@section('title', 'Daftar Hasil Panen')

@section('content')
<div class="space-y-6 fade-up">
    
    {{-- Header --}}
    <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
            <h1 class="text-2xl font-bold text-green-deep">Daftar Hasil Panen</h1>
            <p class="text-gray-500 text-sm mt-1">Kelola catatan hasil panen Anda secara efisien.</p>
        </div>
        <div class="flex gap-2">
            <a href="{{ route('dashboard') }}" class="px-5 py-2.5 rounded-xl border border-cream-dark bg-white text-green-deep font-semibold text-sm hover:bg-gray-50 transition-all no-underline">Kembali</a>
            <a href="{{ route('panen.create') }}" class="px-5 py-2.5 rounded-xl bg-green-mid text-white font-semibold text-sm hover:bg-green-deep transition-all no-underline shadow-lg shadow-green-900/20">Tambah Hasil Panen</a>
        </div>
    </div>

    {{-- Main Table --}}
    <div class="bg-white border border-cream-dark rounded-2xl overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="bg-gray-50 border-b border-cream-dark">
                        <th class="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400">Komoditas</th>
                        <th class="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400">Jumlah</th>
                        <th class="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400">Tanggal Panen</th>
                        <th class="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400">Lokasi Lahan</th>
                        <th class="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400 text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-cream-dark">
                    @if($panen->count() > 0)
                        @foreach($panen as $item)
                            <tr class="hover:bg-cream/50 transition-colors">
                                <td class="px-6 py-4">
                                    <div class="flex items-center gap-3">
                                        <div class="w-8 h-8 bg-green-mist rounded-lg flex items-center justify-center text-sm">🌾</div>
                                        <span class="font-semibold text-green-deep">{{ $item->nama_komoditas }}</span>
                                    </div>
                                </td>
                                <td class="px-6 py-4">
                                    <span class="text-sm font-medium text-gray-700">{{ number_format($item->jumlah, 2) }} {{ $item->satuan }}</span>
                                </td>
                                <td class="px-6 py-4">
                                    <span class="text-sm text-gray-500">{{ \Carbon\Carbon::parse($item->tanggal_panen)->format('d M Y') }}</span>
                                </td>
                                <td class="px-6 py-4">
                                    <span class="text-sm text-gray-500">{{ $item->lokasi_lahan ?? '—' }}</span>
                                </td>
                                <td class="px-6 py-4 text-center">
                                    <form action="{{ route('panen.destroy', $item->id) }}" method="POST" onsubmit="return confirm('Apakah Anda yakin ingin menghapus data ini?');" class="inline">
                                        @csrf
                                        @method('DELETE')
                                        <button type="submit" class="text-xs font-semibold text-red-500 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors">Hapus</button>
                                    </form>
                                </td>
                            </tr>
                        @endforeach
                    @else
                        <tr>
                            <td colspan="5" class="px-6 py-12 text-center text-gray-400 italic">Belum ada data hasil panen.</td>
                        </tr>
                    @endif
                </tbody>
            </table>
        </div>
        @if($panen->hasPages())
            <div class="p-4 border-t border-cream-dark">
                {{ $panen->links() }}
            </div>
        @endif
    </div>
</div>
@endsection
