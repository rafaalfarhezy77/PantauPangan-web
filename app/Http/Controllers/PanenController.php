<?php

namespace App\Http\Controllers;

use App\Models\HasilPanen;
use App\Models\Komoditas;
use Illuminate\Http\Request;

class PanenController extends Controller
{
    /**
     * Daftar catatan panen milik user yang login
     */
    public function index()
    {
        $panen = HasilPanen::where('user_id', auth()->id())
            ->orderBy('tanggal_panen', 'desc')
            ->paginate(15);

        return view('panen.index', compact('panen'));
    }

    /**
     * Form tambah catatan panen
     */
    public function create()
    {
        $komoditas = Komoditas::where('status', 'aktif')
            ->orderBy('nama_komoditas')
            ->get();

        return view('panen.create', compact('komoditas'));
    }

    /**
     * Simpan catatan panen baru
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_komoditas' => ['required', 'string', 'max:255'],
            'jumlah'         => ['required', 'numeric', 'min:0.01'],
            'satuan'         => ['required', 'string', 'in:kg,kwintal,ton,ikat,buah,liter'],
            'tanggal_panen'  => ['required', 'date', 'before_or_equal:today'],
            'lokasi_lahan'   => ['nullable', 'string', 'max:255'],
        ]);

        HasilPanen::create([
            'user_id'        => auth()->id(),
            'nama_komoditas' => $validated['nama_komoditas'],
            'jumlah'         => $validated['jumlah'],
            'satuan'         => $validated['satuan'],
            'tanggal_panen'  => $validated['tanggal_panen'],
            'lokasi_lahan'   => $validated['lokasi_lahan'] ?? null,
        ]);

        return redirect()->route('panen')
            ->with('success', 'Catatan panen berhasil disimpan.');
    }

    /**
     * Hapus catatan panen (hanya milik sendiri)
     */
    public function destroy(HasilPanen $hasilPanen)
    {
        $this->authorize('delete', $hasilPanen);

        $hasilPanen->delete();

        return redirect()->route('panen')
            ->with('success', 'Catatan panen berhasil dihapus.');
    }
}


