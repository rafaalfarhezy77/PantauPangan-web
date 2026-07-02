<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class PupukSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $jenisPupuk = [
            ['nama_pupuk' => 'Urea', 'deskripsi' => 'Pupuk Urea bersubsidi'],
            ['nama_pupuk' => 'NPK', 'deskripsi' => 'Pupuk NPK Phonska'],
            ['nama_pupuk' => 'ZA', 'deskripsi' => 'Pupuk ZA'],
            ['nama_pupuk' => 'SP-36', 'deskripsi' => 'Pupuk SP-36'],
            ['nama_pupuk' => 'Organik', 'deskripsi' => 'Pupuk Organik Granul'],
        ];

        foreach ($jenisPupuk as $jenis) {
            \App\Models\JenisPupuk::create($jenis);
        }

        $kabupaten = ['Kabupaten Malang', 'Kota Malang', 'Kota Batu', 'Kabupaten Pasuruan'];
        $jenisIds = \App\Models\JenisPupuk::pluck('id')->toArray();

        foreach ($kabupaten as $kab) {
            foreach ($jenisIds as $jenisId) {
                \App\Models\DistribusiPupuk::create([
                    'kabupaten_kota' => $kab,
                    'jenis_pupuk_id' => $jenisId,
                    'kuota' => rand(1000, 5000),
                    'tersalurkan' => rand(100, 1000),
                    'periode' => '2026',
                ]);
            }
        }
    }
}
