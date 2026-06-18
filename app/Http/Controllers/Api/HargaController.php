<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HargaHarian;
use App\Models\Komoditas;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class HargaController extends Controller
{
    /**
     * GET /api/v1/harga
     * Data harga komoditas dengan filter slug_komoditas, provinsi, periode
     */
    public function index(Request $request)
    {
        // Buat cache key dari semua parameter filter
        $cacheKey = 'harga_index:' . md5(json_encode($request->all()));

        $data = Cache::remember($cacheKey, now()->addHours(6), function () use ($request) {
            $query = HargaHarian::query();

            if ($request->has('slug_komoditas')) {
                $query->where('slug_komoditas', $request->slug_komoditas);
            }

            if ($request->has('provinsi')) {
                $query->where('provinsi', $request->provinsi);
            }

            if ($request->has('dari')) {
                $query->where('tanggal', '>=', $request->dari);
            }

            if ($request->has('sampai')) {
                $query->where('tanggal', '<=', $request->sampai);
            }

            // Default: 30 hari terakhir jika tidak ada filter tanggal
            if (!$request->has('dari') && !$request->has('sampai')) {
                $query->where('tanggal', '>=', now()->subDays(30)->toDateString());
            }

            return $query->orderBy('tanggal', 'desc')->limit(500)->get()->toArray();
        });

        return response()->json([
            'status' => 'success',
            'total'  => count($data),
            'data'   => $data,
        ]);
    }

    /**
     * GET /api/v1/harga/provinsi
     * Daftar PROVINSI saja (tanpa Kab./Kota) yang tersedia di data harga.
     * Filter: nilai yang tidak diawali "Kab. " atau "Kota ".
     */
    public function provinsi()
    {
        // Data provinsi sangat jarang berubah — cache 24 jam
        $provinsi = Cache::remember('harga_provinsi_list', now()->addHours(24), function () {
            $semua = HargaHarian::distinct()
                ->orderBy('provinsi')
                ->pluck('provinsi');

            return $semua->filter(function ($nama) {
                $nama = trim($nama);
                return $nama !== ''
                    && $nama !== 'Semua Provinsi'
                    && !str_starts_with($nama, 'Kab. ')
                    && !str_starts_with($nama, 'Kota ');
            })->values()->toArray();
        });

        return response()->json([
            'status' => 'success',
            'data'   => $provinsi,
        ]);
    }

    /**
     * GET /api/v1/harga/perbandingan/{slug}
     * Perbandingan harga antar provinsi untuk satu komoditas
     */
    public function perbandingan(string $slug)
    {
        $cacheKey = 'harga_perbandingan:' . $slug;

        $result = Cache::remember($cacheKey, now()->addHours(6), function () use ($slug) {
            $all = HargaHarian::where('slug_komoditas', $slug)
                ->orderBy('tanggal', 'desc')
                ->get(['provinsi', 'harga', 'tanggal']);

            $wilayahTerkini = [];
            foreach ($all as $row) {
                if (!isset($wilayahTerkini[$row->provinsi])) {
                    $wilayahTerkini[$row->provinsi] = [
                        'provinsi' => $row->provinsi,
                        'harga'    => $row->harga,
                        'tanggal'  => $row->tanggal
                    ];
                }
            }

            $data           = collect(array_values($wilayahTerkini))->sortByDesc('harga')->values()->toArray();
            $tanggalTerkini = collect(array_values($wilayahTerkini))->max('tanggal');

            return compact('data', 'tanggalTerkini');
        });

        return response()->json([
            'status'  => 'success',
            'slug'    => $slug,
            'tanggal' => $result['tanggalTerkini'],
            'data'    => $result['data'],
        ]);
    }

    /**
     * GET /api/v1/harga/history/{slug}
     * Riwayat harga sebuah komoditas (untuk chart)
     * Query params: provinsi (default: Nasional), days (default: 90)
     */
    public function history(string $slug)
    {
        $provinsi = request('provinsi', 'Nasional');
        $days     = (int) request('days', 90);

        // Cache key unik per komoditas + wilayah + periode
        $cacheKey = 'harga_history:' . $slug . ':' . str_replace(' ', '_', strtolower($provinsi)) . ':d' . $days;

        $data = Cache::remember($cacheKey, now()->addHours(6), function () use ($slug, $provinsi, $days) {
            return HargaHarian::where('slug_komoditas', $slug)
                ->where('provinsi', $provinsi)
                ->where('tanggal', '>=', now()->subDays($days)->toDateString())
                ->orderBy('tanggal')
                ->get(['tanggal', 'harga'])->toArray();
        });

        return response()->json([
            'status' => 'success',
            'slug'   => $slug,
            'data'   => $data,
        ]);
    }

    /**
     * Helper: tentukan apakah suatu nama wilayah adalah kab/kota atau provinsi
     */
    private function tipeWilayah(string $nama): string
    {
        if (str_starts_with($nama, 'Kab. ') || str_starts_with($nama, 'Kota ')) {
            return 'kab_kota';
        }
        return 'provinsi';
    }

    /**
     * Helper: daftar nama provinsi Indonesia yang dikenal.
     * Digunakan untuk mencocokkan kab/kota ke provinsi induknya.
     */
    private static function daftarProvinsi(): array
    {
        return [
            'Aceh', 'Bali', 'Banten', 'Bengkulu', 'DI Yogyakarta', 'DKI Jakarta',
            'Gorontalo', 'Jambi', 'Jawa Barat', 'Jawa Tengah', 'Jawa Timur',
            'Kalimantan Barat', 'Kalimantan Selatan', 'Kalimantan Tengah',
            'Kalimantan Timur', 'Kalimantan Utara', 'Kepulauan Bangka Belitung',
            'Kepulauan Riau', 'Lampung', 'Maluku', 'Maluku Utara',
            'Nusa Tenggara Barat', 'Nusa Tenggara Timur', 'Papua', 'Papua Barat',
            'Riau', 'Sulawesi Barat', 'Sulawesi Selatan', 'Sulawesi Tengah',
            'Sulawesi Tenggara', 'Sulawesi Utara', 'Sumatera Barat',
            'Sumatera Selatan', 'Sumatera Utara',
        ];
    }

    /**
     * Mapping kab/kota ke provinsi berdasarkan data di DB.
     * Karena tidak ada kolom relasi, kita gunakan mapping yang dibuat dari data aktual.
     */
    private static function mappingKabKotaKeProvinsi(): array
    {
        return [
            // Aceh
            'Kota Banda Aceh'    => 'Aceh',
            'Kota Lhokseumawe'   => 'Aceh',
            'Kota Meulaboh'      => 'Aceh',

            // Bali
            'Kab. Badung'        => 'Bali',
            'Kab. Tabanan'       => 'Bali',
            'Kota Denpasar'      => 'Bali',
            'Kota Singaraja'     => 'Bali',

            // Banten
            'Kota Cilegon'       => 'Banten',
            'Kota Serang'        => 'Banten',
            'Kota Tangerang'     => 'Banten',

            // Bengkulu
            'Kota Bengkulu'      => 'Bengkulu',
            'Kota Lubuk Linggau' => 'Bengkulu',

            // DI Yogyakarta
            'Kota Yogyakarta'    => 'DI Yogyakarta',

            // DKI Jakarta
            'Kota Jakarta Pusat' => 'DKI Jakarta',

            // Gorontalo
            'Kab. Gorontalo'     => 'Gorontalo',
            'Kota Gorontalo'     => 'Gorontalo',

            // Jambi
            'Kab. Bungo'         => 'Jambi',
            'Kota Jambi'         => 'Jambi',
            'Kota Tembilahan'    => 'Jambi',

            // Jawa Barat
            'Kab. Cirebon'       => 'Jawa Barat',
            'Kab. Tasikmalaya'   => 'Jawa Barat',
            'Kota Bandung'       => 'Jawa Barat',
            'Kota Bekasi'        => 'Jawa Barat',
            'Kota Bogor'         => 'Jawa Barat',
            'Kota Cirebon'       => 'Jawa Barat',
            'Kota Depok'         => 'Jawa Barat',
            'Kota Sukabumi'      => 'Jawa Barat',

            // Jawa Tengah
            'Kab. Banyumas'      => 'Jawa Tengah',
            'Kab. Boyolali'      => 'Jawa Tengah',
            'Kab. Cilacap'       => 'Jawa Tengah',
            'Kab. Karanganyar'   => 'Jawa Tengah',
            'Kab. Klaten'        => 'Jawa Tengah',
            'Kab. Kudus'         => 'Jawa Tengah',
            'Kab. Sragen'        => 'Jawa Tengah',
            'Kab. Sukoharjo'     => 'Jawa Tengah',
            'Kab. Wonogiri'      => 'Jawa Tengah',
            'Kota Semarang'      => 'Jawa Tengah',
            'Kota Surakarta (Solo)' => 'Jawa Tengah',
            'Kota Tegal'         => 'Jawa Tengah',

            // Jawa Timur
            'Kab. Banyuwangi'    => 'Jawa Timur',
            'Kota Madiun'        => 'Jawa Timur',
            'Kab. Jember'        => 'Jawa Timur',
            'Kab. Sumenep'       => 'Jawa Timur',
            'Kota Blitar'        => 'Jawa Timur',
            'Kota Kediri'        => 'Jawa Timur',
            'Kota Malang'        => 'Jawa Timur',
            'Kota Probolinggo'   => 'Jawa Timur',
            'Kota Surabaya'      => 'Jawa Timur',

            // Kalimantan Barat
            'Kab. Sintang'       => 'Kalimantan Barat',
            'Kota Pontianak'     => 'Kalimantan Barat',
            'Kota Singkawang'    => 'Kalimantan Barat',

            // Kalimantan Selatan
            'Kab. Kotabaru'      => 'Kalimantan Selatan',
            'Kota Banjarmasin'   => 'Kalimantan Selatan',
            'Kota Tanjung'       => 'Kalimantan Selatan',

            // Kalimantan Tengah
            'Kota Palangkaraya'  => 'Kalimantan Tengah',
            'Kota Sampit'        => 'Kalimantan Tengah',

            // Kalimantan Timur
            'Kota Balikpapan'    => 'Kalimantan Timur',
            'Kota Bontang'       => 'Kalimantan Timur',
            'Kota Samarinda'     => 'Kalimantan Timur',

            // Kalimantan Utara
            'Kab. Bulungan'      => 'Kalimantan Utara',
            'Kab. Nunukan'       => 'Kalimantan Utara',
            'Kota Tarakan'       => 'Kalimantan Utara',

            // Kepulauan Bangka Belitung
            'Kota Pangkal Pinang'   => 'Kepulauan Bangka Belitung',
            'Kota Tanjung Pandan'   => 'Kepulauan Bangka Belitung',

            // Kepulauan Riau
            'Kota Batam'            => 'Kepulauan Riau',
            'Kota Tanjung Pinang'   => 'Kepulauan Riau',

            // Lampung
            'Kota Bandar Lampung'   => 'Lampung',
            'Kota Metro'            => 'Lampung',

            // Maluku
            'Kota Ambon'            => 'Maluku',
            'Kota Tual'             => 'Maluku',

            // Maluku Utara
            'Kota Ternate'          => 'Maluku Utara',

            // Nusa Tenggara Barat
            'Kab. Lombok Timur'     => 'Nusa Tenggara Barat',
            'Kab. Sumbawa'          => 'Nusa Tenggara Barat',
            'Kota Bima'             => 'Nusa Tenggara Barat',
            'Kota Mataram'          => 'Nusa Tenggara Barat',

            // Nusa Tenggara Timur
            'Kab. Sumba Timur'      => 'Nusa Tenggara Timur',
            'Kota Kupang'           => 'Nusa Tenggara Timur',
            'Kota Maumere'          => 'Nusa Tenggara Timur',

            // Papua
            'Kab. Jayawijaya'       => 'Papua',
            'Kab. Merauke'          => 'Papua',
            'Kab. Mimika'           => 'Papua',
            'Kab. Nabire'           => 'Papua',
            'Kota Jayapura'         => 'Papua',

            // Papua Barat
            'Kab. Manokwari'        => 'Papua Barat',
            'Kota Sorong'           => 'Papua Barat',

            // Riau
            'Kota Dumai'            => 'Riau',
            'Kota Pekanbaru'        => 'Riau',

            // Sulawesi Barat
            'Kab. Majene'           => 'Sulawesi Barat',
            'Kab. Polewali Mandar'  => 'Sulawesi Barat',
            'Kota Mamuju'           => 'Sulawesi Barat',

            // Sulawesi Selatan
            'Kab. Bulukumba'        => 'Sulawesi Selatan',
            'Kota Makassar'         => 'Sulawesi Selatan',
            'Kota Palopo'           => 'Sulawesi Selatan',
            'Kota Parepare'         => 'Sulawesi Selatan',
            'Kota Watampone'        => 'Sulawesi Selatan',

            // Sulawesi Tengah
            'Kab. Banggai'          => 'Sulawesi Tengah',
            'Kota Palu'             => 'Sulawesi Tengah',

            // Sulawesi Tenggara
            'Kota Bau-Bau'          => 'Sulawesi Tenggara',
            'Kota Kendari'          => 'Sulawesi Tenggara',

            // Sulawesi Utara
            'Kota Kotamobagu'       => 'Sulawesi Utara',
            'Kota Manado'           => 'Sulawesi Utara',

            // Sumatera Barat
            'Kota Bukittinggi'      => 'Sumatera Barat',
            'Kota Padang'           => 'Sumatera Barat',

            // Sumatera Selatan
            'Kota Palembang'        => 'Sumatera Selatan',

            // Sumatera Utara
            'Kota Gunung Sitoli'    => 'Sumatera Utara',
            'Kota Medan'            => 'Sumatera Utara',
            'Kota Padang Sidempuan' => 'Sumatera Utara',
            'Kota Pematang Siantar' => 'Sumatera Utara',
            'Kota Sibolga'          => 'Sumatera Utara',
        ];
    }

    /**
     * GET /api/v1/harga/wilayah/{slug}
     * Harga satu komoditas di semua wilayah, dengan tipe_wilayah yang benar
     * Digunakan untuk fitur "Cari Harga" di frontend
     */
    public function wilayah(string $slug)
    {
        $cacheKey = 'harga_wilayah:' . $slug;

        $cached = Cache::remember($cacheKey, now()->addHours(6), function () use ($slug) {
            // Ambil semua data diurutkan dari yang terbaru
            // Pendekatan O(N) pass ini memastikan kita mendapat harga terkini setiap provinsi
            // tidak peduli kapan tanggal update terakhir dari provinsi tersebut.
            $allData = HargaHarian::where('slug_komoditas', $slug)
                ->orderBy('tanggal', 'desc')
                ->get(['provinsi', 'harga', 'tanggal']);

            if ($allData->isEmpty()) {
                return ['tanggal' => null, 'data' => collect()];
            }

            $wilayahData = [];

            foreach ($allData as $row) {
                $prov = $row->provinsi;
                if (!isset($wilayahData[$prov])) {
                    $wilayahData[$prov] = [
                        'terkini' => $row,
                        'kemarin' => null
                    ];
                } else if ($wilayahData[$prov]['kemarin'] === null && $row->tanggal !== $wilayahData[$prov]['terkini']->tanggal) {
                    $wilayahData[$prov]['kemarin'] = $row;
                }
            }

            $result = collect($wilayahData)->map(function ($item, $provinsi) {
                $terkini = $item['terkini'];
                $kemarin = $item['kemarin'];

                $hargaKemarin = $kemarin ? $kemarin->harga : $terkini->harga;
                $perubahan    = $hargaKemarin > 0
                    ? round((($terkini->harga - $hargaKemarin) / $hargaKemarin) * 100, 2)
                    : 0;

                $tipe = $this->tipeWilayah($provinsi);

                // Cari provinsi induk untuk kab/kota
                $provinsiInduk = $tipe === 'kab_kota'
                    ? (self::mappingKabKotaKeProvinsi()[$provinsi] ?? null)
                    : $provinsi;

                return [
                    'wilayah'        => $provinsi,
                    'tipe_wilayah'   => $tipe,
                    'provinsi'       => $provinsiInduk ?? $provinsi,
                    'harga'          => $terkini->harga,
                    'tanggal'        => $terkini->tanggal,
                    'perubahan'      => $perubahan,
                ];
            });

            // Urutkan default: provinsi yang ada datanya di atas, baru kab/kota
            $result = $result->sortBy(function ($item) {
                return ($item['tipe_wilayah'] === 'provinsi' ? 0 : 1) . '-' . $item['wilayah'];
            })->values()->toArray();

            return [
                'tanggal' => $allData->isEmpty() ? null : $allData->first()->tanggal,
                'data'    => $result,
            ];
        });

        return response()->json([
            'status'  => 'success',
            'slug'    => $slug,
            'tanggal' => $cached['tanggal'],
            'data'    => $cached['data'],
        ]);
    }

    /**
     * GET /api/v1/harga/kab-kota
     * Daftar kab/kota yang tersedia untuk provinsi dan komoditas tertentu.
     * Prefix "Kab. " dan "Kota " di kolom provinsi digunakan sebagai kab/kota.
     * Query params: provinsi (required), slug (optional)
     */
    public function kabKota(Request $request)
    {
        $provinsi = $request->input('provinsi');
        $slug     = $request->input('slug');

        if (!$provinsi) {
            return response()->json(['error' => 'Parameter provinsi wajib diisi.'], 422);
        }

        $mapping = self::mappingKabKotaKeProvinsi();

        // Ambil semua entri yang merupakan kab/kota dari provinsi yang diminta
        $kabKotaDiProvinsi = collect($mapping)
            ->filter(fn($prov) => $prov === $provinsi)
            ->keys()
            ->values();

        // Filter hanya yang ada datanya di DB (dan opsional filter per slug komoditas)
        $query = HargaHarian::whereIn('provinsi', $kabKotaDiProvinsi)
            ->distinct()
            ->orderBy('provinsi');

        if ($slug) {
            $query->where('slug_komoditas', $slug);
        }

        $adaData = $query->pluck('provinsi')->unique()->values();

        $result = $adaData->map(fn($nama) => ['nama' => $nama]);

        return response()->json([
            'status'   => 'success',
            'kab_kota' => $result,
        ]);
    }
}

