@extends('layouts.app')
@section('title', 'Edit User — ' . $user->username)

@section('content')
<div class="max-w-2xl mx-auto">
    <div class="mb-6">
        <a href="{{ route('admin.dashboard') }}" class="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-green-deep transition-colors no-underline mb-3">
            ← Kembali ke Manajemen User
        </a>
        <h1 class="text-2xl font-bold text-green-deep">Edit User</h1>
        <p class="text-sm text-gray-500 mt-1">Ubah data pengguna <strong>{{ $user->username }}</strong>.</p>
    </div>

    <div class="bg-white border border-cream-dark rounded-2xl shadow-sm overflow-hidden">
        <div class="px-6 py-5 border-b border-cream-dark bg-cream/50 flex items-center gap-3">
            <div class="w-10 h-10 bg-green-deep rounded-full flex items-center justify-center text-white font-bold">
                {{ strtoupper(substr($user->username, 0, 1)) }}
            </div>
            <div>
                <p class="font-semibold text-green-deep text-sm">{{ $user->username }}</p>
                <p class="text-xs text-gray-400">{{ $user->email }}</p>
            </div>
        </div>

        @if ($errors->any())
        <div class="mx-6 mt-4 px-4 py-3 rounded-xl text-sm bg-red-50 text-red-600 border border-red-100">
            <ul class="list-disc list-inside space-y-0.5">
                @foreach ($errors->all() as $error)<li>{{ $error }}</li>@endforeach
            </ul>
        </div>
        @endif

        <form method="POST" action="{{ route('admin.users.update', $user->id) }}" class="p-6 space-y-5">
            @csrf
            @method('PUT')

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-xs font-semibold text-gray-600 mb-1.5">Username <span class="text-red-500">*</span></label>
                    <input type="text" name="username" value="{{ old('username', $user->username) }}" required
                           class="w-full px-4 py-3 bg-white border border-cream-dark rounded-xl text-sm outline-none focus:border-green-light transition-colors @error('username') border-red-400 @enderror">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-gray-600 mb-1.5">Email <span class="text-red-500">*</span></label>
                    <input type="email" name="email" value="{{ old('email', $user->email) }}" required
                           class="w-full px-4 py-3 bg-white border border-cream-dark rounded-xl text-sm outline-none focus:border-green-light transition-colors @error('email') border-red-400 @enderror">
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-xs font-semibold text-gray-600 mb-1.5">Kata Sandi Baru <span class="text-gray-400 font-normal">(kosongkan jika tidak diubah)</span></label>
                    <input type="password" name="password"
                           class="w-full px-4 py-3 bg-white border border-cream-dark rounded-xl text-sm outline-none focus:border-green-light transition-colors @error('password') border-red-400 @enderror">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-gray-600 mb-1.5">Konfirmasi Sandi Baru</label>
                    <input type="password" name="password_confirmation"
                           class="w-full px-4 py-3 bg-white border border-cream-dark rounded-xl text-sm outline-none focus:border-green-light transition-colors">
                </div>
            </div>

            <div>
                <label class="block text-xs font-semibold text-gray-600 mb-1.5">Role <span class="text-red-500">*</span></label>
                <select name="role" required id="roleSelect"
                        class="w-full px-4 py-3 bg-white border border-cream-dark rounded-xl text-sm outline-none focus:border-green-light transition-colors @error('role') border-red-400 @enderror">
                    @foreach(['superadmin','admin-komoditas','admin-berita','petani','pembeli','tengkulak','pedagang','dinas pemerintah','lainnya'] as $r)
                    <option value="{{ $r }}" {{ old('role', $user->role) === $r ? 'selected' : '' }}>{{ ucfirst($r) }}</option>
                    @endforeach
                </select>
            </div>

            <div id="instansiContainer" class="{{ old('role', $user->role) === 'dinas pemerintah' ? '' : 'hidden' }}">
                <label class="block text-xs font-semibold text-gray-600 mb-1.5">Instansi Dinas</label>
                <input type="text" name="instansi_dinas" value="{{ old('instansi_dinas', $user->instansi_dinas) }}"
                       placeholder="cth: Dinas Pertanian Jawa Tengah"
                       class="w-full px-4 py-3 bg-white border border-cream-dark rounded-xl text-sm outline-none focus:border-green-light transition-colors">
            </div>

            <div class="flex items-center gap-3 pt-2">
                <button type="submit" class="flex-1 py-3.5 bg-green-deep text-white font-semibold text-sm rounded-xl hover:bg-green-mid transition-colors cursor-pointer border-0">
                    💾 Simpan Perubahan
                </button>
                <a href="{{ route('admin.dashboard') }}" class="px-5 py-3.5 bg-cream border border-cream-dark text-gray-600 font-medium text-sm rounded-xl hover:bg-cream-dark transition-colors no-underline text-center">
                    Batal
                </a>
            </div>
        </form>
    </div>

    {{-- Danger Zone --}}
    @if($user->id !== auth()->id())
    <div class="mt-4 bg-red-50 border border-red-100 rounded-2xl p-5">
        <p class="text-sm font-semibold text-red-700 mb-1">⚠️ Zona Berbahaya</p>
        <p class="text-xs text-red-500 mb-3">Menghapus user ini akan menghapus seluruh data terkait dan tidak dapat dibatalkan.</p>
        <form method="POST" action="{{ route('admin.users.destroy', $user->id) }}"
              onsubmit="return confirm('Yakin ingin menghapus user {{ $user->username }}? Tindakan ini tidak dapat dibatalkan.')">
            @csrf
            @method('DELETE')
            <button type="submit" class="px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-xl hover:bg-red-700 transition-colors border-0 cursor-pointer">
                🗑️ Hapus User Ini
            </button>
        </form>
    </div>
    @endif
</div>
@endsection

@push('scripts')
<script>
document.getElementById('roleSelect').addEventListener('change', function() {
    document.getElementById('instansiContainer').classList.toggle('hidden', this.value !== 'dinas pemerintah');
});
</script>
@endpush
