<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\HargaHarian;
use App\Models\ImportLog;
use App\Models\Komoditas;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class KomoditasAdminController extends Controller
{
    /**
     * Dashboard admin komoditas — tampilkan form import + riwayat
     */
    public function index()
    {
        $komoditas  = Komoditas::where('status', 'aktif')->orderBy('nama_komoditas')->get();
        $valid_slugs = $komoditas->pluck('nama_komoditas', 'slug_komoditas')->all();

        try {
            $import_logs = ImportLog::orderBy('created_at', 'desc')->take(10)->get()->toArray();
            $res_log     = true;
        } catch (\Exception $e) {
            $import_logs = [];
            $res_log     = false;
        }

        return view('admin.komoditas', compact('valid_slugs', 'import_logs', 'res_log'));
    }

    /**
     * Proses upload CSV/XLSX dan simpan ke DB
     * Format CSV: kolom No, Wilayah, tanggal (dd/mm/yyyy)...
     */
    public function import(Request $request)
    {
        $request->validate([
            'slug_komoditas' => ['required', 'string', 'exists:komoditas,slug_komoditas'],
            'tanggal_upload' => ['required', 'date'],
            'csv_file'       => ['required', 'file', 'mimes:csv,txt,xlsx', 'max:10240'],
        ]);

        $slug        = $request->slug_komoditas;
        $tanggal     = $request->tanggal_upload;
        $forceUpdate = $request->boolean('force_update');
        $file        = $request->file('csv_file');

        // Cek duplikat (jika tidak force update)
        if (!$forceUpdate) {
            $existing = HargaHarian::where('slug_komoditas', $slug)
                ->where('tanggal', $tanggal)
                ->exists();

            if ($existing) {
                return response()->json([
                    'success'   => false,
                    'duplicate' => true,
                    'message'   => "Data untuk komoditas '{$slug}' pada tanggal {$tanggal} sudah ada.",
                    'hint'      => 'Aktifkan opsi "Timpa data lama" jika ingin menggantikan data yang sudah ada.',
                ]);
            }
        }

        // Parse CSV
        $content = file_get_contents($file->getRealPath());

        // Handle BOM UTF-8
        $content = preg_replace('/^\xEF\xBB\xBF/', '', $content);
        $lines   = array_filter(explode("\n", str_replace("\r\n", "\n", $content)));
        $lines   = array_values($lines);

        if (count($lines) < 2) {
            return response()->json([
                'success' => false,
                'message' => 'File CSV kosong atau format tidak valid.',
            ]);
        }

        // Baris pertama = header (No, Wilayah, dd/mm/yyyy, ...)
        $header = str_getcsv(array_shift($lines));

        // Temukan kolom tanggal yang cocok
        $tanggalCols = [];
        foreach ($header as $idx => $col) {
            if ($idx < 2) continue; // skip No dan Wilayah
            // Parse tanggal dari header
            $col = trim($col);
            $parsed = \DateTime::createFromFormat('d/m/Y', $col)
                ?? \DateTime::createFromFormat('d/m/y', $col);

            if ($parsed) {
                $tanggalCols[$idx] = $parsed->format('Y-m-d');
            }
        }

        if (empty($tanggalCols)) {
            // Fallback: gunakan tanggal yang dipilih user untuk semua kolom harga
            foreach ($header as $idx => $col) {
                if ($idx < 2) continue;
                $tanggalCols[$idx] = $tanggal;
            }
        }

        $insertData    = [];
        $totalEntri    = 0;
        $dbNasional    = 0;
        $dbProvinsi    = 0;

        foreach ($lines as $line) {
            $cols   = str_getcsv(trim($line));
            if (count($cols) < 3) continue;

            $wilayah = trim($cols[1] ?? '');
            if (empty($wilayah) || strtolower($wilayah) === 'wilayah') continue;

            foreach ($tanggalCols as $colIdx => $tgl) {
                $rawHarga = trim($cols[$colIdx] ?? '');
                if ($rawHarga === '' || $rawHarga === '-') continue;

                // Bersihkan harga: hapus titik pemisah ribuan
                $harga = (int) str_replace(['.', ',', ' '], ['', '', ''], $rawHarga);
                if ($harga <= 0) continue;

                // Tentukan apakah wilayah ini Nasional, Provinsi, atau Kab/Kota
                // (Nomor romawi = Provinsi, angka arab = Kab/Kota, tanpa nomor = Nasional/khusus)
                $no    = trim($cols[0] ?? '');
                $level = $this->detectLevel($no, $wilayah);

                $insertData[] = [
                    'slug_komoditas' => $slug,
                    'provinsi'       => $wilayah,
                    'harga'          => $harga,
                    'tanggal'        => $tgl,
                    'created_at'     => now(),
                    'updated_at'     => now(),
                ];

                $totalEntri++;
                if ($level === 'nasional') $dbNasional++;
                elseif ($level === 'provinsi') $dbProvinsi++;
            }
        }

        // Bulk insert
        $chunks = array_chunk($insertData, 500);
        foreach ($chunks as $chunk) {
            if ($forceUpdate) {
                foreach ($chunk as $row) {
                    HargaHarian::updateOrCreate(
                        ['slug_komoditas' => $row['slug_komoditas'], 'provinsi' => $row['provinsi'], 'tanggal' => $row['tanggal']],
                        ['harga' => $row['harga']]
                    );
                }
            } else {
                DB::table('harga_harian')->insertOrIgnore($chunk);
            }
        }

        // Simpan log
        ImportLog::create([
            'slug_komoditas' => $slug,
            'filename'       => $file->getClientOriginalName(),
            'tanggal_upload' => $tanggal,
            'total_entri'    => $totalEntri,
            'uploaded_by'    => auth()->user()->username,
            'errors'         => 0,
        ]);

        return response()->json([
            'success'      => true,
            'message'      => "Berhasil mengimpor {$totalEntri} entri data komoditas '{$slug}'.",
            'total_entri'  => $totalEntri,
            'db_nasional'  => $dbNasional,
            'db_provinsi'  => $dbProvinsi,
            'db_kab_kota'  => $totalEntri - $dbNasional - $dbProvinsi,
        ]);
    }

    /**
     * Deteksi level wilayah berdasarkan kolom No
     */
    protected function detectLevel(string $no, string $wilayah): string
    {
        if (empty($no) || strtolower($wilayah) === 'nasional') return 'nasional';

        // Angka romawi = Provinsi
        if (preg_match('/^[IVXLCDM]+$/i', trim($no))) return 'provinsi';

        return 'kab_kota';
    }
}


