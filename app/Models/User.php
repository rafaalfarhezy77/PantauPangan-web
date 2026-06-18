<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'username',
        'email',
        'password',
        'role',
        'instansi_dinas',
        'created_by',
        'updated_by',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
        ];
    }

    // ── Role Helper Methods ───────────────────────────────────────────
    public function isSuperAdmin(): bool    { return $this->role === 'superadmin'; }
    public function isAdminKomoditas(): bool { return $this->role === 'admin-komoditas'; }
    public function isAdminBerita(): bool   { return $this->role === 'admin-berita'; }
    public function isPetani(): bool        { return $this->role === 'petani'; }
    public function isAdmin(): bool         { return in_array($this->role, ['superadmin', 'admin-komoditas', 'admin-berita']); }

    // ── Relationships ─────────────────────────────────────────────────
    public function hasilPanen()
    {
        return $this->hasMany(HasilPanen::class);
    }

    public function pantauan()
    {
        return $this->hasMany(PantauanUser::class);
    }

    public function riwayat()
    {
        return $this->hasMany(RiwayatUser::class);
    }
}

