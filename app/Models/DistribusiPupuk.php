<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DistribusiPupuk extends Model
{
    // Model ini menggunakan DB Server 2 (PC2)
    protected $connection = 'mysql_pupuk';
    protected $table      = 'distribusi_pupuk';
    protected $guarded    = [];

    protected $casts = [
        'kuota_ton'          => 'decimal:2',
        'realisasi_ton'      => 'decimal:2',
        'tanggal_distribusi' => 'date',
    ];

    public function pupuk()
    {
        return $this->belongsTo(Pupuk::class, 'kode_pupuk', 'kode_pupuk');
    }
}
