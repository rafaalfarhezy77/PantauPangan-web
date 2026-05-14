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
    http_response_code(503);
    echo json_encode([
        'error'  => 'Layanan prediksi inflasi tidak dapat dihubungi.',
        'detail' => 'Python HTTP: ' . $http_code . ($curl_err ? ' | cURL: ' . $curl_err : '')
    ]);
    exit;
}

echo $response;
?>
