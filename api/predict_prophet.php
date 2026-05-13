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
    // FALLBACK KE REGRESI LINEAR LAMA JIKA PYTHON MATI, ERROR, ATAU 404
    
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
    $host = $_SERVER['HTTP_HOST'];
    $uri = $_SERVER['REQUEST_URI']; 
    // Ganti nama file endpoint
    $fallback_uri = str_replace("predict_prophet.php", "predict.php", $uri);
    $fallback_url = $protocol . "://" . $host . $fallback_uri;
    
    $ch_fallback = curl_init();
    curl_setopt_array($ch_fallback, [
        CURLOPT_URL            => $fallback_url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 10
    ]);
    
    $fallback_response = curl_exec($ch_fallback);
    $fallback_code = curl_getinfo($ch_fallback, CURLINFO_HTTP_CODE);
    curl_close($ch_fallback);
    
    if ($fallback_response) {
        $data = json_decode($fallback_response, true);
        if (is_array($data)) {
            // Jika prediksi regresi linear sukses
            if (!isset($data['error'])) {
                $data['algoritma'] = 'regresi_linear (fallback)';
                $data['fallback_reason'] = 'Python Service Error / 404';
                echo json_encode($data);
            } else {
                // Jika regresi linear mengembalikan error seperti "Data tidak ditemukan"
                http_response_code(200); // Set ke 200 agar frontend tetap memproses pesannya
                echo $fallback_response;
            }
            exit;
        }
    }

    // Jika file predict.php tidak bisa diakses sama sekali
    http_response_code(503);
    echo json_encode([
        'error' => 'Prediction Service tidak dapat dihubungi dan Fallback (Regresi Linear) mati.',
        'detail' => 'Python HTTP: ' . $http_code . ' | Fallback HTTP: ' . $fallback_code
    ]);
    exit;
}

// Teruskan respons dari Python ke Frontend
echo $response;
?>
