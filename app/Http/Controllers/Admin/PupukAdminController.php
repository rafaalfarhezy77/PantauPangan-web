<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\DistribusiPupuk;
use App\Models\JenisPupuk;

class PupukAdminController extends Controller
{
    public function index()
    {
        $distribusi = DistribusiPupuk::with('jenisPupuk')->get();
        return view('admin.pupuk.index', compact('distribusi'));
    }
}
