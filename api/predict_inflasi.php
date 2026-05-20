<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

define('PYTHON_API_URL', getenv('PROPHET_API_URL') ?: 'https://pantaupangan-web-production.up.railway.app');

// Ambil parameter dari frontend
$slug         = isset($_GET['slug'])         ? trim(strip_tags($_GET['slug']))         : 'beras';
$wilayah      = isset($_GET['wilayah'])      ? trim(strip_tags($_GET['wilayah']))      : 'Semua Provinsi';
$hari         = isset($_GET['hari'])         ? (int)$_GET['hari']                     : 30;
$faktor_raya  = isset($_GET['faktor_raya'])  ? ($_GET['faktor_raya']  === 'true' ? 'true' : 'false') : 'true';
$faktor_cuaca = isset($_GET['faktor_cuaca']) ? ($_GET['faktor_cuaca'] === 'true' ? 'true' : 'false') : 'false';
$faktor_bbm   = isset($_GET['faktor_bbm'])   ? ($_GET['faktor_bbm']   === 'true' ? 'true' : 'false') : 'false';

$allowed_hari = [7, 30, 120];
$hari = in_array($hari, $allowed_hari) ? $hari : 30;

// Build URL ke Python
$python_url = PYTHON_API_URL . '/predict-inflasi?' . http_build_query([
    'slug'         => $slug,
    'wilayah'      => $wilayah,
    'hari'         => $hari,
    'faktor_raya'  => $faktor_raya,
    'faktor_cuaca' => $faktor_cuaca,
    'faktor_bbm'   => $faktor_bbm,
]);

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL            => $python_url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 60,
    CURLOPT_HTTPHEADER     => ['Accept: application/json'],
    CURLOPT_FOLLOWLOCATION => true,
]);

$response  = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curl_err  = curl_error($ch);
curl_close($ch);

if ($curl_err || $http_code !== 200) {
    // ============================================================
    // FALLBACK: Prediksi inflasi sederhana via Regresi Linear PHP
    // Jika Python (Prophet) tidak tersedia, hitung inflasi dari
    // tren harga historis menggunakan regresi linear lokal.
    // ============================================================

    try {
        require_once __DIR__ . '/Server/koneksi.php';

        date_default_timezone_set('Asia/Jakarta');
        $hari_ini = date('Y-m-d');

        // Ambil data historis yang cukup besar
        $limit_hari = min(365, max(90, $hari * 4));

        $query = "SELECT tanggal, harga FROM harga_harian
                  WHERE slug_komoditas = ? AND wilayah = ? AND tanggal < ?
                  ORDER BY tanggal DESC LIMIT ?";
        $stmt = mysqli_prepare($koneksi, $query);

        if (!$stmt) {
            throw new Exception("DB prepare error: " . mysqli_error($koneksi));
        }

        mysqli_stmt_bind_param($stmt, "sssi", $slug, $wilayah, $hari_ini, $limit_hari);
        mysqli_stmt_execute($stmt);
        $result = mysqli_stmt_get_result($stmt);

        $data_historis = [];
        while ($row = mysqli_fetch_assoc($result)) {
            $data_historis[] = $row;
        }
        $data_historis = array_reverse($data_historis); // Urutkan ASC
        mysqli_stmt_close($stmt);

        if (count($data_historis) < 5) {
            echo json_encode(['error' => 'Data historis tidak cukup untuk prediksi inflasi.']);
            exit;
        }

        // Harga awal = harga terakhir (paling baru)
        $harga_awal = (float) $data_historis[count($data_historis) - 1]['harga'];

        // --- Regresi Linear untuk prediksi harga akhir ---
        $x_values = [];
        $y_values = [];
        foreach ($data_historis as $index => $row) {
            $x_values[] = $index + 1;
            $y_values[] = (float) $row['harga'];
        }

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

        // Prediksi harga akhir
        $x_akhir = $n + $hari;
        $harga_akhir_pred = round(($m * $x_akhir) + $c);
        if ($harga_akhir_pred < 0) $harga_akhir_pred = 0;

        // Hitung inflasi base
        $pct_base = ($harga_awal > 0) ? (($harga_akhir_pred - $harga_awal) / $harga_awal) * 100 : 0;

        // Tambahan kontribusi faktor (estimasi empiris, mirip prophet_api.py)
        $kontribusi = [];
        $kontribusi_raya  = ($faktor_raya  === 'true') ? 4.2 : 0.0;
        $kontribusi_cuaca = ($faktor_cuaca === 'true') ? 2.8 : 0.0;
        $kontribusi_bbm   = ($faktor_bbm   === 'true') ? 3.1 : 0.0;

        $kontribusi['hari_raya'] = round($kontribusi_raya, 1);
        $kontribusi['cuaca']     = round($kontribusi_cuaca, 1);
        $kontribusi['bbm']       = round($kontribusi_bbm, 1);
        $kontribusi['musiman']   = round(max(0, $pct_base), 1);

        $total_pct = $pct_base + $kontribusi_raya + $kontribusi_cuaca + $kontribusi_bbm;

        // Keyakinan model (regresi linear kurang akurat → confidence lebih rendah)
        $confidence = max(45, min(75, round(65 - abs($pct_base) * 0.3)));

        // Historis per minggu untuk grafik batang (4 minggu terakhir)
        $historis_agregat = [];
        $chunk_size = max(1, intdiv(count($data_historis), 4));
        $chunks = array_chunk($data_historis, $chunk_size);
        $chunks = array_slice($chunks, -4); // Ambil 4 chunk terakhir
        $harga_ref = (float) $chunks[0][0]['harga'];

        foreach ($chunks as $chunk) {
            $avg_harga = array_sum(array_column($chunk, 'harga')) / count($chunk);
            $pct_w = ($harga_ref > 0) ? (($avg_harga - $harga_ref) / $harga_ref) * 100 : 0;
            $harga_ref = $avg_harga;
            $tanggal_chunk = $chunk[intdiv(count($chunk), 2)]['tanggal']; // Ambil tanggal tengah
            $historis_agregat[] = [
                'label' => date('d/m', strtotime($tanggal_chunk)),
                'pct'   => round($pct_w, 1)
            ];
        }

        echo json_encode([
            'slug'                 => $slug,
            'wilayah'              => $wilayah,
            'hari_prediksi'        => $hari,
            'harga_awal'           => round($harga_awal),
            'harga_akhir_prediksi' => round($harga_akhir_pred),
            'total_inflasi_pct'    => round($total_pct, 1),
            'confidence'           => $confidence,
            'kontribusi'           => $kontribusi,
            'historis_agregat'     => $historis_agregat,
            'faktor_aktif'         => [
                'hari_raya' => ($faktor_raya  === 'true'),
                'cuaca'     => ($faktor_cuaca === 'true'),
                'bbm'       => ($faktor_bbm   === 'true')
            ],
            'algoritma'       => 'regresi_linear_inflasi (fallback)',
            'fallback_reason' => 'Python Service tidak tersedia (HTTP ' . $http_code . ')'
        ]);
        exit;

    } catch (Exception $e) {
        error_log("Fallback Inflasi Error: " . $e->getMessage());
        http_response_code(503);
        echo json_encode([
            'error'  => 'Layanan prediksi inflasi tidak dapat dihubungi dan fallback gagal.',
            'detail' => 'Python HTTP: ' . $http_code . ' | Fallback: ' . $e->getMessage()
        ]);
        exit;
    }
}

echo $response;
?>
