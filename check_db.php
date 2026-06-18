<?php
$koneksi = mysqli_connect("gateway01.ap-southeast-1.prod.alicloud.tidbcloud.com", "YTzpwxsaVCPGBUc.root", "JVam7LiAJKoHMZI0", "pantau-pangan", 4000);
if (!$koneksi) { die("Gagal: " . mysqli_connect_error()); }
$res = mysqli_query($koneksi, "SHOW TABLES");
while($row = mysqli_fetch_row($res)) { echo $row[0] . "\n"; }
?>
