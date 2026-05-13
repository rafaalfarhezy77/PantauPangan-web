# prophet_api.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from prophet import Prophet
import pandas as pd
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import os
import logging
import json
import hashlib
import time

# Matikan log verbose dari Prophet/Stan
logging.getLogger('prophet').setLevel(logging.WARNING)
logging.getLogger('cmdstanpy').setLevel(logging.WARNING)

load_dotenv()

app = Flask(__name__)
CORS(app)  # Izinkan akses dari domain PHP kamu

# Koneksi ke TiDB Cloud menggunakan DATABASE_URL dari .env
DATABASE_URL = os.getenv('DATABASE_URL')
if DATABASE_URL:
    DATABASE_URL += "?ssl_verify_cert=true&ssl_verify_identity=false"
else:
    print("Warning: DATABASE_URL not found in .env")

engine = create_engine(DATABASE_URL, pool_recycle=280, pool_pre_ping=True) if DATABASE_URL else None

# Setup Caching Directory
CACHE_DIR = "./prophet_cache"
os.makedirs(CACHE_DIR, exist_ok=True)

def get_cache_key(slug, wilayah, hari):
    return hashlib.md5(f"{slug}_{wilayah}_{hari}".encode()).hexdigest()

def get_from_cache(key, max_age_hours=6):
    path = f"{CACHE_DIR}/{key}.json"
    if os.path.exists(path):
        if time.time() - os.path.getmtime(path) < max_age_hours * 3600:
            with open(path) as f:
                return json.load(f)
    return None

def save_to_cache(key, data):
    path = f"{CACHE_DIR}/{key}.json"
    with open(path, 'w') as f:
        json.dump(data, f)


