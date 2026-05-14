<?php
require_once __DIR__ . '/api/Server/koneksi.php';

// ============================================================
// OVERRIDE SLUG DAN OPSI UPDATE via argumen CLI
// Contoh: php import_csv.php beras --update
// ============================================================
$force_update = false;
if (isset($argv)) {
    $force_update = in_array('--update', $argv);
    // Hapus '--update' dari $argv agar tidak mengganggu urutan argumen slug
    $argv = array_diff($argv, ['--update']);
    $argv = array_values($argv);
}

$slug_override = isset($argv[1]) ? strtolower(trim($argv[1])) : null;

// ============================================================
// AMBIL DAFTAR SLUG VALID dari tabel komoditas
// ============================================================
$valid_slugs = [];
$res_slugs = mysqli_query($koneksi, "SELECT slug_id, nama FROM komoditas ORDER BY nama ASC");
if ($res_slugs) {
    while ($row = mysqli_fetch_assoc($res_slugs)) {
        $valid_slugs[$row['slug_id']] = $row['nama'];
    }
}

if (empty($valid_slugs)) {
    echo "Tidak dapat memuat daftar komoditas dari database.\n";
    echo "Pastikan tabel 'komoditas' ada dan berisi data.\n";
    exit;
}

echo "Komoditas terdaftar di database:\n";
foreach ($valid_slugs as $s => $nama) {
    echo "   - $s  ->  $nama\n";
}
echo "\n";

// ============================================================
// AUTO-DETECT: Cari semua file CSV di folder yang sama
// ============================================================
$csv_files = glob(__DIR__ . "/*.csv");

if (empty($csv_files)) {
    echo "Tidak ada file CSV yang ditemukan di folder ini.\n";
    exit;
}

echo "Ditemukan " . count($csv_files) . " file CSV:\n";
foreach ($csv_files as $f) {
    echo "   - " . basename($f) . "\n";
}
echo "\n";

if ($slug_override && count($csv_files) > 1) {
    echo "PERINGATAN: Argumen slug '$slug_override' diberikan, tapi ada " . count($csv_files) . " file CSV.\n";
    echo "Override hanya berlaku untuk 1 file. Melanjutkan dengan nama file...\n\n";
    $slug_override = null;
}

// ============================================================
// HELPER: Deteksi angka Romawi
// ============================================================
function isRomanNumeral(string $s): bool {
    return (bool) preg_match('/^M{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/i', trim($s));
}

