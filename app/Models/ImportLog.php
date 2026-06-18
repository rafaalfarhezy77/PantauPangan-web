<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ImportLog extends Model
{
    use HasFactory;

    protected $table = 'import_log';

    protected $fillable = [
        'slug_komoditas', 'tanggal_upload', 'uploaded_by',
        'filename', 'total_entri', 'errors',
    ];
}

