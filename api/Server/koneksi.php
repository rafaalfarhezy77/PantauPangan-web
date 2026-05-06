<?php
// Data dari TiDB Cloud
$host = 'gateway01.ap-southeast-1.prod.alicloud.tidbcloud.com';
$port = 4000;
$user = 'YTzpwxsaVCPGBUc.root';
$pass = 'YlNcGgXrSk5UBCLg';
$db   = 'pantau-pangan';

// Inisialisasi mysqli
$koneksi = mysqli_init();

// Menambahkan pengaturan SSL (Wajib untuk TiDB Serverless)
mysqli_ssl_set($koneksi, NULL, NULL, NULL, NULL, NULL);

// Melakukan koneksi
$real_connect = mysqli_real_connect(
    $koneksi, 
    $host, 
    $user, 
    $pass, 
    $db, 
    $port, 
    NULL, 
    MYSQLI_CLIENT_SSL
);

if (!$real_connect) {
    die("Koneksi ke TiDB Cloud gagal: " . mysqli_connect_error());
}

// ==========================================
// CUSTOM SESSION HANDLER UNTUK VERCEL
// ==========================================
class DatabaseSessionHandler implements SessionHandlerInterface {
    private $link;

    public function __construct($link) {
        $this->link = $link;
    }

    public function open($savePath, $sessionName): bool {
        return true;
    }

    public function close(): bool {
        return true;
    }

    public function read($id): string|false {
        $id = mysqli_real_escape_string($this->link, $id);
        $result = mysqli_query($this->link, "SELECT data FROM sessions WHERE id = '$id'");
        if ($row = mysqli_fetch_assoc($result)) {
            return $row['data'];
        }
        return ""; // Kembalikan string kosong jika tidak ada sesi
    }

    public function write($id, $data): bool {
        $id = mysqli_real_escape_string($this->link, $id);
        $data = mysqli_real_escape_string($this->link, $data);
        $access = time();
        
        // Gunakan REPLACE INTO agar jika ID sesi sudah ada, datanya diperbarui
        $query = "REPLACE INTO sessions (id, access, data) VALUES ('$id', '$access', '$data')";
        return mysqli_query($this->link, $query) ? true : false;
    }

    public function destroy($id): bool {
        $id = mysqli_real_escape_string($this->link, $id);
        return mysqli_query($this->link, "DELETE FROM sessions WHERE id = '$id'") ? true : false;
    }

    public function gc($maxlifetime): int|false {
        $old = time() - $maxlifetime;
        mysqli_query($this->link, "DELETE FROM sessions WHERE access < '$old'");
        return true;
    }
}

// Terapkan handler session ke database
// Dinonaktifkan untuk mempercepat performa. Session default PHP (berbasis file) jauh lebih cepat.
// $handler = new DatabaseSessionHandler($koneksi);
// session_set_save_handler($handler, true);
?>