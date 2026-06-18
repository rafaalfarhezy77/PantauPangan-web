<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;

class AdminController extends Controller
{
    /**
     * Dashboard superadmin — daftar semua user
     */
    public function index()
    {
        $users = User::orderBy('created_at', 'desc')->get();

        return view('admin.admin', compact('users'));
    }

    /**
     * Form tambah user baru oleh superadmin
     */
    public function create()
    {
        return view('admin.users.create');
    }

    /**
     * Simpan user baru oleh superadmin
     */
    public function store(Request $request)
    {
        $allowedRoles = ['superadmin', 'admin-komoditas', 'admin-berita', 'petani', 'pembeli', 'tengkulak', 'pedagang', 'dinas pemerintah', 'lainnya'];

        $validated = $request->validate([
            'username'       => ['required', 'string', 'max:255'],
            'email'          => ['required', 'email', 'max:255', 'unique:users'],
            'password'       => ['required', 'confirmed', Rules\Password::defaults()],
            'role'           => ['required', 'string', 'in:' . implode(',', $allowedRoles)],
            'instansi_dinas' => ['nullable', 'string', 'max:255'],
        ]);

        User::create([
            'username'       => $validated['username'],
            'email'          => $validated['email'],
            'password'       => Hash::make($validated['password']),
            'role'           => $validated['role'],
            'instansi_dinas' => $validated['instansi_dinas'] ?? null,
            'created_by'     => auth()->user()->username,
        ]);

        return redirect()->route('admin.dashboard')
            ->with('success', 'User baru berhasil ditambahkan.');
    }

    /**
     * Form edit user
     */
    public function edit(User $user)
    {
        return view('admin.users.edit', compact('user'));
    }

    /**
     * Simpan perubahan user
     */
    public function update(Request $request, User $user)
    {
        $allowedRoles = ['superadmin', 'admin-komoditas', 'admin-berita', 'petani', 'pembeli', 'tengkulak', 'pedagang', 'dinas pemerintah', 'lainnya'];

        $rules = [
            'username'       => ['required', 'string', 'max:255'],
            'email'          => ['required', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'role'           => ['required', 'string', 'in:' . implode(',', $allowedRoles)],
            'instansi_dinas' => ['nullable', 'string', 'max:255'],
        ];

        if ($request->filled('password')) {
            $rules['password'] = ['confirmed', Rules\Password::defaults()];
        }

        $validated = $request->validate($rules);

        $updateData = [
            'username'       => $validated['username'],
            'email'          => $validated['email'],
            'role'           => $validated['role'],
            'instansi_dinas' => $validated['instansi_dinas'] ?? null,
            'updated_by'     => auth()->user()->username,
        ];

        if ($request->filled('password')) {
            $updateData['password'] = Hash::make($request->password);
        }

        $user->update($updateData);

        return redirect()->route('admin.dashboard')
            ->with('success', 'Data user berhasil diperbarui.');
    }

    /**
     * Hapus user — superadmin tidak bisa menghapus dirinya sendiri
     */
    public function destroy(User $user)
    {
        if ($user->id === auth()->id()) {
            return redirect()->route('admin.dashboard')
                ->with('error', 'Anda tidak dapat menghapus akun Anda sendiri.');
        }

        $user->delete();

        return redirect()->route('admin.dashboard')
            ->with('success', 'User berhasil dihapus.');
    }
}