foreach ($csv_files as $csv_file) {
    $filename  = basename($csv_file);
    $name_only = pathinfo($filename, PATHINFO_FILENAME);

    // ---------------------------------------------------------
    // TENTUKAN SLUG
    // ---------------------------------------------------------
    if ($slug_override) {
        $slug = $slug_override;
        echo "File    : $filename\n";
        echo "Slug    : $slug  <- (dari argumen CLI)\n";
    } else {
        $slug = strtolower(preg_replace('/^data_/', '', $name_only));
        $slug = preg_replace('/[\s\-]+/', '_', $slug);
        echo "File    : $filename\n";
        echo "Slug    : $slug  <- (dari nama file)\n";
    }

    // ---------------------------------------------------------
    // VALIDASI SLUG terhadap tabel komoditas
    // ---------------------------------------------------------
    if (!array_key_exists($slug, $valid_slugs)) {
        echo "ERROR: SLUG '$slug' TIDAK DIKENAL!\n";
        echo "Slug ini tidak ada di tabel komoditas.\n\n";
        echo "Pilihan yang tersedia:\n";
        foreach ($valid_slugs as $s => $nama) {
            echo "   php import_csv.php $s\n";
        }
        echo "\nFile '$filename' DILEWATI.\n\n";
        continue;
    }

    echo "Komoditas valid: {$valid_slugs[$slug]} (slug: $slug)\n";

    if (!file_exists($csv_file)) {
        echo "File tidak ditemukan, dilewati.\n\n";
        continue;
    }

    $handle = fopen($csv_file, "r");
    if ($handle === FALSE) {
        echo "Gagal membuka file, dilewati.\n\n";
        continue;
    }

    // ---------------------------------------------------------
    // BACA HEADER: kolom[0]=No, kolom[1]=Wilayah, kolom[2+]=Tanggal
    // ---------------------------------------------------------
    $header = fgetcsv($handle, 10000, ",");

    $dates             = [];
    $tanggal_untuk_cek = [];
    for ($i = 2; $i < count($header); $i++) {
        $tgl_raw  = str_replace(' ', '', trim($header[$i]));
        $date_obj = DateTime::createFromFormat('d/m/Y', $tgl_raw);
        if ($date_obj) {
            $format_tanggal      = $date_obj->format('Y-m-d');
            $dates[$i]           = $format_tanggal;
            $tanggal_untuk_cek[] = "'$format_tanggal'";
        }
    }

    echo "Total kolom tanggal valid: " . count($dates) . "\n";

    // ---------------------------------------------------------
    // CEK DUPLIKASI
    // ---------------------------------------------------------
    if (count($tanggal_untuk_cek) > 0) {
        $tanggal_in = implode(",", $tanggal_untuk_cek);
        $slug_safe  = mysqli_real_escape_string($koneksi, $slug);

        $cek_result = mysqli_query($koneksi,
            "SELECT COUNT(*) as total FROM harga_harian 
             WHERE slug_komoditas = '$slug_safe' 
             AND tanggal IN ($tanggal_in)"
        );
        $cek_row = mysqli_fetch_assoc($cek_result);

        if ($cek_row['total'] > 0) {
            echo "PERINGATAN: Data sudah ada! Ditemukan {$cek_row['total']} entri.\n";
            if ($force_update) {
                echo "Mode --update aktif: Melanjutkan import untuk memperbarui data...\n\n";
            } else {
                echo "Melewati import untuk menghindari duplikasi.\n";
                echo "Gunakan flag '--update' jika Anda ingin memperbarui data yang sudah ada.\n";
                echo "Menghapus file '$filename' karena data sudah ada di DB...\n";
                fclose($handle);
                unlink($csv_file);
                echo "\n";
                continue;
            }
        }
    }

    echo "Memulai import batch...\n\n";

    $batch_size       = 500;
    $values           = [];
    $total_entri      = 0;
    $baris_diproses   = 0;
    $errors           = 0;
    $current_provinsi = null; // Track provinsi saat ini untuk kab/kota

    while (($data = fgetcsv($handle, 10000, ",")) !== FALSE) {
        if (count($data) < 2) continue;

        // Kolom 0 = No (Roman/Arab), Kolom 1 = nama wilayah
        $no_col  = trim($data[0]);
        $wilayah_raw = trim($data[1]);

        if (empty($wilayah_raw)) continue;

        $wilayah = mysqli_real_escape_string($koneksi, $wilayah_raw);

        // Skip baris header yang lolos
        if ($wilayah === "Komoditas (Rp)" || $wilayah === "Wilayah") continue;

        // ---------------------------------------------------------
        // DETEKSI HIERARKI dari kolom No
        // Roman numeral = Provinsi, Arab = Kab/Kota, "I" + "Semua Provinsi" = Nasional
        // ---------------------------------------------------------
        if (isRomanNumeral($no_col)) {
            if (strtolower($wilayah_raw) === 'semua provinsi') {
                $tipe_wilayah  = 'nasional';
                $provinsi_induk = null;
            } else {
                $tipe_wilayah   = 'provinsi';
                $provinsi_induk = null;
                $current_provinsi = $wilayah_raw; // Simpan sebagai provinsi aktif
            }
        } elseif (preg_match('/^\d+$/', $no_col)) {
            $tipe_wilayah   = 'kab_kota';
            $provinsi_induk = $current_provinsi;
        } else {
            // Fallback: tidak diketahui, skip
            continue;
        }

        $tipe_safe     = mysqli_real_escape_string($koneksi, $tipe_wilayah);
        $prov_safe     = $provinsi_induk ? "'" . mysqli_real_escape_string($koneksi, $provinsi_induk) . "'" : "NULL";

        foreach ($dates as $index => $tanggal) {
            if (!isset($data[$index])) continue;

            $harga_raw = trim($data[$index]);
            if ($harga_raw === "" || $harga_raw === "-") continue;

            $harga = (int) preg_replace('/[^0-9]/', '', $harga_raw);

            if ($harga > 0) {
                $values[] = "('$slug', '$wilayah', '$tanggal', $harga, '$tipe_safe', $prov_safe)";
                $total_entri++;

                if (count($values) >= $batch_size) {
                    $query = "INSERT INTO harga_harian 
                                (slug_komoditas, wilayah, tanggal, harga, tipe_wilayah, provinsi_induk)
                              VALUES " . implode(',', $values) . "
                              ON DUPLICATE KEY UPDATE harga = VALUES(harga),
                                tipe_wilayah = VALUES(tipe_wilayah),
                                provinsi_induk = VALUES(provinsi_induk)";
                    if (!mysqli_query($koneksi, $query)) {
                        echo "Query error: " . mysqli_error($koneksi) . "\n";
                        $errors++;
                    }
                    $values = [];
                    echo "Terkirim $total_entri data...\n";
                }
            }
        }
        $baris_diproses++;
    }

    // Kirim sisa data
    if (count($values) > 0) {
        $query = "INSERT INTO harga_harian 
                    (slug_komoditas, wilayah, tanggal, harga, tipe_wilayah, provinsi_induk)
                  VALUES " . implode(',', $values) . "
                  ON DUPLICATE KEY UPDATE harga = VALUES(harga),
                    tipe_wilayah = VALUES(tipe_wilayah),
                    provinsi_induk = VALUES(provinsi_induk)";
        if (!mysqli_query($koneksi, $query)) {
            echo "Query error: " . mysqli_error($koneksi) . "\n";
            $errors++;
        }
    }

    fclose($handle);

    echo "\nImport selesai!\n";
    echo "   Baris diproses : $baris_diproses\n";
    echo "   Total data     : $total_entri\n";
    echo "   Error batch    : $errors\n\n";

    // ---------------------------------------------------------
    // VERIFIKASI
    // ---------------------------------------------------------
    echo "Memverifikasi data di database...\n";
    $slug_safe = mysqli_real_escape_string($koneksi, $slug);
    $result    = mysqli_query($koneksi,
        "SELECT 
            COUNT(*) AS total,
            SUM(tipe_wilayah = 'nasional') AS nasional,
            SUM(tipe_wilayah = 'provinsi') AS provinsi,
            SUM(tipe_wilayah = 'kab_kota') AS kab_kota
         FROM harga_harian WHERE slug_komoditas = '$slug_safe'"
    );
    $db_count = 0;

    if ($result) {
        $row      = mysqli_fetch_assoc($result);
        $db_count = (int) $row['total'];
        echo "   Total di DB  : $db_count baris\n";
        echo "   - nasional   : {$row['nasional']}\n";
        echo "   - provinsi   : {$row['provinsi']}\n";
        echo "   - kab/kota   : {$row['kab_kota']}\n";
    } else {
        echo "Gagal menjalankan query verifikasi.\n";
    }

    if ($db_count > 0 && $errors === 0) {
        if (unlink($csv_file)) {
            echo "File '$filename' berhasil dihapus.\n";
        } else {
            echo "Gagal menghapus file '$filename'. Hapus manual jika perlu.\n";
        }
    } else {
        echo "Verifikasi GAGAL (db_count=$db_count, errors=$errors).\n";
        echo "File '$filename' TIDAK dihapus. Silakan periksa dan import ulang.\n";
    }

    echo "\n";
}

echo "Semua file CSV telah diproses.\n";
?>
