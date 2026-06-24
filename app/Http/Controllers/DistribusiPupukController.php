<?php

namespace App\Http\Controllers;

use App\Models\AlokasiPupuk;
use App\Models\DistribusiPupuk;
use App\Models\HargaHarian;
use App\Models\Komoditas;
use App\Models\Pupuk;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DistribusiPupukController extends Controller
{
    /**
     * Halaman daftar distribusi pupuk (baca DB Server 2 — PC2)
     */
    public function index()
    {
        $distribusi = DistribusiPupuk::with('pupuk')
            ->orderBy('tanggal_distribusi', 'desc')
            ->get();

        $pupukList = Pupuk::where('status', 'aktif')->get();

        return view('distribusi.index', compact('distribusi', 'pupukList'));
    }

    /**
     * Form pengajuan alokasi pupuk
     */
    public function create()
    {
        // DB2: ambil daftar pupuk aktif
        $pupukList = Pupuk::where('status', 'aktif')->get();

        return view('distribusi.create', compact('pupukList'));
    }

    /**
     * Simpan pengajuan alokasi ke DB Server 2 (PC2)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'kode_pupuk'  => ['required', 'string', 'exists:mysql_pupuk.pupuk,kode_pupuk'],
            'jumlah_kg'   => ['required', 'numeric', 'min:1'],
            'provinsi'    => ['required', 'string', 'max:100'],
            'catatan'     => ['nullable', 'string', 'max:500'],
        ]);

        // Simpan ke DB Server 2 (PC2)
        AlokasiPupuk::create([
            'user_id'           => auth()->id(),
            'kode_pupuk'        => $validated['kode_pupuk'],
            'jumlah_kg'         => $validated['jumlah_kg'],
            'provinsi'          => $validated['provinsi'],
            'status'            => 'pending',
            'tanggal_pengajuan' => now()->toDateString(),
            'catatan'           => $validated['catatan'] ?? null,
        ]);

        return redirect()->route('distribusi.index')
            ->with('success', 'Pengajuan alokasi pupuk berhasil dikirim!');
    }

    /**
     * Halaman Dashboard Sistem Terdistribusi
     * Mengambil data dari dua server database berbeda secara bersamaan:
     * - DB Server 1 (PC1): Data harga komoditas (HargaHarian, Komoditas)
     * - DB Server 2 (PC2): Data distribusi pupuk (DistribusiPupuk, Pupuk)
     */
    public function dashboard()
    {
        // QUERY DB SERVER 1 — PC1 (koneksi: mysql)
        $server1_host = config('database.connections.mysql.host');
        $server1_db   = config('database.connections.mysql.database');

        $komoditasList = Komoditas::where('status', 'aktif')
            ->orderBy('nama_komoditas')
            ->get();

        $hargaTerkini = HargaHarian::where('tanggal', '>=', now()->subDays(7)->toDateString())
            ->whereIn('provinsi', ['Jawa Tengah', 'Jawa Timur', 'Jawa Barat', 'Nasional'])
            ->orderBy('tanggal', 'desc')
            ->get()
            ->groupBy('slug_komoditas');

        // QUERY DB SERVER 2 — PC2 (koneksi: mysql_pupuk)
        $server2_host = config('database.connections.mysql_pupuk.host');
        $server2_db   = config('database.connections.mysql_pupuk.database');

        $pupukList = Pupuk::where('status', 'aktif')->get();

        $distribusiTerkini = DistribusiPupuk::with('pupuk')
            ->whereIn('provinsi', ['Jawa Tengah', 'Jawa Timur', 'Jawa Barat'])
            ->orderBy('tanggal_distribusi', 'desc')
            ->get()
            ->groupBy('provinsi');

        // Statistik gabungan dari kedua DB
        $totalKuotaTon    = DistribusiPupuk::sum('kuota_ton');
        $totalRealisasi   = DistribusiPupuk::sum('realisasi_ton');
        $persentaseTotal  = $totalKuotaTon > 0
            ? round(($totalRealisasi / $totalKuotaTon) * 100, 1)
            : 0;

        $totalKomoditas  = $komoditasList->count();
        $totalJenisPupuk = $pupukList->count();

        // Alokasi pengajuan user yang login (DB Server 2)
        $alokasiku = auth()->check()
            ? AlokasiPupuk::where('user_id', auth()->id())
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get()
            : collect();

        return view('distribusi.dashboard', compact(
            // Data DB1
            'komoditasList', 'hargaTerkini',
            'server1_host', 'server1_db',
            // Data DB2
            'pupukList', 'distribusiTerkini',
            'server2_host', 'server2_db',
            // Statistik gabungan
            'totalKuotaTon', 'totalRealisasi', 'persentaseTotal',
            'totalKomoditas', 'totalJenisPupuk',
            'alokasiku'
        ));
    }
}
