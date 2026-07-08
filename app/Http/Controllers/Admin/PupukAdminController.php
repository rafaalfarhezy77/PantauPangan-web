<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DistribusiPupuk;
use App\Models\JenisPupuk;
use Illuminate\Http\Request;

class PupukAdminController extends Controller
{
    public function index()
    {
        $distribusi  = DistribusiPupuk::with('jenisPupuk')->orderBy('kabupaten_kota')->get();
        $jenisPupuk  = JenisPupuk::orderBy('nama_pupuk')->get();
        return view('admin.pupuk.index', compact('distribusi', 'jenisPupuk'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'kabupaten_kota' => ['required', 'string', 'max:255'],
            'jenis_pupuk_id' => ['required', 'exists:jenis_pupuks,id'],
            'kuota'          => ['required', 'numeric', 'min:0'],
            'tersalurkan'    => ['required', 'numeric', 'min:0'],
            'periode'        => ['nullable', 'string', 'max:50'],
        ]);

        DistribusiPupuk::create($validated);

        return redirect()->route('admin.pupuk')->with('success', 'Data distribusi berhasil ditambahkan.');
    }

    public function update(Request $request, DistribusiPupuk $distribusiPupuk)
    {
        $validated = $request->validate([
            'kabupaten_kota' => ['required', 'string', 'max:255'],
            'jenis_pupuk_id' => ['required', 'exists:jenis_pupuks,id'],
            'kuota'          => ['required', 'numeric', 'min:0'],
            'tersalurkan'    => ['required', 'numeric', 'min:0'],
            'periode'        => ['nullable', 'string', 'max:50'],
        ]);

        $distribusiPupuk->update($validated);

        return redirect()->route('admin.pupuk')->with('success', 'Data distribusi berhasil diperbarui.');
    }

    public function destroy(DistribusiPupuk $distribusiPupuk)
    {
        $distribusiPupuk->delete();
        return redirect()->route('admin.pupuk')->with('success', 'Data distribusi berhasil dihapus.');
    }
}

