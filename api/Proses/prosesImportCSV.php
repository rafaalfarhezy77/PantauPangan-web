<?php
require __DIR__ . '/../Server/koneksi.php';
session_start();

header('Content-Type: application/json');

// ── Keamanan: hanya admin-komoditas atau superadmin ──
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Sesi tidak valid. Silakan login kembali.']);
    exit;
}

$role = strtolower(trim($_SESSION['role']));
if (!in_array($role, ['admin-komoditas', 'superadmin'])) {
    echo json_encode(['success' => false, 'message' => 'Akses ditolak. Hanya Admin Komoditas yang dapat mengimpor data.']);
    exit;
}

// ── Validasi method ──
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Metode tidak diizinkan.']);
    exit;
}

// ── Validasi input ──
if (empty($_POST['slug_komoditas'])) {
    echo json_encode(['success' => false, 'message' => 'Slug komoditas wajib dipilih.']);
    exit;
}
if (empty($_POST['tanggal_upload'])) {
    echo json_encode(['success' => false, 'message' => 'Tanggal upload wajib diisi.']);
    exit;
}
if (!isset($_FILES['csv_file']) || $_FILES['csv_file']['error'] !== UPLOAD_ERR_OK) {
    $upload_errors = [
        UPLOAD_ERR_INI_SIZE   => 'File terlalu besar (melebihi batas server).',
        UPLOAD_ERR_FORM_SIZE  => 'File terlalu besar (melebihi batas form).',
        UPLOAD_ERR_PARTIAL    => 'File hanya terupload sebagian.',
        UPLOAD_ERR_NO_FILE    => 'Tidak ada file yang dipilih.',
        UPLOAD_ERR_NO_TMP_DIR => 'Folder sementara tidak ditemukan.',
        UPLOAD_ERR_CANT_WRITE => 'Gagal menulis file ke disk.',
        UPLOAD_ERR_EXTENSION  => 'Upload diblokir oleh ekstensi PHP.',
    ];
    $err_code = $_FILES['csv_file']['error'] ?? UPLOAD_ERR_NO_FILE;
    echo json_encode(['success' => false, 'message' => $upload_errors[$err_code] ?? 'Upload gagal.']);
    exit;
}

// ── Validasi ekstensi file ──
$filename  = $_FILES['csv_file']['name'];
$ext       = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
if ($ext !== 'csv') {
    echo json_encode(['success' => false, 'message' => 'Hanya file CSV yang diperbolehkan.']);
    exit;
}

$slug_input    = strtolower(trim($_POST['slug_komoditas']));
$tanggal_input = trim($_POST['tanggal_upload']); // format Y-m-d dari date input
$force_update  = isset($_POST['force_update']) && $_POST['force_update'] === '1';
$uploaded_by   = $_SESSION['username'];

// ── Validasi slug dari database ──
$valid_slugs = [];
$res_slugs   = mysqli_query($koneksi, "SELECT slug_id, nama FROM komoditas ORDER BY nama ASC");
if ($res_slugs) {
    while ($row = mysqli_fetch_assoc($res_slugs)) {
        $valid_slugs[$row['slug_id']] = $row['nama'];
    }
}

if (!array_key_exists($slug_input, $valid_slugs)) {
    echo json_encode(['success' => false, 'message' => "Slug '$slug_input' tidak dikenal atau tidak ada di database."]);
    exit;
}

// ── Helper: Deteksi angka Romawi ──
function isRomanNumeral(string $s): bool {
    return (bool) preg_match('/^M{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/i', trim($s));
}

// ── Baca CSV dari tmp ──
$tmp_path = $_FILES['csv_file']['tmp_name'];
$handle   = fopen($tmp_path, 'r');

if ($handle === false) {
    echo json_encode(['success' => false, 'message' => 'Gagal membaca file CSV yang diupload.']);
    exit;
}

// ── Baca header CSV: kolom[0]=No, kolom[1]=Wilayah, kolom[2+]=Tanggal ──
$header = fgetcsv($handle, 10000, ',');

if ($header === false || count($header) < 3) {
    fclose($handle);
    echo json_encode(['success' => false, 'message' => 'Format CSV tidak valid. Pastikan ada kolom No, Wilayah, dan minimal satu kolom tanggal.']);
    exit;
}

$dates             = [];
$tanggal_untuk_cek = [];

for ($i = 2; $i < count($header); $i++) {
    $tgl_raw  = str_replace(' ', '', trim($header[$i]));
    $date_obj = DateTime::createFromFormat('d/m/Y', $tgl_raw);
    if ($date_obj) {
        $format_tanggal       = $date_obj->format('Y-m-d');
        $dates[$i]            = $format_tanggal;
        $tanggal_untuk_cek[]  = "'$format_tanggal'";
    }
}

if (empty($dates)) {
    fclose($handle);
    echo json_encode(['success' => false, 'message' => 'Tidak ada kolom tanggal valid (format dd/mm/yyyy) yang ditemukan di header CSV.']);
    exit;
}

// ── Cek duplikasi ──
$slug_safe = mysqli_real_escape_string($koneksi, $slug_input);
$tanggal_in = implode(',', $tanggal_untuk_cek);
$cek_result = mysqli_query($koneksi,
    "SELECT COUNT(*) as total FROM harga_harian 
     WHERE slug_komoditas = '$slug_safe' 
     AND tanggal IN ($tanggal_in)"
);
$cek_row = mysqli_fetch_assoc($cek_result);

