<?php
try {
    $pdo = new PDO(
        'mysql:host=gateway01.ap-southeast-1.prod.alicloud.tidbcloud.com;port=4000;dbname=pantau-pangan',
        'YTzpwxsaVCPGBUc.root',
        'JVam7LiAJKoHMZI0',
        [PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => false]
    );
    $tables = $pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
    $output = '';
    foreach ($tables as $table) {
        $create = $pdo->query("SHOW CREATE TABLE {$table}")->fetch(PDO::FETCH_ASSOC);
        $output .= $create['Create Table'] . ";\n\n";
    }
    file_put_contents('schema_dump.txt', $output);
    echo 'SCHEMA_DUMP_SUCCESS';
} catch (PDOException $e) {
    echo 'Error: ' . $e->getMessage();
}
