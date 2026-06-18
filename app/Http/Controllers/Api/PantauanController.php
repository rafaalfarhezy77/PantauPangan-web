<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HargaHarian;
use App\Models\Komoditas;
use App\Models\PantauanUser;
use Illuminate\Http\Request;

class PantauanController extends Controller
{
    /**
     * GET /api/v1/pantauan
     * Daftar pantauan komoditas user yang sedang login
     */
    public function index(Request $request)
    {
        $userId = $request->user()->id;

        $pantauan = PantauanUser::where('pantauan_user.user_id', $userId)
            ->join('komoditas', 'pantauan_user.slug_komoditas', '=', 'komoditas.slug_komoditas')
            ->orderBy('ditambahkan_pada', 'desc')
            ->get(['pantauan_user.*', 'komoditas.nama_komoditas', 'komoditas.icon', 'komoditas.kategori']);

        $watchlist = $pantauan->map(function ($row) {
            $latestDate = HargaHarian::where('slug_komoditas', $row->slug_komoditas)->max('tanggal');

            if (!$latestDate) {
                return [
                    'id'      => $row->slug_komoditas,
                    'icon'    => $row->icon,
                    'name'    => $row->nama_komoditas,
                    'region'  => 'Nasional',
                    'price'   => 0,
                    'change'  => 0,
                    'isUp'    => false,
                    'tanggal' => null,
                ];
            }

            // Hitung rata-rata harga di tanggal terbaru (sebagai representasi Nasional)
            $hargaTerkiniAvg = HargaHarian::where('slug_komoditas', $row->slug_komoditas)
                ->where('tanggal', $latestDate)
                ->avg('harga');

            // Hitung rata-rata harga di tanggal sebelumnya yang ada datanya
            $prevDate = HargaHarian::where('slug_komoditas', $row->slug_komoditas)
                ->where('tanggal', '<', $latestDate)
                ->max('tanggal');

            $hargaKemarinAvg = $prevDate
                ? HargaHarian::where('slug_komoditas', $row->slug_komoditas)
                    ->where('tanggal', $prevDate)
                    ->avg('harga')
                : $hargaTerkiniAvg;

            $harga   = round($hargaTerkiniAvg);
            $hargaH1 = round($hargaKemarinAvg);
            $change  = $hargaH1 > 0 ? round((($harga - $hargaH1) / $hargaH1) * 100, 2) : 0;

            return [
                'id'      => $row->slug_komoditas,
                'icon'    => $row->icon,
                'name'    => $row->nama_komoditas,
                'region'  => 'Nasional',
                'price'   => $harga,
                'change'  => $change,
                'isUp'    => $change >= 0,
                'tanggal' => $latestDate,
            ];
        });

        return response()->json([
            'status' => 'success',
            'data'   => $watchlist,
        ]);
    }

    /**
     * POST /api/v1/pantauan/toggle
     * Toggle pantauan (tambah/hapus) untuk satu komoditas
     * Body: { "slug_komoditas": "beras" }
     */
    public function toggle(Request $request)
    {
        $request->validate([
            'slug' => ['required', 'string', 'exists:komoditas,slug_komoditas'],
        ]);

        $userId = $request->user()->id;
        $slug   = $request->slug;

        $existing = PantauanUser::where('user_id', $userId)
            ->where('slug_komoditas', $slug)
            ->first();

        if ($existing) {
            $existing->delete();
            $action = 'removed';
        } else {
            PantauanUser::create([
                'user_id'         => $userId,
                'slug_komoditas'  => $slug,
            ]);
            $action = 'added';
        }

        return response()->json([
            'status' => 'success',
            'action' => $action,
            'slug'   => $slug,
        ]);
    }
}
