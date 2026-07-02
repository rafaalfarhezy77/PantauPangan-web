@extends('layouts.app')
@section('title', 'Distribusi Pupuk')

@section('content')
<div class="max-w-6xl mx-auto">
    <div class="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
            <h1 class="text-2xl font-bold text-green-deep">Distribusi Pupuk</h1>
            <p class="text-gray-500 text-sm">Informasi alokasi dan distribusi pupuk per kabupaten/kota.</p>
        </div>
        <div class="flex gap-2">
            <a href="{{ route('dashboard') }}" class="px-5 py-2.5 rounded-xl border border-cream-dark bg-white text-green-deep font-semibold text-sm hover:bg-gray-50 transition-all no-underline">Kembali</a>
        </div>
    </div>

    <div class="bg-white border border-cream-dark rounded-2xl overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="bg-gray-50 border-b border-cream-dark">
                        <th class="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400">Wilayah</th>
                        <th class="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400">Jenis Pupuk</th>
                        <th class="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400 text-right">Total Kuota</th>
                        <th class="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400 text-right">Tersalurkan</th>
                        <th class="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400 text-right">Sisa Kuota</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-cream-dark">
                    @forelse ($distribusi as $row)
                        @php
                            $sisa = $row->kuota - $row->tersalurkan;
                            $percent = $row->kuota > 0 ? ($row->tersalurkan / $row->kuota) * 100 : 0;
                        @endphp
                        <tr class="hover:bg-cream/50 transition-colors">
                            <td class="px-6 py-4">
                                <div class="flex items-center gap-3">
                                    <div class="w-8 h-8 bg-green-mist rounded-lg flex items-center justify-center text-sm">📍</div>
                                    <div>
                                        <span class="font-semibold text-green-deep block">{{ $row->kabupaten_kota }}</span>
                                        <span class="text-xs text-gray-400">Periode: {{ $row->periode ?? '-' }}</span>
                                    </div>
                                </div>
                            </td>
                            <td class="px-6 py-4">
                                <span class="text-sm font-medium text-gray-700">{{ $row->jenisPupuk->nama_pupuk ?? '-' }}</span>
                            </td>
                            <td class="px-6 py-4 text-right">
                                <span class="text-sm font-semibold text-gray-700">{{ number_format($row->kuota, 0, ',', '.') }}</span>
                            </td>
                            <td class="px-6 py-4 text-right">
                                <span class="text-sm font-semibold text-green-600">{{ number_format($row->tersalurkan, 0, ',', '.') }}</span>
                                <div class="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                                  <div class="bg-green-500 h-1.5 rounded-full" style="width: {{ min($percent, 100) }}%"></div>
                                </div>
                            </td>
                            <td class="px-6 py-4 text-right">
                                <span class="text-sm font-semibold text-orange-500">{{ number_format($sisa, 0, ',', '.') }}</span>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="5" class="px-6 py-12 text-center text-gray-400 italic">Belum ada data distribusi pupuk.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>
</div>
@endsection