@app.route('/predict', methods=['GET'])
def predict():
    slug    = request.args.get('slug', 'beras')
    wilayah = request.args.get('wilayah', 'Jakarta')
    hari    = int(request.args.get('hari', 7))

    # Validasi input
    if hari not in [7, 30, 90, 120]:
        hari = 7

    try:
        # Cek Cache Terlebih Dahulu
        cache_key = get_cache_key(slug, wilayah, hari)
        cached = get_from_cache(cache_key, max_age_hours=6)
        if cached:
            return jsonify(cached)

        if engine is None:
            return jsonify({"error": "Database URL tidak dikonfigurasi dengan benar"}), 500

        # 1. Ambil data historis dari TiDB (minimal 60 hari, max 365)
        limit = max(60, hari * 3)
        limit = min(limit, 365)

        query = text("""
            SELECT tanggal, harga FROM harga_harian
            WHERE slug_komoditas = :slug AND wilayah = :wilayah
            ORDER BY tanggal DESC
            LIMIT :limit
        """)

        with engine.connect() as conn:
            rows = conn.execute(query, {"slug": slug, "wilayah": wilayah, "limit": limit})
            df_raw = pd.DataFrame(rows.fetchall(), columns=['tanggal', 'harga'])

        if df_raw.empty:
            return jsonify({"error": "Data tidak ditemukan untuk wilayah ini."}), 404

        # 2. Siapkan dan bersihkan data
        df_raw = df_raw.sort_values('tanggal').reset_index(drop=True)
        df_raw['tanggal'] = pd.to_datetime(df_raw['tanggal'])
        df_raw['harga'] = df_raw['harga'].astype(float)

        # === FIX #1: FORWARD-FILL WEEKEND (SABTU & MINGGU) ===
        # Problem: Data hanya ada hari kerja. Prophet melihat "lubang" di akhir pekan
        # dan belajar bahwa nilainya mendekati 0. Solusinya: buat range penuh lalu
        # isi tanggal yang kosong dengan harga terakhir yang diketahui (forward-fill).
        full_range = pd.date_range(start=df_raw['tanggal'].min(), end=df_raw['tanggal'].max(), freq='D')
        df_full = pd.DataFrame({'tanggal': full_range})
        df_full = df_full.merge(df_raw, on='tanggal', how='left')
        df_full['harga'] = df_full['harga'].ffill().bfill()

        df = pd.DataFrame({
            'ds': df_full['tanggal'],
            'y': df_full['harga']
        })

        # === FIX #2: MATIKAN yearly_seasonality JIKA DATA < 6 BULAN ===
        # Problem: Prophet membutuhkan >= 1 tahun data untuk mempelajari pola musiman
        # tahunan. Jika data hanya 60-90 hari, yearly_seasonality akan overfitting
        # dan menghasilkan prediksi 1 bulan yang tidak masuk akal (meledak).
        jumlah_hari_data = (df['ds'].max() - df['ds'].min()).days
        use_yearly = jumlah_hari_data >= 180

        # === FIX #3: BATASAN HARGA REALISTIS (FLOOR & CAP) ===
        # Problem: Tanpa batas, Prophet bisa saja memprediksi harga di luar rentang
        # yang masuk akal. Kita set batas atas/bawah berdasarkan distribusi statistik
        # data historis (mean ± 3 standar deviasi), yang mencakup 99.7% nilai normal.
        harga_rata = df['y'].mean()
        harga_std  = df['y'].std()
        # Jika data flat (std ~ 0), beri toleransi 20% dari rata-rata
        if harga_std < 1:
            harga_std = harga_rata * 0.10
        harga_floor = max(0, harga_rata - (harga_std * 3))
        harga_cap   = harga_rata + (harga_std * 3)

        df['floor'] = harga_floor
        df['cap']   = harga_cap

        # 3. Buat dan latih model Prophet
        model = Prophet(
            growth='logistic',             # 'logistic' mengikat prediksi pada floor & cap
            yearly_seasonality=use_yearly, # Hanya aktif jika data >= 6 bulan
            weekly_seasonality=False,      # Nonaktifkan: akhir pekan sudah di-fill, bukan pola asli
            daily_seasonality=False,
            changepoint_prior_scale=0.01,  # Konservatif: harga pangan tidak tiba-tiba berubah drastis
            seasonality_prior_scale=5,
            interval_width=0.80
        )
        model.fit(df)

        # 4. Buat dataframe tanggal masa depan
        future = model.make_future_dataframe(periods=hari, freq='D')
        future['floor'] = harga_floor
        future['cap']   = harga_cap
        forecast = model.predict(future)

        # 5. Ambil prediksi masa depan saja (setelah tanggal data historis terakhir)
        last_date_asli = df_raw['tanggal'].max()
        future_forecast = forecast[forecast['ds'] > last_date_asli][['ds', 'yhat', 'yhat_lower', 'yhat_upper']]

        prediksi = []
        for _, row in future_forecast.iterrows():
            # Klem (clamp) nilai agar benar-benar tidak keluar dari batas floor/cap
            harga_pred = round(min(harga_cap, max(harga_floor, row['yhat'])))
            harga_min  = round(min(harga_cap, max(harga_floor, row['yhat_lower'])))
            harga_max  = round(min(harga_cap, max(harga_floor, row['yhat_upper'])))

            prediksi.append({
                'tanggal'  : row['ds'].strftime('%Y-%m-%d'),
                'harga'    : harga_pred,
                'harga_min': harga_min,
                'harga_max': harga_max
            })

        # 6. Susun data historis ASLI (bukan yang di-fill) untuk dikembalikan ke frontend
        historis = []
        for _, row in df_raw.iterrows():
            historis.append({
                'tanggal': row['tanggal'].strftime('%Y-%m-%d'),
                'harga': float(row['harga'])
            })

        result = {
            'wilayah': wilayah,
            'slug': slug,
            'hari_prediksi': hari,
            'historis': historis,
            'prediksi': prediksi,
            'algoritma': 'prophet',
            'meta': {
                'jumlah_data_asli': len(df_raw),
                'yearly_seasonality_aktif': use_yearly,
                'harga_floor': round(harga_floor),
                'harga_cap': round(harga_cap)
            }
        }

        # Simpan ke cache
        save_to_cache(cache_key, result)

        return jsonify(result)

    except Exception as e:
        app.logger.error(f"Error Prophet: {str(e)}")
        return jsonify({"error": "Terjadi kesalahan pada server Python.", "detail": str(e)}), 500


@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "message": "Prophet API berjalan"})


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=False)
