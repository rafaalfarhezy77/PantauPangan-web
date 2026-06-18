<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Berita;
use App\Models\Komoditas;
use App\Services\CloudinaryService;
use Illuminate\Http\Request;

class BeritaAdminController extends Controller
{
    public function __construct(protected CloudinaryService $cloudinary)
    {
    }

    /**
     * Dashboard admin berita — daftar semua berita
     */
    public function index()
    {
        $berita    = Berita::orderBy('tanggal', 'desc')->paginate(15);
        $komoditas = Komoditas::where('status', 'aktif')->orderBy('nama_komoditas')->get();

        return view('admin.berita', compact('berita', 'komoditas'));
    }

    /**
     * Simpan berita baru
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'judul'          => ['required', 'string', 'max:500'],
            'deskripsi'      => ['required', 'string'],
            'tanggal'        => ['required', 'date'],
            'slug_komoditas' => ['nullable', 'string', 'exists:komoditas,slug_komoditas'],
            'sumber'         => ['nullable', 'string', 'max:255'],
            'penulis'        => ['nullable', 'string', 'max:255'],
            'link_url'       => ['nullable', 'url', 'max:500'],
            'cover_image'    => ['nullable', 'image', 'max:5120'], // max 5MB
        ]);

        $coverUrl = null;

        if ($request->hasFile('cover_image')) {
            $upload   = $this->cloudinary->upload($request->file('cover_image'), 'berita');
            $coverUrl = $upload['secure_url'];
        }

        Berita::create([
            'judul'          => $validated['judul'],
            'deskripsi'      => $validated['deskripsi'],
            'tanggal'        => $validated['tanggal'],
            'slug_komoditas' => $validated['slug_komoditas'] ?? null,
            'sumber'         => $validated['sumber'] ?? null,
            'penulis'        => $validated['penulis'] ?? null,
            'link_url'       => $validated['link_url'] ?? null,
            'cover_image'    => $coverUrl,
            'uploaded_by'    => auth()->user()->username,
        ]);

        return redirect()->route('admin.berita')
            ->with('success', 'Berita berhasil ditambahkan.');
    }

    /**
     * Update berita yang sudah ada
     */
    public function update(Request $request, Berita $berita)
    {
        $validated = $request->validate([
            'judul'          => ['required', 'string', 'max:500'],
            'deskripsi'      => ['required', 'string'],
            'tanggal'        => ['required', 'date'],
            'slug_komoditas' => ['nullable', 'string', 'exists:komoditas,slug_komoditas'],
            'sumber'         => ['nullable', 'string', 'max:255'],
            'penulis'        => ['nullable', 'string', 'max:255'],
            'link_url'       => ['nullable', 'url', 'max:500'],
            'cover_image'    => ['nullable', 'image', 'max:5120'],
        ]);

        $coverUrl = $berita->cover_image;

        if ($request->hasFile('cover_image')) {
            $upload   = $this->cloudinary->upload($request->file('cover_image'), 'berita');
            $coverUrl = $upload['secure_url'];
        }

        $berita->update([
            'judul'          => $validated['judul'],
            'deskripsi'      => $validated['deskripsi'],
            'tanggal'        => $validated['tanggal'],
            'slug_komoditas' => $validated['slug_komoditas'] ?? null,
            'sumber'         => $validated['sumber'] ?? null,
            'penulis'        => $validated['penulis'] ?? null,
            'link_url'       => $validated['link_url'] ?? null,
            'cover_image'    => $coverUrl,
        ]);

        return redirect()->route('admin.berita')
            ->with('success', 'Berita berhasil diperbarui.');
    }

    /**
     * Hapus berita
     */
    public function destroy(Berita $berita)
    {
        $berita->delete();

        return redirect()->route('admin.berita')
            ->with('success', 'Berita berhasil dihapus.');
    }
}


