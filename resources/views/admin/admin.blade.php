@extends('layouts.app')
@section('title', 'Manajemen User')

@section('content')
<div class="max-w-5xl mx-auto space-y-6">

    {{-- Header --}}
    <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
            <h1 class="text-2xl font-bold text-green-deep">🛡️ Manajemen Pengguna</h1>
            <p class="text-sm text-gray-500 mt-1">Kelola semua pengguna PantauPangan. Total: <strong>{{ $users->count() }}</strong> akun terdaftar.</p>
        </div>
        <a href="{{ route('admin.users.create') }}"
           class="px-5 py-2.5 bg-green-mid text-white text-sm font-semibold rounded-xl hover:bg-green-deep transition-colors shadow-sm no-underline">
            + Tambah User Baru
        </a>
    </div>

    {{-- Table --}}
    <div class="bg-white border border-cream-dark rounded-2xl overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
            <table class="w-full text-sm text-left">
                <thead class="bg-cream border-b border-cream-dark text-gray-500 uppercase text-[0.7rem] tracking-wider">
                    <tr>
                        <th class="px-6 py-4">User Info</th>
                        <th class="px-6 py-4">Role</th>
                        <th class="px-6 py-4">Dibuat</th>
                        <th class="px-6 py-4">Terakhir Diubah</th>
                        <th class="px-6 py-4 text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-cream-dark">
                    @forelse($users as $user)
                    <tr class="hover:bg-cream/50">
                        <td class="px-6 py-4">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 bg-green-deep rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                    {{ strtoupper(substr($user->username, 0, 1)) }}
                                </div>
                                <div>
                                    <div class="font-bold text-gray-800">{{ $user->username }}</div>
                                    <div class="text-xs text-gray-500">{{ $user->email }}</div>
                                </div>
                            </div>
                        </td>
                        <td class="px-6 py-4">
                            @php
                                $roleStyles = [
                                    'superadmin'       => 'bg-red-700 text-red-50',
                                    'admin-komoditas'  => 'bg-amber-100 text-amber-700',
                                    'admin-berita'     => 'bg-blue-100 text-blue-700',
                                    'petani'           => 'bg-green-mist text-green-800',
                                ];
                                $roleIcons = [
                                    'superadmin'       => '👑',
                                    'admin-komoditas'  => '📦',
                                    'admin-berita'     => '📰',
                                    'petani'           => '🌾',
                                ];
                                $style = $roleStyles[$user->role] ?? 'bg-gray-100 text-gray-700';
                                $icon  = $roleIcons[$user->role] ?? '👤';
                            @endphp
                            <span class="px-2 py-1 rounded-md text-[10px] font-bold {{ $style }}">
                                {{ $icon }} {{ strtoupper($user->role) }}
                            </span>
                            @if($user->instansi_dinas)
                            <div class="text-[10px] text-gray-400 mt-0.5">{{ $user->instansi_dinas }}</div>
                            @endif
                        </td>
                        <td class="px-6 py-4 text-[11px] text-gray-600">
                            <span class="block font-semibold">{{ $user->created_at?->format('d M Y') ?? '-' }}</span>
                            <span class="text-gray-400">Oleh: {{ $user->created_by ?? 'sistem' }}</span>
                        </td>
                        <td class="px-6 py-4 text-[11px] text-gray-600">
                            @if($user->updated_by)
                            <span class="block font-semibold">{{ $user->updated_at?->format('d M Y H:i') }}</span>
                            <span class="text-gray-400">Oleh: {{ $user->updated_by }}</span>
                            @else
                            <span class="text-gray-300 italic">Belum pernah diedit</span>
                            @endif
                        </td>
                        <td class="px-6 py-4">
                            <div class="flex justify-center gap-2">
                                <a href="{{ route('admin.users.edit', $user->id) }}"
                                   class="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-semibold text-xs transition-colors no-underline">
                                    Edit
                                </a>

                                @if($user->id !== auth()->id())
                                <form method="POST" action="{{ route('admin.users.destroy', $user->id) }}"
                                      onsubmit="return confirm('Yakin ingin menghapus user {{ $user->username }}?')">
                                    @csrf
                                    @method('DELETE')
                                    <button type="submit"
                                            class="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-semibold text-xs transition-colors border-0 cursor-pointer">
                                        Hapus
                                    </button>
                                </form>
                                @else
                                <span class="px-3 py-1.5 bg-gray-100 text-gray-400 rounded-lg text-xs font-semibold cursor-not-allowed">
                                    Anda
                                </span>
                                @endif
                            </div>
                        </td>
                    </tr>
                    @empty
                    <tr>
                        <td colspan="5" class="text-center py-10 text-gray-400 text-sm">
                            <div class="text-3xl mb-2">👥</div>
                            <p>Belum ada data pengguna.</p>
                        </td>
                    </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>
</div>
@endsection
