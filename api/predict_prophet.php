<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// URL Python Microservice
// URL Railway: https://pantaupangan-web-production.up.railway.app
// Jika PROPHET_API_URL di .env kosong, sistem otomatis menggunakan URL publik Railway
define('PYTHON_API_URL', getenv('PROPHET_API_URL') ?: 'https://pantaupangan-web-production.up.railway.app');

$wilayah = isset($_GET['wilayah']) ? trim(strip_tags($_GET['wilayah'])) : 'Jakarta';
$slug    = isset($_GET['slug'])    ? trim(strip_tags($_GET['slug']))    : 'beras';
$hari    = isset($_GET['hari'])    ? (int)$_GET['hari']                : 7;

$allowed_hari = [7, 30, 90, 120];
$hari = in_array($hari, $allowed_hari) ? $hari : 7;

// Build URL untuk request ke Python
$python_url = PYTHON_API_URL . '/predict?' . http_build_query([
    'slug'    => $slug,
    'wilayah' => $wilayah,
    'hari'    => $hari
]);

// Gunakan cURL untuk menghubungi Python API
$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL            => $python_url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 30,  // Timeout 30 detik (Prophet butuh waktu lebih untuk melatih model pertama kali)
    CURLOPT_HTTPHEADER     => ['Accept: application/json'],
    CURLOPT_FOLLOWLOCATION => true,
]);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curl_error = curl_error($ch);
curl_close($ch);

if ($curl_error || $http_code !== 200) {
    // ============================================================
    // FALLBACK: Regresi Linear langsung via PHP (tanpa HTTP request)
    // Sebelumnya menggunakan cURL ke predict.php, namun gagal di Vercel
    // karena routing vercel.json tidak meng-cover file tersebut (308 redirect).
    // Sekarang fallback dilakukan langsung di dalam proses ini.
    // ============================================================
    
    try {
        require_once __DIR__ . '/Server/koneksi.php';

        date_default_timezone_set('Asia/Jakarta');
        $hari_ini = date('Y-m-d');

        // Data training: min 30 hari, max 60 hari
        $limit_hari = min(60, max(30, $hari));

        $query = "SELECT tanggal, harga FROM harga_harian
                  WHERE slug_komoditas = ? AND wilayah = ? AND tanggal < ?
                  ORDER BY tanggal DESC LIMIT ?";
        $stmt = mysqli_prepare($koneksi, $query);

        if (!$stmt) {
            throw new Exception("Error prepare statement: " . mysqli_error($koneksi));
        }

        mysqli_stmt_bind_param($stmt, "sssi", $slug, $wilayah, $hari_ini, $limit_hari);
        mysqli_stmt_execute($stmt);
        $result = mysqli_stmt_get_result($stmt);

        $data_historis = [];
        while ($row = mysqli_fetch_assoc($result)) {
            $data_historis[] = $row;
        }

        // Balik urutan menjadi ASC
        $data_historis = array_reverse($data_historis);
        mysqli_stmt_close($stmt);

        if (count($data_historis) == 0) {
            echo json_encode(['error' => 'Data tidak ditemukan untuk wilayah ini.']);
            exit;
        }

        // Siapkan array untuk Regresi Linear
        $x_values = [];
        $y_values = [];
        foreach ($data_historis as $index => $row) {
            $x_values[] = $index + 1;
            $y_values[] = (float) $row['harga'];
        }

        // Hitung koefisien Regresi Linear (y = mx + c)
        $n     = count($x_values);
        $sumX  = array_sum($x_values);
        $sumY  = array_sum($y_values);
        $sumXY = 0;
        $sumX2 = 0;
        for ($i = 0; $i < $n; $i++) {
            $sumXY += ($x_values[$i] * $y_values[$i]);
            $sumX2 += ($x_values[$i] * $x_values[$i]);
        }

        $denominator = ($n * $sumX2 - $sumX * $sumX);
        $m = ($denominator == 0) ? 0 : ($n * $sumXY - $sumX * $sumY) / $denominator;
        $c = ($sumY - $m * $sumX) / $n;

        // Prediksi N hari ke depan mulai hari ini
        $prediksi = [];
        $tanggal_terakhir = date('Y-m-d', strtotime('-1 day'));

        for ($i = 1; $i <= $hari; $i++) {
            $x_prediksi = $n + $i;
            $y_prediksi = round(($m * $x_prediksi) + $c);
            $tgl_baru   = date('Y-m-d', strtotime($tanggal_terakhir . " + $i days"));

            $prediksi[] = [
                'tanggal' => $tgl_baru,
                'harga'   => $y_prediksi
            ];
        }

        echo json_encode([
            'wilayah'         => $wilayah,
            'slug'            => $slug,
            'hari_prediksi'   => $hari,
            'historis'        => $data_historis,
            'prediksi'        => $prediksi,
            'algoritma'       => 'regresi_linear (fallback)',
            'fallback_reason' => 'Python Service tidak tersedia (HTTP ' . $http_code . ')'
        ]);
        exit;

    } catch (Exception $e) {
        // Jika bahkan fallback regresi linear pun gagal
        error_log("Fallback Regresi Linear Error: " . $e->getMessage());
        http_response_code(503);
        echo json_encode([
            'error'  => 'Prediction Service tidak dapat dihubungi dan Fallback (Regresi Linear) juga gagal.',
            'detail' => 'Python HTTP: ' . $http_code . ' | Fallback Error: ' . $e->getMessage()
        ]);
        exit;
    }
}

// Teruskan respons dari Python ke Frontend
echo $response;
?>
