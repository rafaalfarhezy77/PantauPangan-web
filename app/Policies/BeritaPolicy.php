<?php

namespace App\Policies;

use App\Models\Berita;
use App\Models\User;

class BeritaPolicy
{
    /**
     * Hanya superadmin atau admin-berita yang bisa membuat berita
     */
    public function create(User $user): bool
    {
        return in_array($user->role, ['superadmin', 'admin-berita']);
    }

    /**
     * Hanya superadmin atau admin-berita yang bisa mengupdate berita
     */
    public function update(User $user, Berita $berita): bool
    {
        return in_array($user->role, ['superadmin', 'admin-berita']);
    }

    /**
     * Hanya superadmin atau admin-berita yang bisa menghapus berita
     */
    public function delete(User $user, Berita $berita): bool
    {
        return in_array($user->role, ['superadmin', 'admin-berita']);
    }
}
