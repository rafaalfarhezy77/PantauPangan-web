<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\KomoditasController;
use App\Http\Controllers\Api\HargaController;
use App\Http\Controllers\Api\BeritaController;
use App\Http\Controllers\Api\PantauanController;
use App\Http\Controllers\Api\RiwayatController;
use App\Http\Controllers\Api\PrediksiController;
use App\Http\Controllers\Api\InflasiController;

Route::prefix('v1')->group(function () {

    // ── Public Endpoints ──────────────────────────────────────────────
    Route::get('/komoditas',                  [KomoditasController::class, 'index']);
    Route::get('/komoditas/{slug}',           [KomoditasController::class, 'show']);

    Route::get('/harga',                      [HargaController::class, 'index']);
    Route::get('/harga/provinsi',             [HargaController::class, 'provinsi']);
    Route::get('/harga/kab-kota',             [HargaController::class, 'kabKota']);
    Route::get('/harga/history/{slug}',       [HargaController::class, 'history']);
    Route::get('/harga/wilayah/{slug}',       [HargaController::class, 'wilayah']);
    Route::get('/harga/perbandingan/{slug}',  [HargaController::class, 'perbandingan']);

    Route::get('/berita',                     [BeritaController::class, 'index']);
    Route::get('/berita/{id}',                [BeritaController::class, 'show']);

    Route::get('/inflasi',                    [InflasiController::class, 'index']);

    Route::get('/prediksi',                   [PrediksiController::class, 'index']);

    // ── Authenticated Endpoints ───────────────────────────────────────
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/user',                   fn (Request $request) => $request->user());

        Route::get('/pantauan',               [PantauanController::class, 'index']);
        Route::post('/pantauan/toggle',       [PantauanController::class, 'toggle']);

        Route::get('/riwayat',                [RiwayatController::class, 'index']);
        Route::post('/riwayat',               [RiwayatController::class, 'store']);
        Route::get('/notifikasi',             [\App\Http\Controllers\Api\NotifikasiController::class, 'index']);
    });
});
