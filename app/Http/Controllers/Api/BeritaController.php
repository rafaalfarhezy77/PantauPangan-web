<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Berita;
use Illuminate\Http\Request;

class BeritaController extends Controller
{
    /**
     * GET /api/v1/berita
     * Daftar berita dengan paginasi dan filter slug komoditas
     */
    public function index(Request $request)
    {
        $query = Berita::query();

        if ($request->has('slug_komoditas')) {
            $query->where('slug_komoditas', $request->slug_komoditas);
        }

        if ($request->has('q')) {
            $query->where('judul', 'like', '%' . $request->q . '%');
        }

        $berita = $query->orderBy('tanggal', 'desc')
            ->paginate($request->get('per_page', 12));

        return response()->json([
            'status' => 'success',
            'data'   => $berita->items(),
            'meta'   => [
                'current_page'  => $berita->currentPage(),
                'last_page'     => $berita->lastPage(),
                'per_page'      => $berita->perPage(),
                'total'         => $berita->total(),
            ],
        ]);
    }

    /**
     * GET /api/v1/berita/{id}
     * Detail satu berita
     */
    public function show(int $id)
    {
        $berita = Berita::findOrFail($id);

        return response()->json([
            'status' => 'success',
            'data'   => $berita,
        ]);
    }
}
