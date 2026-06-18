<?php

namespace App\Policies;

use App\Models\HasilPanen;
use App\Models\User;

class PanenPolicy
{
    /**
     * Hanya petani yang bisa mencatat panen
     */
    public function create(User $user): bool
    {
        return $user->role === 'petani';
    }

    /**
     * Petani hanya bisa mengupdate catatan panennya sendiri
     */
    public function update(User $user, HasilPanen $panen): bool
    {
        return $user->role === 'petani' && $user->id === $panen->user_id;
    }

    /**
     * Petani hanya bisa menghapus catatan panennya sendiri,
     * superadmin bisa menghapus semua
     */
    public function delete(User $user, HasilPanen $panen): bool
    {
        if ($user->role === 'superadmin') return true;

        return $user->role === 'petani' && $user->id === $panen->user_id;
    }
}
