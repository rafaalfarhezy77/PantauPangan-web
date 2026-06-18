<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PantauanUser extends Model
{
    use HasFactory;

    protected $table = 'pantauan_user';

    protected $fillable = ['user_id', 'slug_komoditas', 'ditambahkan_pada'];

    protected $casts = ['ditambahkan_pada' => 'datetime'];
}
