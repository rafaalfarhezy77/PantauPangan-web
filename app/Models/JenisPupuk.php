<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JenisPupuk extends Model
{
    use HasFactory;

    protected $fillable = [
        'nama_pupuk',
        'deskripsi',
    ];

    public function distribusi()
    {
        return $this->hasMany(DistribusiPupuk::class);
    }
}
