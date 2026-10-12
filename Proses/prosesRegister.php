<?php
    header("Content-Type: application/json");
    include '../Server/koneksi.php';

    // Menangkap data JSON yang dikirim oleh javascript Fetch API
    $data = json_decode(file_get_contents("php://input"), true);

    if (!$data) {
        echo json_encode(["success" => false,"message"=> "Data tidak Valid."]);
        exit;
    }

    $username = mysqli_real_escape_string($koneksi, $data['username']);
    $password = mysqli_real_escape_string($koneksi, $data['password']);
    $email = mysqli_real_escape_string($koneksi, $data['email']);
    $role = mysqli_real_escape_string($koneksi, $data['role']);

    $password_hash = password_hash($password, PASSWORD_DEFAULT);

    // Cek apakah email sudah terdaftar
    $cek_email = mysqli_query($koneksi,"SELECT id FROM users WHERE email = '$email");
    if (mysqli_num_rows($cek_email) > 0) {
        echo json_encode(["success"=> false,"message"=> "Email sudah terdaftar! Gunakan email lain!"]);
        exit;
    }

    $query = "INSERT INTO users (username, password, email, role) VALUES ('$username', '$password_hash', '$email', '$role')";
    $result = mysqli_query($koneksi, $query);

    if ($result) {
        echo "Register Berhasil <a href='../login.php'>Login</a>";
    } else {
        echo "Register Gagal : " . mysqli_error( $koneksi );
    }
?>