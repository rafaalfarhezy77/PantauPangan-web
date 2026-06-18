<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RiwayatUser extends Model
{
    use HasFactory;

    protected $table = 'riwayat_user';

    protected $fillable = ['user_id', 'slug_komoditas', 'waktu_pencarian'];

    protected $casts = ['waktu_pencarian' => 'datetime'];
}

