<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AlokasiPupuk extends Model
{
    // Model ini menggunakan DB Server 2 (PC2)
    protected $connection = 'mysql_pupuk';
    protected $table      = 'alokasi_pupuk';
    protected $guarded    = [];

    protected $casts = [
        'jumlah_kg'          => 'decimal:2',
        'tanggal_pengajuan'  => 'date',
    ];

    // user() tidak bisa pakai relasi Eloquent biasa (beda koneksi DB)
    // Ambil user manual via: User::find($this->user_id)
}
