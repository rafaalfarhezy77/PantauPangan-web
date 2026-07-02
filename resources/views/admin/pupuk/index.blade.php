@extends('layouts.app')
@section('title', 'Admin - Manajemen Distribusi Pupuk')

@section('content')
<div class="max-w-6xl mx-auto">
    <div class="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
            <h1 class="text-2xl font-bold text-green-deep">Manajemen Distribusi Pupuk</h1>
            <p class="text-gray-500 text-sm">Kelola data distribusi pupuk (Admin).</p>
        </div>
        <div class="flex gap-2">
            <a href="{{ route('admin.dashboard') }}" class="px-5 py-2.5 rounded-xl border border-cream-dark bg-white text-green-deep font-semibold text-sm hover:bg-gray-50 transition-all no-underline">Dashboard</a>
            <!-- Tambah rute create di sini nantinya -->
            <button class="px-5 py-2.5 rounded-xl bg-green-mid text-white font-semibold text-sm hover:bg-green-deep transition-all shadow-lg shadow-green-900/20 opacity-50 cursor-not-allowed">Tambah Data</button>
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
                        <th class="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400 text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-cream-dark">
                    @forelse ($distribusi as $row)
                        <tr class="hover:bg-cream/50 transition-colors">
                            <td class="px-6 py-4">
                                <span class="font-semibold text-gray-800">{{ $row->kabupaten_kota }}</span>
                            </td>
                            <td class="px-6 py-4">
                                <span class="text-sm text-gray-600">{{ $row->jenisPupuk->nama_pupuk ?? '-' }}</span>
                            </td>
                            <td class="px-6 py-4 text-right">
                                <span class="text-sm font-medium">{{ number_format($row->kuota, 0, ',', '.') }}</span>
                            </td>
                            <td class="px-6 py-4 text-right">
                                <span class="text-sm font-medium text-green-600">{{ number_format($row->tersalurkan, 0, ',', '.') }}</span>
                            </td>
                            <td class="px-6 py-4 text-center">
                                <span class="text-xs text-gray-400 italic">Coming Soon</span>
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
