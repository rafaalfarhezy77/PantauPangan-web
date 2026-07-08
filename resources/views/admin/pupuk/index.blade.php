@extends('layouts.app')
@section('title', 'Admin - Manajemen Distribusi Pupuk')

@section('content')
<div class="max-w-6xl mx-auto">

    {{-- Header --}}
    <div class="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
            <h1 class="text-2xl font-bold text-green-deep">🌱 Manajemen Distribusi Pupuk</h1>
            <p class="text-gray-500 text-sm">Kelola data distribusi pupuk bersubsidi.</p>
        </div>
        <div class="flex gap-2">
            <a href="{{ route('admin.dashboard') }}" class="px-5 py-2.5 rounded-xl border border-cream-dark bg-white text-green-deep font-semibold text-sm hover:bg-gray-50 transition-all no-underline">Dashboard</a>
            <button onclick="document.getElementById('modalTambah').classList.remove('hidden')"
                    class="px-5 py-2.5 rounded-xl bg-green-mid text-white font-semibold text-sm hover:bg-green-deep transition-all shadow-lg shadow-green-900/20">
                + Tambah Data
            </button>
        </div>
    </div>

    {{-- Flash messages --}}
    @if(session('success'))
    <div class="mb-4 px-4 py-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">
        ✅ {{ session('success') }}
    </div>
    @endif
    @if($errors->any())
    <div class="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
        <ul class="list-disc list-inside">@foreach($errors->all() as $e)<li>{{ $e }}</li>@endforeach</ul>
    </div>
    @endif

    {{-- Table --}}
    <div class="bg-white border border-cream-dark rounded-2xl overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="bg-gray-50 border-b border-cream-dark">
                        <th class="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400">Wilayah</th>
                        <th class="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400">Jenis Pupuk</th>
                        <th class="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400 text-right">Kuota (kg)</th>
                        <th class="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400 text-right">Tersalurkan (kg)</th>
                        <th class="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400">Periode</th>
                        <th class="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400 text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-cream-dark">
                    @forelse ($distribusi as $row)
                    <tr class="hover:bg-cream/50 transition-colors">
                        <td class="px-6 py-4 font-semibold text-gray-800">{{ $row->kabupaten_kota }}</td>
                        <td class="px-6 py-4 text-sm text-gray-600">{{ $row->jenisPupuk->nama_pupuk ?? '-' }}</td>
                        <td class="px-6 py-4 text-right text-sm font-medium">{{ number_format($row->kuota, 0, ',', '.') }}</td>
                        <td class="px-6 py-4 text-right text-sm font-medium text-green-600">{{ number_format($row->tersalurkan, 0, ',', '.') }}</td>
                        <td class="px-6 py-4 text-sm text-gray-500">{{ $row->periode ?? '-' }}</td>
                        <td class="px-6 py-4 text-center">
                            <div class="flex justify-center gap-2">
                                {{-- Edit --}}
                                <button onclick='openEdit(@json($row))'
                                        class="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-semibold text-xs transition-colors">
                                    Edit
                                </button>
                                {{-- Hapus --}}
                                <form method="POST" action="{{ route('admin.pupuk.destroy', $row->id) }}"
                                      onsubmit="return confirm('Yakin hapus data {{ $row->kabupaten_kota }}?')">
                                    @csrf @method('DELETE')
                                    <button type="submit"
                                            class="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-semibold text-xs transition-colors border-0 cursor-pointer">
                                        Hapus
                                    </button>
                                </form>
                            </div>
                        </td>
                    </tr>
                    @empty
                    <tr>
                        <td colspan="6" class="px-6 py-12 text-center text-gray-400 italic">Belum ada data distribusi pupuk.</td>
                    </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>
</div>

