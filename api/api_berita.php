<?php
header('Content-Type: application/json');
require __DIR__ . '/Server/koneksi.php';

$slug = mysqli_real_escape_string($koneksi, $_GET['slug']);
$query = "SELECT * FROM berita WHERE slug_komoditas = '$slug' ORDER BY tanggal DESC";
$result = mysqli_query($koneksi, $query);

$news = [];
while ($row = mysqli_fetch_assoc($result)) {
    $news[] = [
        'icon' => $row['icon'],
        'title' => $row['judul'],
        'meta' => $row['sumber'] . ' · ' . date('d M Y', strtotime($row['tanggal']))
    ];
}
echo json_encode($news);
?>