@extends('layouts.app')
@section('title', 'Ajukan Alokasi Pupuk')

@section('content')
<div class="max-w-2xl mx-auto fade-up">

    {{-- Header --}}
    <div class="mb-6">
        <a href="{{ route('distribusi.index') }}"
           class="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400
                  hover:text-green-deep transition-colors no-underline mb-3">
            ← Kembali ke daftar distribusi
        </a>
        <h1 class="text-2xl font-bold text-green-deep">Ajukan Alokasi Pupuk Subsidi</h1>
        <p class="text-sm text-gray-500 mt-1">
            Silakan ajukan permohonan alokasi pupuk subsidi sesuai kebutuhan lahan pertanian Anda. Pengajuan ini akan disimpan di database PC 2.
        </p>
    </div>

    {{-- Form --}}
    <div class="bg-white border border-cream-dark rounded-2xl shadow-sm overflow-hidden">
        <div class="px-6 py-5 border-b border-cream-dark bg-green-mist/30">
            <p class="font-semibold text-green-deep text-sm flex items-center gap-2">
                <span>📝</span> Form Permohonan Alokasi Pupuk (DB2)
            </p>
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

        <form method="POST" action="{{ route('distribusi.store') }}" class="p-6 space-y-5">
            @csrf

            {{-- Jenis Pupuk --}}
            <div>
                <label class="block text-xs font-semibold text-gray-600 mb-1.5">
                    🧪 Jenis Pupuk Subsidi <span class="text-red-500">*</span>
                </label>
                <select name="kode_pupuk" required
                        class="w-full px-4 py-3 bg-white border border-cream-dark rounded-xl text-sm
                               outline-none focus:border-green-light transition-colors @error('kode_pupuk') border-red-400 @enderror">
                    <option value="">— Pilih jenis pupuk —</option>
                    @foreach($pupukList as $p)
                        <option value="{{ $p->kode_pupuk }}" {{ old('kode_pupuk') === $p->kode_pupuk ? 'selected' : '' }}>
                            {{ $p->kode_pupuk }} — {{ $p->nama_pupuk }} (Rp {{ number_format($p->harga_subsidi, 0, ',', '.') }}/{{ $p->satuan }})
                        </option>
                    @endforeach
                </select>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                {{-- Jumlah --}}
                <div>
                    <label class="block text-xs font-semibold text-gray-600 mb-1.5">
                        ⚖️ Jumlah Pengajuan (kg) <span class="text-red-500">*</span>
                    </label>
                    <input type="number" name="jumlah_kg" step="0.01" min="1"
                           value="{{ old('jumlah_kg') }}" required
                           placeholder="contoh: 200"
                           class="w-full px-4 py-3 bg-white border border-cream-dark rounded-xl text-sm
                                  outline-none focus:border-green-light transition-colors @error('jumlah_kg') border-red-400 @enderror">
                </div>

                {{-- Provinsi --}}
                <div>
                    <label class="block text-xs font-semibold text-gray-600 mb-1.5">
                        📍 Provinsi Lahan <span class="text-red-500">*</span>
                    </label>
                    <select name="provinsi" required
                            class="w-full px-4 py-3 bg-white border border-cream-dark rounded-xl text-sm
                                   outline-none focus:border-green-light transition-colors @error('provinsi') border-red-400 @enderror">
                        <option value="">— Pilih Provinsi —</option>
                        @foreach(['Jawa Tengah', 'Jawa Timur', 'Jawa Barat', 'Yogyakarta', 'Banten', 'DKI Jakarta'] as $prov)
                            <option value="{{ $prov }}" {{ old('provinsi') === $prov ? 'selected' : '' }}>{{ $prov }}</option>
                        @endforeach
                    </select>
                </div>
            </div>

            {{-- Catatan --}}
            <div>
                <label class="block text-xs font-semibold text-gray-600 mb-1.5">📝 Catatan / Alasan Pengajuan (opsional)</label>
                <textarea name="catatan" rows="3"
                          placeholder="Tuliskan luas lahan atau tujuan pengajuan pupuk ini..."
                          class="w-full px-4 py-3 bg-white border border-cream-dark rounded-xl text-sm
                                 outline-none focus:border-green-light transition-colors">{{ old('catatan') }}</textarea>
            </div>

            {{-- Submit --}}
            <div class="flex items-center gap-3 pt-2">
                <button type="submit"
                        class="flex-1 py-3.5 bg-green-deep text-white font-semibold text-sm rounded-xl
                               hover:bg-green-mid transition-colors cursor-pointer border-0">
                    💾 Kirim Pengajuan Alokasi
                </button>
                <a href="{{ route('distribusi.index') }}"
                   class="px-5 py-3.5 bg-cream border border-cream-dark text-gray-600 font-medium text-sm
                          rounded-xl hover:bg-cream-dark transition-colors no-underline text-center">
                    Batal
                </a>
            </div>
        </form>
    </div>
</div>
@endsection
