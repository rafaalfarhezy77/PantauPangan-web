<?php
/**
 * API: Ambil daftar kab/kota beserta harga terkini berdasarkan provinsi & slug komoditas
 * 
 * GET /api/kab_kota_by_provinsi.php?provinsi=Aceh&slug=beras
 */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/Server/koneksi.php';

$provinsi = isset($_GET['provinsi']) ? trim($_GET['provinsi']) : '';
$slug     = isset($_GET['slug'])     ? trim($_GET['slug'])     : '';

if (empty($provinsi) || empty($slug)) {
    http_response_code(400);
    echo json_encode(['error' => 'Parameter provinsi dan slug wajib diisi.']);
    exit;
}

$provinsi_safe = mysqli_real_escape_string($koneksi, $provinsi);
$slug_safe     = mysqli_real_escape_string($koneksi, $slug);

// Ambil semua kab/kota di provinsi tersebut + harga terkini (tanggal paling baru yang tersedia)
$query = "
    SELECT 
        h.wilayah,
        h.harga,
        h.tanggal
    FROM harga_harian h
    INNER JOIN (
        -- Untuk setiap kab/kota, ambil tanggal terbaru yang tersedia
        SELECT wilayah, MAX(tanggal) AS max_tanggal
        FROM harga_harian
        WHERE slug_komoditas = '$slug_safe'
          AND tipe_wilayah = 'kab_kota'
          AND provinsi_induk = '$provinsi_safe'
        GROUP BY wilayah
    ) latest ON h.wilayah = latest.wilayah AND h.tanggal = latest.max_tanggal
    WHERE h.slug_komoditas = '$slug_safe'
      AND h.tipe_wilayah = 'kab_kota'
      AND h.provinsi_induk = '$provinsi_safe'
    ORDER BY h.wilayah ASC
";

$result = mysqli_query($koneksi, $query);

if (!$result) {
    http_response_code(500);
    echo json_encode(['error' => 'Query gagal: ' . mysqli_error($koneksi)]);
    exit;
}

$kab_kota = [];
while ($row = mysqli_fetch_assoc($result)) {
    $kab_kota[] = [
        'nama'    => $row['wilayah'],
        'harga'   => (int) $row['harga'],
        'tanggal' => $row['tanggal'],
    ];
}

// Ambil juga harga provinsi (agregat "Semua Provinsi" atau level provinsi itu sendiri)
$q_prov = "
    SELECT harga, tanggal
    FROM harga_harian
    WHERE slug_komoditas = '$slug_safe'
      AND tipe_wilayah = 'provinsi'
      AND wilayah = '$provinsi_safe'
    ORDER BY tanggal DESC
    LIMIT 1
";
$r_prov = mysqli_query($koneksi, $q_prov);
$harga_provinsi = null;
$tanggal_provinsi = null;
if ($r_prov && $row_prov = mysqli_fetch_assoc($r_prov)) {
    $harga_provinsi   = (int) $row_prov['harga'];
    $tanggal_provinsi = $row_prov['tanggal'];
}

echo json_encode([
    'provinsi'         => $provinsi,
    'slug'             => $slug,
    'harga_provinsi'   => $harga_provinsi,
    'tanggal_provinsi' => $tanggal_provinsi,
    'kab_kota'         => $kab_kota,
    'total'            => count($kab_kota),
]);
?>
