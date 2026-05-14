<?php
require __DIR__ . '/api/Server/koneksi.php';

$res = mysqli_query($koneksi, "SHOW COLUMNS FROM berita");
while($row = mysqli_fetch_assoc($res)) {
    echo $row['Field'] . ' - ' . $row['Type'] . "\n";
}
?>
