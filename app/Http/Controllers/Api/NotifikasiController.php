<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HargaHarian;
use App\Models\PantauanUser;
use Illuminate\Http\Request;

class NotifikasiController extends Controller
{
    /**
     * GET /api/v1/notifikasi
     * Mengembalikan notifikasi yang di-generate secara dinamis
     * berdasarkan komoditas di daftar Pantauan User.
     */
    public function index(Request $request)
    {
        $userId = $request->user()->id;

        // Ambil komoditas pantauan user
        $pantauan = PantauanUser::where('pantauan_user.user_id', $userId)
            ->join('komoditas', 'pantauan_user.slug_komoditas', '=', 'komoditas.slug_komoditas')
            ->get(['komoditas.slug_komoditas', 'komoditas.nama_komoditas']);

        $notifikasi = [];

        foreach ($pantauan as $row) {
            $latestDate = HargaHarian::where('slug_komoditas', $row->slug_komoditas)->max('tanggal');
            if (!$latestDate) continue;

            $hargaTerkiniAvg = HargaHarian::where('slug_komoditas', $row->slug_komoditas)
                ->where('tanggal', $latestDate)
                ->avg('harga');

            $prevDate = HargaHarian::where('slug_komoditas', $row->slug_komoditas)
                ->where('tanggal', '<', $latestDate)
                ->max('tanggal');

            if (!$prevDate) continue;

            $hargaKemarinAvg = HargaHarian::where('slug_komoditas', $row->slug_komoditas)
                ->where('tanggal', $prevDate)
                ->avg('harga');

            $harga = round($hargaTerkiniAvg);
            $hargaH1 = round($hargaKemarinAvg);

            if ($hargaH1 > 0) {
                $change = round((($harga - $hargaH1) / $hargaH1) * 100, 2);

                if ($change > 0) {
                    $notifikasi[] = [
                        'dot'    => 'bg-red-500',
                        'text'   => "<strong>{$row->nama_komoditas}</strong> naik <strong>{$change}%</strong> hari ini.",
                        'time'   => 'Hari ini',
                        'unread' => true
                    ];
                } elseif ($change < 0) {
                    $absChange = abs($change);
                    $notifikasi[] = [
                        'dot'    => 'bg-green-500',
                        'text'   => "<strong>{$row->nama_komoditas}</strong> turun <strong>{$absChange}%</strong> — peluang beli.",
                        'time'   => 'Hari ini',
                        'unread' => true
                    ];
                }
            }
        }

        // Tambahkan satu notifikasi statis agar tidak kosong jika tidak ada perubahan
        if (count($notifikasi) === 0) {
            $notifikasi[] = [
                'dot'    => 'bg-gray-300',
                'text'   => 'Semua komoditas pantauanmu terpantau stabil hari ini.',
                'time'   => 'Baru saja',
                'unread' => false
            ];
        }

        return response()->json([
            'status' => 'success',
            'data'   => $notifikasi,
        ]);
    }
}
