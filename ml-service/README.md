# PantauPangan Monthly AI Forecasting Microservice

Microservice Python FastAPI untuk prediksi harga komoditas pangan bulanan (3-6 bulan ke depan) dan simulasi dampak guncangan ekonomi (BBM, cuaca/musim, dan Hari Besar Keagamaan Nasional).

## Fitur Utama
1. **Asynchronous Time-Series Forecasting (`POST /internal/forecast/generate`)**:
   - Membaca deret waktu bulanan (`period_month`, `price`) dari tabel `commodity_prices` (baik tingkat konsumen maupun produsen).
   - Menghasilkan prediksi 3-6 bulan ke depan secara non-blocking (FastAPI `BackgroundTasks`).
   - Melakukan `UPSERT` hasil prediksi (`predicted_price`, `lower_bound`, `upper_bound`) ke tabel `price_forecasts`.
2. **Fast Inflation Shock Simulation (`POST /api/v1/forecast/simulate`)**:
   - Menghitung dampak kenaikan BBM, anomali cuaca, dan HBKN terhadap kurva harga dalam waktu <100ms.
3. **Health Check (`GET /health`)**.

## Cara Menjalankan

### Menggunakan Python Lokal:
```bash
cd ml-service
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Menggunakan Docker:
```bash
cd ml-service
docker build -t pantaupangan-ml:latest .
docker run -p 8000:8000 --env-file ../.env pantaupangan-ml:latest
```
