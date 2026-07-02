<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\DistribusiPupuk;

class PupukController extends Controller
{
    public function index()
    {
        $distribusi = DistribusiPupuk::with('jenisPupuk')
            ->orderBy('kabupaten_kota')
            ->get();
            
        return view('pupuk.index', compact('distribusi'));
    }
}
