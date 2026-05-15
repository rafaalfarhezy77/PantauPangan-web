<?php
    require __DIR__ . '/../Server/koneksi.php';
    session_start();

    header("Content-Type: application/json");

    // Menangkap data JSON yang dikirim oleh javascript Fetch API
    $data = json_decode(file_get_contents("php://input"), true);

    if (!$data) {
        echo json_encode(["success" => false,"message"=> "Data tidak Valid."]);
        exit;
    }

    $username = mysqli_real_escape_string($koneksi, $data['username']);
    $email = mysqli_real_escape_string($koneksi, $data['email']);
    $password = mysqli_real_escape_string($koneksi, $data['password']);
    $role = mysqli_real_escape_string($koneksi, $data['role']);
    $instansi_dinas = isset($data['instansi_dinas']) ? mysqli_real_escape_string($koneksi, $data['instansi_dinas']) : NULL;

    $password_hash = password_hash($password, PASSWORD_DEFAULT);

    // Cek apakah email sudah terdaftar
    $cek_email = mysqli_query($koneksi,"SELECT id FROM users WHERE email = '$email'");
    if (mysqli_num_rows($cek_email) > 0) {
        echo json_encode(["success"=> false,"message"=> "Email sudah terdaftar! Gunakan email lain!"]);
        exit;
    }

    if ($instansi_dinas !== NULL) {
        $query = "INSERT INTO users (username, email, password, role, instansi_dinas) VALUES ('$username', '$email', '$password_hash', '$role', '$instansi_dinas')";
    } else {
        $query = "INSERT INTO users (username, email, password, role) VALUES ('$username', '$email', '$password_hash', '$role')";
    }
    
    $result = mysqli_query($koneksi, $query);

    if ($result) {
        echo json_encode([
            "success" => true,
            "message" => "Registrasi berhasil"
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Gagal menyimpan data: " . mysqli_error($koneksi)
        ]);
    }
    exit;   
?>

