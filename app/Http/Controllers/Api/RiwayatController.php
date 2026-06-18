<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\RiwayatUser;
use Illuminate\Support\Facades\Auth;

class RiwayatController extends Controller
{
    public function index(Request $request)
    {
        $userId = $request->user()->id;

        $riwayat = RiwayatUser::where('user_id', $userId)
            ->join('komoditas', 'riwayat_user.slug_komoditas', '=', 'komoditas.slug_komoditas')
            ->orderBy('waktu_pencarian', 'desc')
            ->take(5)
            ->get();

        $historyData = [];
        foreach ($riwayat as $row) {
            $latestDate = \App\Models\HargaHarian::where('slug_komoditas', $row->slug_komoditas)->max('tanggal');
            
            $hargaTerkiniAvg = 0;
            if ($latestDate) {
                $hargaTerkiniAvg = \App\Models\HargaHarian::where('slug_komoditas', $row->slug_komoditas)
                    ->where('tanggal', $latestDate)
                    ->avg('harga');
            }

            $harga = round($hargaTerkiniAvg);
            $hargaStr = $harga > 0 ? 'Rp ' . number_format($harga, 0, ',', '.') : 'Belum Ada Data';

            // Gunakan diffForHumans() via Carbon untuk format '10 menit lalu', '3 jam lalu' dsb.
            $waktu = \Carbon\Carbon::parse($row->waktu_pencarian)->diffForHumans();

            $historyData[] = [
                'icon'      => $row->icon,
                'commodity' => $row->nama_komoditas,
                'price'     => $hargaStr,
                'region'    => 'Rata-rata Nasional',
                'time'      => $waktu
            ];
        }

        $totalCount = RiwayatUser::where('user_id', $userId)->count();

        return response()->json([
            'status' => 'success',
            'data' => $historyData,
            'total_count' => $totalCount
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'slug' => ['required', 'string', 'exists:komoditas,slug_komoditas'],
        ]);

        $userId = $request->user()->id;

        RiwayatUser::create([
            'user_id'         => $userId,
            'slug_komoditas'  => $request->slug,
            'waktu_pencarian' => now(),
        ]);

        return response()->json(['status' => 'success']);
    }
}

