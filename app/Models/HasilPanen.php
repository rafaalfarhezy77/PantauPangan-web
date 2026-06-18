<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HasilPanen extends Model
{
    use HasFactory;

    protected $table = 'hasil_panen';

    protected $fillable = [
        'user_id', 'nama_komoditas', 'jumlah', 'satuan', 'tanggal_panen', 'lokasi_lahan',
    ];

    protected $casts = [
        'tanggal_panen' => 'date',
        'jumlah'        => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
