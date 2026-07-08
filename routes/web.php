<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\BerandaController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\KomoditasController;
use App\Http\Controllers\PetaController;
use App\Http\Controllers\BeritaController;
use App\Http\Controllers\PanenController;
use Illuminate\Support\Facades\Route;

// ── Rute Publik ──────────────────────────────────────────────────────────────
Route::get('/', [BerandaController::class, 'index'])->name('beranda');
Route::get('/berita', [BeritaController::class, 'index'])->name('berita');
Route::get('/berita/{id}', [BeritaController::class, 'show'])->name('berita.show');
Route::get('/peta', [PetaController::class, 'index'])->name('peta');
Route::get('/komoditas/{slug}', [KomoditasController::class, 'detail'])->name('komoditas.detail');

// ── Rute Auth (pengguna yang login) ──────────────────────────────────────────
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// ── Rute Petani ──────────────────────────────────────────────────────────────
Route::middleware(['auth', 'role:petani'])->group(function () {
    Route::get('/panen', [PanenController::class, 'index'])->name('panen');
    Route::get('/panen/tambah', [PanenController::class, 'create'])->name('panen.create');
    Route::post('/panen', [PanenController::class, 'store'])->name('panen.store');
    Route::delete('/panen/{hasilPanen}', [PanenController::class, 'destroy'])->name('panen.destroy');
    
    Route::get('/pupuk', [App\Http\Controllers\PupukController::class, 'index'])->name('pupuk');
});

// ── Rute Admin (Superadmin) ───────────────────────────────────────────────────
Route::middleware(['auth', 'role:superadmin'])->group(function () {
    Route::get('/admin', [App\Http\Controllers\Admin\AdminController::class, 'index'])->name('admin.dashboard');
    Route::get('/admin/users/tambah', [App\Http\Controllers\Admin\AdminController::class, 'create'])->name('admin.users.create');
    Route::post('/admin/users', [App\Http\Controllers\Admin\AdminController::class, 'store'])->name('admin.users.store');
    Route::get('/admin/users/{user}/edit', [App\Http\Controllers\Admin\AdminController::class, 'edit'])->name('admin.users.edit');
    Route::put('/admin/users/{user}', [App\Http\Controllers\Admin\AdminController::class, 'update'])->name('admin.users.update');
    Route::delete('/admin/users/{user}', [App\Http\Controllers\Admin\AdminController::class, 'destroy'])->name('admin.users.destroy');
});

// ── Rute Admin Komoditas ──────────────────────────────────────────────────────
Route::middleware(['auth', 'role:admin-komoditas,superadmin'])->group(function () {
    Route::get('/admin/komoditas', [App\Http\Controllers\Admin\KomoditasAdminController::class, 'index'])->name('admin.komoditas');
    Route::post('/admin/komoditas/import', [App\Http\Controllers\Admin\KomoditasAdminController::class, 'import'])->name('admin.komoditas.import');
});

// ── Rute Admin Berita ─────────────────────────────────────────────────────────
Route::middleware(['auth', 'role:admin-berita,superadmin'])->group(function () {
    Route::get('/admin/berita', [App\Http\Controllers\Admin\BeritaAdminController::class, 'index'])->name('admin.berita');
    Route::post('/admin/berita', [App\Http\Controllers\Admin\BeritaAdminController::class, 'store'])->name('admin.berita.store');
    Route::put('/admin/berita/{berita}', [App\Http\Controllers\Admin\BeritaAdminController::class, 'update'])->name('admin.berita.update');
    Route::delete('/admin/berita/{berita}', [App\Http\Controllers\Admin\BeritaAdminController::class, 'destroy'])->name('admin.berita.destroy');
});

// ── Rute Admin Pupuk ──────────────────────────────────────────────────────────
Route::middleware(['auth', 'role:admin-pupuk,superadmin'])->group(function () {
    Route::get('/admin/pupuk', [App\Http\Controllers\Admin\PupukAdminController::class, 'index'])->name('admin.pupuk');
    Route::post('/admin/pupuk', [App\Http\Controllers\Admin\PupukAdminController::class, 'store'])->name('admin.pupuk.store');
    Route::put('/admin/pupuk/{distribusiPupuk}', [App\Http\Controllers\Admin\PupukAdminController::class, 'update'])->name('admin.pupuk.update');
    Route::delete('/admin/pupuk/{distribusiPupuk}', [App\Http\Controllers\Admin\PupukAdminController::class, 'destroy'])->name('admin.pupuk.destroy');
});

require __DIR__.'/auth.php';
