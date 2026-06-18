<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class MigrateOldData extends Command
{
    protected $signature = 'data:migrate';
    protected $description = 'Migrate data from pantau-pangan to pantau_pangan_laravel';

    public function handle()
    {
        $this->info('Starting data migration from old database...');

        // Migrate Users
        $this->info('Migrating Users...');
        $oldUsers = DB::connection('mysql_old')->table('users')->get();
        foreach ($oldUsers as $user) {
            DB::table('users')->updateOrInsert(
                ['id' => $user->id],
                [
                    'username' => $user->username,
                    'email' => $user->email,
                    'password' => $user->password,
                    'role' => ($user->role === 'umum' ? 'lainnya' : $user->role),
                    'instansi_dinas' => $user->instansi_dinas,
                    // If old users didn't have created_at, Laravel handles it if we use Carbon or raw, but updateOrInsert handles nulls
                ]
            );
        }
        $this->info('Users migrated: ' . count($oldUsers));

        // Migrate Komoditas
        $this->info('Migrating Komoditas...');
        $oldKomoditas = DB::connection('mysql_old')->table('komoditas')->get();
        foreach ($oldKomoditas as $komoditas) {
            DB::table('komoditas')->updateOrInsert(
                ['slug_komoditas' => $komoditas->slug_id],
                [
                    'nama_komoditas' => $komoditas->nama,
                    'kategori' => $komoditas->kategori ?? 'Umum',
                    'icon' => $komoditas->icon,
                    'status' => 'aktif'
                ]
            );
        }
        $this->info('Komoditas migrated: ' . count($oldKomoditas));

        // Migrate Berita
        $this->info('Migrating Berita...');
        if (DB::connection('mysql_old')->getSchemaBuilder()->hasTable('berita')) {
            $oldBerita = DB::connection('mysql_old')->table('berita')->get();
            foreach ($oldBerita as $berita) {
                DB::table('berita')->updateOrInsert(
                    ['id' => $berita->id],
                    [
                        'judul' => $berita->judul ?? 'Berita Tanpa Judul',
                        'deskripsi' => $berita->deskripsi ?? $berita->isi ?? $berita->konten ?? 'Tidak ada deskripsi.',
                        'cover_image' => $berita->cover_image ?? $berita->gambar ?? null,
                        'tanggal' => $berita->tanggal ?? date('Y-m-d'),
                        'slug_komoditas' => $berita->slug_komoditas ?? null,
                        'sumber' => $berita->sumber ?? null,
                        'penulis' => $berita->penulis ?? null,
                    ]
                );
            }
            $this->info('Berita migrated: ' . count($oldBerita));
        }

        // Migrate Pantauan User
        $this->info('Migrating Pantauan User...');
        if (DB::connection('mysql_old')->getSchemaBuilder()->hasTable('pantauan_user')) {
            $oldPantauan = DB::connection('mysql_old')->table('pantauan_user')->get();
            foreach ($oldPantauan as $pantauan) {
                DB::table('pantauan_user')->updateOrInsert(
                    [
                        'user_id' => $pantauan->user_id,
                        'slug_komoditas' => $pantauan->slug_komoditas,
                    ],
                    [
                        'ditambahkan_pada' => $pantauan->ditambahkan_pada ?? now()
                    ]
                );
            }
            $this->info('Pantauan User migrated: ' . count($oldPantauan));
        }
        
        // Migrate Harga Harian
        $this->info('Migrating Harga Harian in bulk...');
        if (DB::connection('mysql_old')->getSchemaBuilder()->hasTable('harga_harian')) {
            $totalMigrated = 0;
            DB::connection('mysql_old')->table('harga_harian')->orderBy('tanggal')->chunk(500, function ($oldHargaChunk) use (&$totalMigrated) {
                $insertData = [];
                foreach ($oldHargaChunk as $harga) {
                    $insertData[] = [
                        'slug_komoditas' => $harga->slug_komoditas ?? $harga->slug_id ?? 'beras',
                        'provinsi' => $harga->wilayah ?? $harga->provinsi ?? 'Nasional',
                        'tanggal' => $harga->tanggal ?? date('Y-m-d'),
                        'harga' => $harga->harga ?? $harga->harga_rata_rata ?? 0
                    ];
                }
                // Menggunakan insertOrIgnore agar bulk insert sangat cepat dan tidak error jika duplikat
                DB::table('harga_harian')->insertOrIgnore($insertData);
                $totalMigrated += count($insertData);
                $this->info("Processed $totalMigrated records...");
            });
            $this->info('Harga Harian migrated: ' . $totalMigrated);
        }

        $this->info('Data migration completed successfully!');
    }
}

