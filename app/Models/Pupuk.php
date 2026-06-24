<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pupuk extends Model
{
    // Model ini menggunakan DB Server 2 (PC2)
    protected $connection = 'mysql_pupuk';
    protected $table      = 'pupuk';
    protected $primaryKey = 'id';
    protected $guarded    = [];

    public function distribusi()
    {
        return $this->hasMany(DistribusiPupuk::class, 'kode_pupuk', 'kode_pupuk');
    }

    public function alokasi()
    {
        return $this->hasMany(AlokasiPupuk::class, 'kode_pupuk', 'kode_pupuk');
    }
}
