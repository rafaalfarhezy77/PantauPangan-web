@extends('layouts.app')
@section('title', 'Tambah Catatan Panen')

@section('content')
<div class="max-w-2xl mx-auto">

    {{-- Header --}}
    <div class="mb-6">
        <a href="{{ route('panen') }}"
           class="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400
                  hover:text-green-deep transition-colors no-underline mb-3">
            ← Kembali ke daftar panen
        </a>
        <h1 class="text-2xl font-bold text-green-deep">Tambah Catatan Panen</h1>
        <p class="text-sm text-gray-500 mt-1">Catat hasil panen Anda untuk membantu memantau produktivitas pertanian.</p>
    </div>

    {{-- Form --}}
    <div class="bg-white border border-cream-dark rounded-2xl shadow-sm overflow-hidden">
        <div class="px-6 py-5 border-b border-cream-dark bg-green-mist/30">
            <p class="font-semibold text-green-deep text-sm">🌾 Form Catatan Panen Baru</p>
        </div>

        @if ($errors->any())
        <div class="mx-6 mt-4 px-4 py-3 rounded-xl text-sm bg-red-50 text-red-600 border border-red-100">
            <ul class="list-disc list-inside space-y-0.5">
                @foreach ($errors->all() as $error)
                <li>{{ $error }}</li>
                @endforeach
            </ul>
        </div>
        @endif

        <form method="POST" action="{{ route('panen.store') }}" class="p-6 space-y-5">
            @csrf

            {{-- Nama Komoditas --}}
            <div>
                <label class="block text-xs font-semibold text-gray-600 mb-1.5">
                    🌱 Nama Komoditas <span class="text-red-500">*</span>
                </label>
                <select name="nama_komoditas" id="nama_komoditas" required
                        class="w-full px-4 py-3 bg-white border border-cream-dark rounded-xl text-sm
                               outline-none focus:border-green-light transition-colors @error('nama_komoditas') border-red-400 @enderror">
                    <option value="">— Pilih komoditas —</option>
                    @foreach($komoditas as $k)
                    <option value="{{ $k->nama_komoditas }}"
                            {{ old('nama_komoditas') === $k->nama_komoditas ? 'selected' : '' }}>
                        {{ $k->icon }} {{ $k->nama_komoditas }}
                    </option>
                    @endforeach
                    <option value="__manual__" {{ old('nama_komoditas') === '__manual__' ? 'selected' : '' }}>
                        ✏️ Ketik manual...
                    </option>
                </select>
                <input type="text" id="nama_manual" name="_nama_manual"
                       placeholder="Ketik nama komoditas"
                       value="{{ old('_nama_manual') }}"
                       class="hidden w-full mt-2 px-4 py-3 bg-white border border-cream-dark rounded-xl text-sm
                              outline-none focus:border-green-light transition-colors">
            </div>

            <div class="grid grid-cols-2 gap-4">
                {{-- Jumlah --}}
                <div>
                    <label class="block text-xs font-semibold text-gray-600 mb-1.5">
                        ⚖️ Jumlah <span class="text-red-500">*</span>
                    </label>
                    <input type="number" name="jumlah" step="0.01" min="0.01"
                           value="{{ old('jumlah') }}" required
                           placeholder="contoh: 250"
                           class="w-full px-4 py-3 bg-white border border-cream-dark rounded-xl text-sm
                                  outline-none focus:border-green-light transition-colors @error('jumlah') border-red-400 @enderror">
                </div>

                {{-- Satuan --}}
                <div>
                    <label class="block text-xs font-semibold text-gray-600 mb-1.5">
                        📏 Satuan <span class="text-red-500">*</span>
                    </label>
                    <select name="satuan" required
                            class="w-full px-4 py-3 bg-white border border-cream-dark rounded-xl text-sm
                                   outline-none focus:border-green-light transition-colors @error('satuan') border-red-400 @enderror">
                        @foreach(['kg', 'kwintal', 'ton', 'ikat', 'buah', 'liter'] as $s)
                        <option value="{{ $s }}" {{ old('satuan', 'kg') === $s ? 'selected' : '' }}>{{ $s }}</option>
                        @endforeach
                    </select>
                </div>
            </div>

            {{-- Tanggal Panen --}}
            <div>
                <label class="block text-xs font-semibold text-gray-600 mb-1.5">
                    📅 Tanggal Panen <span class="text-red-500">*</span>
                </label>
                <input type="date" name="tanggal_panen" required
                       value="{{ old('tanggal_panen', date('Y-m-d')) }}"
                       max="{{ date('Y-m-d') }}"
                       class="w-full px-4 py-3 bg-white border border-cream-dark rounded-xl text-sm
                              outline-none focus:border-green-light transition-colors @error('tanggal_panen') border-red-400 @enderror">
            </div>

            {{-- Lokasi Lahan --}}
            <div>
                <label class="block text-xs font-semibold text-gray-600 mb-1.5">📍 Lokasi Lahan (opsional)</label>
                <input type="text" name="lokasi_lahan"
                       value="{{ old('lokasi_lahan') }}"
                       placeholder="contoh: Sawah Utara, Desa Wonosari"
                       class="w-full px-4 py-3 bg-white border border-cream-dark rounded-xl text-sm
                              outline-none focus:border-green-light transition-colors">
            </div>

            {{-- Submit --}}
            <div class="flex items-center gap-3 pt-2">
                <button type="submit"
                        class="flex-1 py-3.5 bg-green-deep text-white font-semibold text-sm rounded-xl
                               hover:bg-green-mid transition-colors cursor-pointer border-0">
                    💾 Simpan Catatan Panen
                </button>
                <a href="{{ route('panen') }}"
                   class="px-5 py-3.5 bg-cream border border-cream-dark text-gray-600 font-medium text-sm
                          rounded-xl hover:bg-cream-dark transition-colors no-underline text-center">
                    Batal
                </a>
            </div>
        </form>
    </div>
</div>
@endsection

@push('scripts')
<script>
const select = document.getElementById('nama_komoditas');
const manualInput = document.getElementById('nama_manual');

select.addEventListener('change', function() {
    if (this.value === '__manual__') {
        manualInput.classList.remove('hidden');
        manualInput.required = true;
    } else {
        manualInput.classList.add('hidden');
        manualInput.required = false;
        manualInput.value = '';
    }
});

// Sync manual input ke name="nama_komoditas" on submit
document.querySelector('form').addEventListener('submit', function(e) {
    if (select.value === '__manual__') {
        if (!manualInput.value.trim()) {
            e.preventDefault();
            manualInput.focus();
            return;
        }
        select.value = manualInput.value.trim();
    }
});
</script>
@endpush
