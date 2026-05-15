# 🌾 PantauPangan: Sistem Informasi & Prediksi Harga Komoditas

**PantauPangan** adalah platform digital berbasis web yang dirancang untuk memantau, menganalisis, dan memprediksi pergerakan harga komoditas pangan strategis di seluruh wilayah Indonesia. Proyek ini menggabungkan kekuatan **PHP**, **Python (AI)**, dan **Cloud Database** untuk memberikan transparansi harga bagi petani, pedagang, dan pembeli.

---

## ✨ Fitur Utama

- **📊 Visualisasi Data Real-Time**: Grafik tren harga historis yang interaktif menggunakan Chart.js.
- **🗺️ Peta Interaktif**: Sebaran komoditas unggulan dan harga di berbagai provinsi di Indonesia.
- **📈 Prediksi Harga AI**: Forecasting harga 7 hingga 120 hari ke depan menggunakan algoritma **Facebook Prophet**.
- **📉 Analisis Inflasi**: Prediksi potensi kenaikan harga dengan mempertimbangkan faktor hari raya, cuaca, dan kenaikan harga BBM.
- **💡 Saran Tindakan Cerdas**: Rekomendasi strategi jual/beli berdasarkan peran pengguna (Petani, Pembeli, Tengkulak).
- **📰 Berita Pangan**: Update informasi terkini mengenai kebijakan dan kondisi pangan nasional.
- **📥 Manajemen Data**: Panel admin untuk impor data massal via CSV dan manajemen konten berita.

---

## 🚀 Teknologi yang Digunakan

| Layer | Teknologi |
| :--- | :--- |
| **Frontend** | HTML5, CSS3 (Vanilla), JavaScript (Vanilla), Chart.js |
| **Backend PHP** | PHP 8.x, MySQLi (TiDB Cloud Connector) |
| **Backend AI** | Python 3.x, Flask, Facebook Prophet, Pandas |
| **Database** | TiDB Cloud (Serverless MySQL) |
| **Cloud Media** | Cloudinary (Manajemen Gambar Berita) |

---

## 🏗️ Arsitektur Sistem

Proyek ini menggunakan arsitektur **Hybrid Client-Server**. Logika aplikasi utama ditangani oleh PHP, sementara tugas komputasi berat untuk prediksi AI dialihkan ke microservice Python (Flask).

```mermaid
graph LR
    User((Pengguna)) --> WebUI[Frontend - JS/Chart.js]
    WebUI --> PHPAPI[Backend PHP - API]
    PHPAPI --> TiDB[(TiDB Cloud DB)]
    PHPAPI --> PyMicro[Python Microservice - Prophet]
    PyMicro --> TiDB
```

---

## 🛠️ Panduan Instalasi

### 1. Prasyarat
- Web Server (Apache/Nginx) & PHP 8.0+
- Python 3.9+
- Akun TiDB Cloud (atau MySQL Lokal)
- Akun Cloudinary (untuk upload gambar)

### 2. Kloning Project
```bash
git clone https://github.com/username/sistem-informasi-harga-komoditas.git
cd sistem-informasi-harga-komoditas
```

### 3. Konfigurasi Environment
Buat file `.env` di direktori root dan sesuaikan konfigurasinya:
```env
DB_HOST=your_host
DB_PORT=4000
DB_USER=your_user
DB_PASS=your_password
DB_NAME=your_db_name
DATABASE_URL=mysql+pymysql://user:pass@host:port/db
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
```

### 4. Setup Microservice Python (AI)
```bash
# Buat virtual environment
python -m venv venv
source venv/bin/activate  # atau venv\Scripts\activate untuk Windows

# Instal dependensi
pip install -r requirements.txt

# Jalankan server Flask
python prophet_api.py
```

### 5. Konfigurasi Web Server
Pastikan PHP dapat mengakses database dan direktori `uploads/` memiliki izin tulis. Akses project melalui browser (contoh: `localhost/sistem-informasi-harga-komoditas`).

---

## 📅 Sumber Data
Data harga yang digunakan dalam sistem ini bersumber dari **Layanan Download CSV PIHPS (Pusat Informasi Harga Pangan Strategis)** untuk kategori **Pasar Tradisional**. Data diperbarui secara berkala melalui modul impor CSV di panel admin.

---

## 👥 Kontributor
- **Nama Anda/Tim** - *Initial Work*

---

## 📄 Lisensi
Proyek ini dilisensikan di bawah [MIT License](LICENSE).
