<?php
require_once __DIR__ . '/api/Server/koneksi.php';

$csv_file = __DIR__ . "/data_beras.csv"; 

if (file_exists($csv_file)) {
    if (($handle = fopen($csv_file, "r")) !== FALSE) {
        $header = fgetcsv($handle, 10000, ",");
        
        $dates = [];
        for ($i = 1; $i < count($header); $i++) {
            $tgl_raw = str_replace(' ', '', trim($header[$i]));
            $date_obj = DateTime::createFromFormat('d/m/Y', $tgl_raw);
            if ($date_obj) {
                $dates[$i] = $date_obj->format('Y-m-d');
            }
        }

        echo "🚀 Memulai import super cepat (Batch Mode)...\n";
        
        $batch_size = 500; // Kirim 500 data sekaligus per paket
        $values = [];
        $total_entri = 0;
        $baris_wilayah = 0;

        while (($data = fgetcsv($handle, 10000, ",")) !== FALSE) {
            if (count($data) < 1) continue;

            $wilayah = mysqli_real_escape_string($koneksi, trim($data[0]));
            if (empty($wilayah) || $wilayah == "Wilayah" || $wilayah == "Komoditas (Rp)") continue;

            foreach ($dates as $index => $tanggal) {
                if (!isset($data[$index])) continue;

                $harga_raw = trim($data[$index]);
                if ($harga_raw === "" || $harga_raw === "-") continue;

                $harga = (int) preg_replace('/[^0-9]/', '', $harga_raw);
                
                if ($harga > 0) {
                    // Masukkan ke array batch
                    $values[] = "('beras', '$wilayah', '$tanggal', $harga)";
                    $total_entri++;

                    // Jika batch sudah penuh, eksekusi!
                    if (count($values) >= $batch_size) {
                        $query = "INSERT INTO harga_harian (slug_komoditas, wilayah, tanggal, harga) 
                                  VALUES " . implode(',', $values) . " 
                                  ON DUPLICATE KEY UPDATE harga = VALUES(harga)";
                        mysqli_query($koneksi, $query);
                        $values = []; // Kosongkan batch
                        echo "📦 Terkirim $total_entri data...\n";
                    }
                }
            }
            $baris_wilayah++;
        }

        // Kirim sisa data yang belum mencapai batch_size
        if (count($values) > 0) {
            $query = "INSERT INTO harga_harian (slug_komoditas, wilayah, tanggal, harga) 
                      VALUES " . implode(',', $values) . " 
                      ON DUPLICATE KEY UPDATE harga = VALUES(harga)";
            mysqli_query($koneksi, $query);
        }

        fclose($handle);
        echo "\n✅ SELESAI!\n";
        echo "Berhasil memproses $baris_wilayah wilayah.\n";
        echo "Total $total_entri data harga harian telah masuk ke TiDB Cloud.";
    } else {
        echo "Gagal membuka file CSV.";
    }
} else {
    echo "File CSV tidak ditemukan.";
}
?>
