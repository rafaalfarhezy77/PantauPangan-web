<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>404 — Halaman Tidak Ditemukan | PantauPangan</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&family=Lora:ital@1&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background: #faf7f2;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
        }
        .card {
            background: white;
            border: 1px solid #f0ebe0;
            border-radius: 24px;
            padding: 3rem 2.5rem;
            max-width: 420px;
            width: 100%;
            text-align: center;
            box-shadow: 0 4px 40px rgba(26,58,42,0.06);
        }
        .icon { font-size: 4rem; margin-bottom: 1.25rem; }
        .code { font-size: 5rem; font-weight: 800; color: #f0ebe0; line-height: 1; margin-bottom: 0.5rem; }
        .italic-tag { font-family: 'Lora', serif; font-style: italic; color: #52b788; font-size: 1.1rem; margin-bottom: 0.25rem; }
        h1 { font-size: 1.375rem; font-weight: 700; color: #1a3a2a; margin-bottom: 0.5rem; }
        p { font-size: 0.875rem; color: #9ca3af; line-height: 1.6; margin-bottom: 2rem; }
        .btn {
            display: inline-flex; align-items: center; gap: 0.5rem;
            background: #1a3a2a; color: white;
            padding: 0.75rem 1.5rem; border-radius: 12px;
            font-size: 0.875rem; font-weight: 600; text-decoration: none;
            transition: background 0.15s;
        }
        .btn:hover { background: #2d6a4f; }
        .btn-secondary {
            background: #f0ebe0; color: #1a3a2a; margin-left: 0.5rem;
        }
        .btn-secondary:hover { background: #e5dfd3; }
    </style>
</head>
<body>
    <div class="card">
        <div class="icon">🔍</div>
        <div class="code">404</div>
        <p class="italic-tag">Halaman tidak ditemukan</p>
        <h1>Oops! Halaman Ini Tidak Ada</h1>
        <p>Mungkin tautan sudah berubah, atau halaman yang Anda cari telah dipindahkan. Coba periksa kembali URL-nya.</p>
        <div>
            <a href="{{ route('beranda') }}" class="btn">🏠 Ke Beranda</a>
            <a href="{{ url()->previous() }}" class="btn btn-secondary">← Kembali</a>
        </div>
    </div>
</body>
</html>
