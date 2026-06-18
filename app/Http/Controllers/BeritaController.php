<?php

namespace App\Http\Controllers;

use App\Models\Berita;
use App\Models\Komoditas;
use App\Models\RiwayatUser;
use Illuminate\Http\Request;

class BeritaController extends Controller
{
    /**
     * Halaman daftar berita publik
     */
    public function index(Request $request)
    {
        $query = Berita::query();

        if ($request->has('komoditas')) {
            $query->where('slug_komoditas', $request->komoditas);
        }

        if ($request->has('q')) {
            $query->where('judul', 'like', '%' . $request->q . '%');
        }

        $berita    = $query->orderBy('tanggal', 'desc')->paginate(12);
        $komoditas = Komoditas::where('status', 'aktif')->orderBy('nama_komoditas')->get();

        return view('berita.index', compact('berita', 'komoditas'));
    }

    /**
     * Halaman detail satu berita
     */
    public function show(int $id)
    {
        $berita  = Berita::findOrFail($id);

        // Rekam riwayat pencarian jika user login
        if (auth()->check() && $berita->slug_komoditas) {
            RiwayatUser::updateOrCreate(
                ['user_id' => auth()->id(), 'slug_komoditas' => $berita->slug_komoditas],
                ['waktu_pencarian' => now()]
            );
        }

        // Berita terkait (komoditas yang sama)
        $terkait = Berita::where('slug_komoditas', $berita->slug_komoditas)
            ->where('id', '!=', $berita->id)
            ->orderBy('tanggal', 'desc')
            ->take(3)
            ->get();

        return view('berita.show', compact('berita', 'terkait'));
    }
}
