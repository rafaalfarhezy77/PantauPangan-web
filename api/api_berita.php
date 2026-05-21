<?php
require __DIR__ . '/Server/koneksi.php';

header('Content-Type: application/json');

$all = isset($_GET['all']) && $_GET['all'] === 'true';
if ($all) {
    $query = "SELECT * FROM berita ORDER BY created_at DESC";
} else {
    $query = "SELECT * FROM berita ORDER BY created_at DESC LIMIT 6";
}
$result = mysqli_query($koneksi, $query);

$newsData = [];
if ($result) {
    $isFirst = true;
    while ($row = mysqli_fetch_assoc($result)) {
        // Pemetaan dari tabel berita ke format yang dimengerti frontend
        $news = [
            'id'       => $row['id'],
            'title'    => $row['judul'],
            'body'     => $row['deskripsi'],
            'image'    => $row['cover_image'] ? $row['cover_image'] : 'img/news-placeholder.jpg',
            'date'     => date('d M Y', strtotime($row['tanggal'])),
            'source'   => $row['sumber'] ? $row['sumber'] : 'Redaksi',
            'penulis'  => isset($row['penulis']) && $row['penulis'] ? $row['penulis'] : '',
            'link_url' => isset($row['link_url']) && $row['link_url'] ? $row['link_url'] : '',
            'cat'      => $row['slug_komoditas'] ? strtoupper($row['slug_komoditas']) : 'UMUM',
            'icon'     => '📰',
            'emoji'    => '📰',
            'uploader' => $row['uploaded_by'],
        ];
        
        // Buat item pertama jadi featured
        if ($isFirst) {
            $news['featured'] = true;
            $isFirst = false;
        } else {
            $news['featured'] = false;
        }

        $newsData[] = $news;
    }
}

echo json_encode(['status' => 'success', 'data' => $newsData]);
?>