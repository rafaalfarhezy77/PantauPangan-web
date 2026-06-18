@extends('layouts.app')
@section('title', 'Tambah User Baru')

@section('content')
<div class="max-w-2xl mx-auto">
    <div class="mb-6">
        <a href="{{ route('admin.dashboard') }}" class="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-green-deep transition-colors no-underline mb-3">
            ← Kembali ke Manajemen User
        </a>
        <h1 class="text-2xl font-bold text-green-deep">Tambah User Baru</h1>
        <p class="text-sm text-gray-500 mt-1">Tambahkan admin atau pengguna baru ke sistem PantauPangan.</p>
    </div>

    <div class="bg-white border border-cream-dark rounded-2xl shadow-sm overflow-hidden">
        <div class="px-6 py-5 border-b border-cream-dark bg-green-mist/30">
            <p class="font-semibold text-green-deep text-sm">👤 Form Tambah User</p>
        </div>

        @if ($errors->any())
        <div class="mx-6 mt-4 px-4 py-3 rounded-xl text-sm bg-red-50 text-red-600 border border-red-100">
            <ul class="list-disc list-inside space-y-0.5">
                @foreach ($errors->all() as $error)<li>{{ $error }}</li>@endforeach
            </ul>
        </div>
        @endif

        <form method="POST" action="{{ route('admin.users.store') }}" class="p-6 space-y-5">
            @csrf

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-xs font-semibold text-gray-600 mb-1.5">Username <span class="text-red-500">*</span></label>
                    <input type="text" name="username" value="{{ old('username') }}" required
                           class="w-full px-4 py-3 bg-white border border-cream-dark rounded-xl text-sm outline-none focus:border-green-light transition-colors @error('username') border-red-400 @enderror">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-gray-600 mb-1.5">Email <span class="text-red-500">*</span></label>
                    <input type="email" name="email" value="{{ old('email') }}" required
                           class="w-full px-4 py-3 bg-white border border-cream-dark rounded-xl text-sm outline-none focus:border-green-light transition-colors @error('email') border-red-400 @enderror">
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-xs font-semibold text-gray-600 mb-1.5">Kata Sandi <span class="text-red-500">*</span></label>
                    <input type="password" name="password" required
                           class="w-full px-4 py-3 bg-white border border-cream-dark rounded-xl text-sm outline-none focus:border-green-light transition-colors @error('password') border-red-400 @enderror">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-gray-600 mb-1.5">Konfirmasi Sandi <span class="text-red-500">*</span></label>
                    <input type="password" name="password_confirmation" required
                           class="w-full px-4 py-3 bg-white border border-cream-dark rounded-xl text-sm outline-none focus:border-green-light transition-colors">
                </div>
            </div>

            <div>
                <label class="block text-xs font-semibold text-gray-600 mb-1.5">Role <span class="text-red-500">*</span></label>
                <select name="role" required
                        class="w-full px-4 py-3 bg-white border border-cream-dark rounded-xl text-sm outline-none focus:border-green-light transition-colors @error('role') border-red-400 @enderror">
                    <option value="">— Pilih role —</option>
                    @foreach(['superadmin','admin-komoditas','admin-berita','petani','pembeli','tengkulak','pedagang','dinas pemerintah','lainnya'] as $r)
                    <option value="{{ $r }}" {{ old('role') === $r ? 'selected' : '' }}>{{ ucfirst($r) }}</option>
                    @endforeach
                </select>
            </div>

            <div id="instansiContainer" class="{{ old('role') === 'dinas pemerintah' ? '' : 'hidden' }}">
                <label class="block text-xs font-semibold text-gray-600 mb-1.5">Instansi Dinas</label>
                <input type="text" name="instansi_dinas" value="{{ old('instansi_dinas') }}"
                       placeholder="cth: Dinas Pertanian Jawa Tengah"
                       class="w-full px-4 py-3 bg-white border border-cream-dark rounded-xl text-sm outline-none focus:border-green-light transition-colors">
            </div>

            <div class="flex items-center gap-3 pt-2">
                <button type="submit" class="flex-1 py-3.5 bg-green-deep text-white font-semibold text-sm rounded-xl hover:bg-green-mid transition-colors cursor-pointer border-0">
                    👤 Tambah User
                </button>
                <a href="{{ route('admin.dashboard') }}" class="px-5 py-3.5 bg-cream border border-cream-dark text-gray-600 font-medium text-sm rounded-xl hover:bg-cream-dark transition-colors no-underline text-center">
                    Batal
                </a>
            </div>
        </form>
    </div>
</div>
@endsection

@push('scripts')
<script>
document.querySelector('[name="role"]').addEventListener('change', function() {
    document.getElementById('instansiContainer').classList.toggle('hidden', this.value !== 'dinas pemerintah');
});
</script>
@endpush