{{-- ── Modal Tambah ── --}}
<div id="modalTambah" class="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div class="flex items-center justify-between px-6 py-4 border-b border-cream-dark">
            <h2 class="font-bold text-green-deep">Tambah Distribusi Pupuk</h2>
            <button onclick="document.getElementById('modalTambah').classList.add('hidden')" class="text-gray-400 hover:text-gray-600 bg-transparent border-0 cursor-pointer text-xl leading-none">✕</button>
        </div>
        <form method="POST" action="{{ route('admin.pupuk.store') }}" class="p-6 space-y-4">
            @csrf
            <div>
                <label class="block text-xs font-semibold text-gray-600 mb-1">Kabupaten / Kota <span class="text-red-500">*</span></label>
                <input type="text" name="kabupaten_kota" required value="{{ old('kabupaten_kota') }}"
                       class="w-full px-4 py-2.5 border border-cream-dark rounded-xl text-sm outline-none focus:border-green-light transition-colors">
            </div>
            <div>
                <label class="block text-xs font-semibold text-gray-600 mb-1">Jenis Pupuk <span class="text-red-500">*</span></label>
                <select name="jenis_pupuk_id" required class="w-full px-4 py-2.5 border border-cream-dark rounded-xl text-sm outline-none focus:border-green-light transition-colors">
                    <option value="">— Pilih Jenis Pupuk —</option>
                    @foreach($jenisPupuk as $jp)
                    <option value="{{ $jp->id }}" {{ old('jenis_pupuk_id') == $jp->id ? 'selected' : '' }}>{{ $jp->nama_pupuk }}</option>
                    @endforeach
                </select>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-xs font-semibold text-gray-600 mb-1">Kuota (kg) <span class="text-red-500">*</span></label>
                    <input type="number" name="kuota" required min="0" step="0.01" value="{{ old('kuota', 0) }}"
                           class="w-full px-4 py-2.5 border border-cream-dark rounded-xl text-sm outline-none focus:border-green-light transition-colors">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-gray-600 mb-1">Tersalurkan (kg) <span class="text-red-500">*</span></label>
                    <input type="number" name="tersalurkan" required min="0" step="0.01" value="{{ old('tersalurkan', 0) }}"
                           class="w-full px-4 py-2.5 border border-cream-dark rounded-xl text-sm outline-none focus:border-green-light transition-colors">
                </div>
            </div>
            <div>
                <label class="block text-xs font-semibold text-gray-600 mb-1">Periode <span class="text-gray-400 font-normal">(Opsional, contoh: 2026)</span></label>
                <input type="text" name="periode" value="{{ old('periode') }}" maxlength="50"
                       class="w-full px-4 py-2.5 border border-cream-dark rounded-xl text-sm outline-none focus:border-green-light transition-colors">
            </div>
            <div class="flex justify-end gap-3 pt-2">
                <button type="button" onclick="document.getElementById('modalTambah').classList.add('hidden')"
                        class="px-5 py-2.5 border border-cream-dark rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors bg-white cursor-pointer">Batal</button>
                <button type="submit"
                        class="px-5 py-2.5 bg-green-mid text-white rounded-xl text-sm font-semibold hover:bg-green-deep transition-colors cursor-pointer border-0">Simpan</button>
            </div>
        </form>
    </div>
</div>

{{-- ── Modal Edit ── --}}
<div id="modalEdit" class="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div class="flex items-center justify-between px-6 py-4 border-b border-cream-dark">
            <h2 class="font-bold text-green-deep">Edit Distribusi Pupuk</h2>
            <button onclick="document.getElementById('modalEdit').classList.add('hidden')" class="text-gray-400 hover:text-gray-600 bg-transparent border-0 cursor-pointer text-xl leading-none">✕</button>
        </div>
        <form id="formEdit" method="POST" class="p-6 space-y-4">
            @csrf @method('PUT')
            <div>
                <label class="block text-xs font-semibold text-gray-600 mb-1">Kabupaten / Kota <span class="text-red-500">*</span></label>
                <input type="text" name="kabupaten_kota" id="editKabupaten" required
                       class="w-full px-4 py-2.5 border border-cream-dark rounded-xl text-sm outline-none focus:border-green-light transition-colors">
            </div>
            <div>
                <label class="block text-xs font-semibold text-gray-600 mb-1">Jenis Pupuk <span class="text-red-500">*</span></label>
                <select name="jenis_pupuk_id" id="editJenisPupuk" required class="w-full px-4 py-2.5 border border-cream-dark rounded-xl text-sm outline-none focus:border-green-light transition-colors">
                    @foreach($jenisPupuk as $jp)
                    <option value="{{ $jp->id }}">{{ $jp->nama_pupuk }}</option>
                    @endforeach
                </select>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-xs font-semibold text-gray-600 mb-1">Kuota (kg) <span class="text-red-500">*</span></label>
                    <input type="number" name="kuota" id="editKuota" required min="0" step="0.01"
                           class="w-full px-4 py-2.5 border border-cream-dark rounded-xl text-sm outline-none focus:border-green-light transition-colors">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-gray-600 mb-1">Tersalurkan (kg) <span class="text-red-500">*</span></label>
                    <input type="number" name="tersalurkan" id="editTersalurkan" required min="0" step="0.01"
                           class="w-full px-4 py-2.5 border border-cream-dark rounded-xl text-sm outline-none focus:border-green-light transition-colors">
                </div>
            </div>
            <div>
                <label class="block text-xs font-semibold text-gray-600 mb-1">Periode</label>
                <input type="text" name="periode" id="editPeriode" maxlength="50"
                       class="w-full px-4 py-2.5 border border-cream-dark rounded-xl text-sm outline-none focus:border-green-light transition-colors">
            </div>
            <div class="flex justify-end gap-3 pt-2">
                <button type="button" onclick="document.getElementById('modalEdit').classList.add('hidden')"
                        class="px-5 py-2.5 border border-cream-dark rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors bg-white cursor-pointer">Batal</button>
                <button type="submit"
                        class="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors cursor-pointer border-0">Update</button>
            </div>
        </form>
    </div>
</div>

<script>
function openEdit(row) {
    document.getElementById('formEdit').action = '/admin/pupuk/' + row.id;
    document.getElementById('editKabupaten').value  = row.kabupaten_kota;
    document.getElementById('editJenisPupuk').value = row.jenis_pupuk_id;
    document.getElementById('editKuota').value       = row.kuota;
    document.getElementById('editTersalurkan').value = row.tersalurkan;
    document.getElementById('editPeriode').value     = row.periode ?? '';
    document.getElementById('modalEdit').classList.remove('hidden');
}
// Tutup modal saat klik backdrop
['modalTambah','modalEdit'].forEach(id => {
    document.getElementById(id).addEventListener('click', function(e) {
        if (e.target === this) this.classList.add('hidden');
    });
});
</script>
@endsection