if ($cek_row['total'] > 0 && !$force_update) {
    fclose($handle);
    echo json_encode([
        'success'    => false,
        'duplicate'  => true,
        'message'    => "Ditemukan {$cek_row['total']} data yang sudah ada untuk komoditas '{$valid_slugs[$slug_input]}' pada rentang tanggal ini.",
        'hint'       => 'Centang opsi "Timpa data lama" untuk memperbarui data yang sudah ada.'
    ]);
    exit;
}

// ── Proses import batch ──
$batch_size       = 500;
$values           = [];
$total_entri      = 0;
$baris_diproses   = 0;
$errors           = 0;
$current_provinsi = null;

while (($data = fgetcsv($handle, 10000, ',')) !== false) {
    if (count($data) < 2) continue;

    $no_col      = trim($data[0]);
    $wilayah_raw = trim($data[1]);

    if (empty($wilayah_raw)) continue;

    $wilayah = mysqli_real_escape_string($koneksi, $wilayah_raw);

    // Skip header yang lolos
    if ($wilayah === 'Komoditas (Rp)' || $wilayah === 'Wilayah') continue;

    // ── Deteksi hierarki ──
    if (isRomanNumeral($no_col)) {
        if (strtolower($wilayah_raw) === 'semua provinsi') {
            $tipe_wilayah   = 'nasional';
            $provinsi_induk = null;
        } else {
            $tipe_wilayah     = 'provinsi';
            $provinsi_induk   = null;
            $current_provinsi = $wilayah_raw;
        }
    } elseif (preg_match('/^\d+$/', $no_col)) {
        $tipe_wilayah   = 'kab_kota';
        $provinsi_induk = $current_provinsi;
    } else {
        continue;
    }

    $tipe_safe = mysqli_real_escape_string($koneksi, $tipe_wilayah);
    $prov_safe = $provinsi_induk
        ? "'" . mysqli_real_escape_string($koneksi, $provinsi_induk) . "'"
        : 'NULL';

    foreach ($dates as $index => $tanggal) {
        if (!isset($data[$index])) continue;

        $harga_raw = trim($data[$index]);
        if ($harga_raw === '' || $harga_raw === '-') continue;

        $harga = (int) preg_replace('/[^0-9]/', '', $harga_raw);

        if ($harga > 0) {
            $values[]    = "('$slug_safe', '$wilayah', '$tanggal', $harga, '$tipe_safe', $prov_safe)";
            $total_entri++;

            if (count($values) >= $batch_size) {
                $q = "INSERT INTO harga_harian 
                        (slug_komoditas, wilayah, tanggal, harga, tipe_wilayah, provinsi_induk)
                      VALUES " . implode(',', $values) . "
                      ON DUPLICATE KEY UPDATE 
                        harga = VALUES(harga),
                        tipe_wilayah = VALUES(tipe_wilayah),
                        provinsi_induk = VALUES(provinsi_induk)";
                if (!mysqli_query($koneksi, $q)) {
                    $errors++;
                }
                $values = [];
            }
        }
    }
    $baris_diproses++;
}

// Kirim sisa batch
if (!empty($values)) {
    $q = "INSERT INTO harga_harian 
            (slug_komoditas, wilayah, tanggal, harga, tipe_wilayah, provinsi_induk)
          VALUES " . implode(',', $values) . "
          ON DUPLICATE KEY UPDATE 
            harga = VALUES(harga),
            tipe_wilayah = VALUES(tipe_wilayah),
            provinsi_induk = VALUES(provinsi_induk)";
    if (!mysqli_query($koneksi, $q)) {
        $errors++;
    }
}

fclose($handle);
unlink($tmp_path); // Hapus file sementara setelah diproses

// ── Catat log import ──
$log_tanggal = mysqli_real_escape_string($koneksi, $tanggal_input);
$log_uploader = mysqli_real_escape_string($koneksi, $uploaded_by);
$log_filename  = mysqli_real_escape_string($koneksi, $filename);
mysqli_query($koneksi,
    "INSERT INTO import_log (slug_komoditas, tanggal_upload, uploaded_by, filename, total_entri, errors, created_at)
     VALUES ('$slug_safe', '$log_tanggal', '$log_uploader', '$log_filename', $total_entri, $errors, NOW())
     ON DUPLICATE KEY UPDATE total_entri = total_entri"
);
// Jika tabel belum ada, abaikan error log (tidak krusial)

// ── Verifikasi hasil ──
$result = mysqli_query($koneksi,
    "SELECT 
        COUNT(*) AS total,
        SUM(tipe_wilayah = 'nasional') AS nasional,
        SUM(tipe_wilayah = 'provinsi') AS provinsi,
        SUM(tipe_wilayah = 'kab_kota') AS kab_kota
     FROM harga_harian WHERE slug_komoditas = '$slug_safe'"
);
$db_row = mysqli_fetch_assoc($result);

if ($errors > 0) {
    echo json_encode([
        'success'        => false,
        'message'        => "Import selesai dengan $errors error batch. Sebagian data mungkin tidak tersimpan.",
        'total_entri'    => $total_entri,
        'baris_diproses' => $baris_diproses,
        'errors'         => $errors,
        'db_total'       => (int)$db_row['total'],
    ]);
} else {
    echo json_encode([
        'success'        => true,
        'message'        => "Import berhasil! {$total_entri} baris data '{$valid_slugs[$slug_input]}' tersimpan.",
        'komoditas'      => $valid_slugs[$slug_input],
        'total_entri'    => $total_entri,
        'baris_diproses' => $baris_diproses,
        'errors'         => $errors,
        'db_total'       => (int)$db_row['total'],
        'db_nasional'    => (int)$db_row['nasional'],
        'db_provinsi'    => (int)$db_row['provinsi'],
        'db_kab_kota'    => (int)$db_row['kab_kota'],
    ]);
}
?>
