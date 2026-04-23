<?php
    session_start();

    header("Content-Type: application/json");
    include '../Server/koneksi.php';

    // Menangkap data JSON yang dikirim oleh javascript Fetch API
    $data = json_decode(file_get_contents("php://input"), true);

    $email = mysqli_real_escape_string($koneksi, $data['email']);
    $password = $data['password'];
    
    // Cari user berdasarkan email
    $result = mysqli_query($koneksi,"SELECT * FROM users WHERE email = '$email'");
    $user = mysqli_fetch_assoc($result);

    if ($user) {
        // Verifikasi hash kata sandi
        if (password_verify($password, $user['password'])) {
            // Set session
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['role'] = $user['role'];
            $_SESSION['username'] = $user['username'];

            echo json_encode([
                "success" => true,
                "username" => $user["username"],
                "role"=> $user["role"],
            ]);
        } else {
            echo json_encode(["success" => false,"msg"=> "Kata sandi salah!"]);
        } 
    } else {
        echo json_encode(["success"=> false,"msg"=> "Email tidak ditemukan!"]);
    }
?>
