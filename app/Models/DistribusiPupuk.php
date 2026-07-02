<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DistribusiPupuk extends Model
{
    use HasFactory;

    protected $fillable = [
        'kabupaten_kota',
        'jenis_pupuk_id',
        'kuota',
        'tersalurkan',
        'periode',
    ];

    public function jenisPupuk()
    {
        return $this->belongsTo(JenisPupuk::class);
    }
}
