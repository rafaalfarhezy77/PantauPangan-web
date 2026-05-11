<?php
require_once __DIR__ . '/api/Server/env.php';

// Mengambil DATABASE_URL dari environment agar credential aman
$database_url = getenv('DATABASE_URL');

if (!$database_url) {
    die("Error: DATABASE_URL tidak dikonfigurasi pada environment.");
}

// Parsing database_url untuk mendapatkan host, port, user, pass, dbname
$parsed_url = parse_url($database_url);

$host = $parsed_url['host'];
$port = isset($parsed_url['port']) ? $parsed_url['port'] : 4000;
$user = $parsed_url['user'];
$pass = $parsed_url['pass'];
$db   = ltrim($parsed_url['path'], '/');

try {
    // Menambahkan opsi SSL (Wajib untuk TiDB Cloud Serverless)
    $options = [
        PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => false,
    ];
    
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$db", $user, $pass, $options);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Buka file CSV
    $csv_file = __DIR__ . "/data_beras.csv"; // Pastikan file berada di direktori yang sama dengan script
    
    if (file_exists($csv_file)) {
        if (($handle = fopen($csv_file, "r")) !== FALSE) {
            // Lewati baris pertama kalau itu header (Wilayah, Tanggal, Harga)
            fgetcsv($handle, 1000, ","); 

            $stmt = $pdo->prepare("INSERT INTO harga_harian (komoditas, wilayah, tanggal, harga) VALUES ('Beras', ?, ?, ?)");

            while (($data = fgetcsv($handle, 1000, ",")) !== FALSE) {
                // Pastikan format CSV sesuai (Wilayah, Tanggal, Harga)
                $wilayah = $data[0];
                $tanggal = $data[1]; // Format harus YYYY-MM-DD
                $harga = (int)$data[2];

                $stmt->execute([$wilayah, $tanggal, $harga]);
            }
            fclose($handle);
            echo "Data CSV berhasil dimasukkan ke TiDB!";
        } else {
            echo "Gagal membuka file CSV.";
        }
    } else {
        echo "File CSV tidak ditemukan: " . $csv_file;
    }
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
