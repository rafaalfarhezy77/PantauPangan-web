<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Berita extends Model
{
    use HasFactory;

    protected $table = 'berita';

    protected $fillable = [
        'judul', 'deskripsi', 'cover_image', 'tanggal',
        'slug_komoditas', 'uploaded_by', 'sumber', 'penulis', 'link_url',
    ];

    protected $casts = ['tanggal' => 'date'];
}

