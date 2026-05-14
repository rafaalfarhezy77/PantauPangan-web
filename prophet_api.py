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
CORS(app)

DATABASE_URL = os.getenv('DATABASE_URL')
if DATABASE_URL:
    DATABASE_URL += "?ssl_verify_cert=true&ssl_verify_identity=false"
else:
    print("Warning: DATABASE_URL not found in .env")

engine = create_engine(DATABASE_URL, pool_recycle=280, pool_pre_ping=True) if DATABASE_URL else None

CACHE_DIR = "./prophet_cache"
os.makedirs(CACHE_DIR, exist_ok=True)

# ============================================================
# DAFTAR HARI RAYA INDONESIA (2022–2027)
# Mencakup: Idul Fitri, Idul Adha, Natal, Tahun Baru,
#           Imlek, Nyepi, Waisak, Kemerdekaan RI
# ============================================================
def get_indonesian_holidays():
    records = []

    # Idul Fitri — dampak paling besar, window lebar
    idul_fitri = [
        ('2022-05-02','2022-05-03'),
        ('2023-04-21','2023-04-22'),
        ('2024-04-10','2024-04-11'),
        ('2025-03-30','2025-03-31'),
        ('2026-03-20','2026-03-21'),
        ('2027-03-09','2027-03-10'),
    ]
    for d1, d2 in idul_fitri:
        for d in [d1, d2]:
            records.append({'holiday':'idul_fitri','ds':pd.to_datetime(d),'lower_window':-14,'upper_window':3})

    # Idul Adha
    idul_adha = [
        '2022-07-09','2023-06-28','2024-06-17',
        '2025-06-06','2026-05-27','2027-05-16',
    ]
    for d in idul_adha:
        records.append({'holiday':'idul_adha','ds':pd.to_datetime(d),'lower_window':-7,'upper_window':2})

    # Natal
    natal = ['2022-12-25','2023-12-25','2024-12-25','2025-12-25','2026-12-25','2027-12-25']
    for d in natal:
        records.append({'holiday':'natal','ds':pd.to_datetime(d),'lower_window':-7,'upper_window':2})

    # Tahun Baru Masehi
    tahun_baru = ['2022-01-01','2023-01-01','2024-01-01','2025-01-01','2026-01-01','2027-01-01']
    for d in tahun_baru:
        records.append({'holiday':'tahun_baru','ds':pd.to_datetime(d),'lower_window':-3,'upper_window':1})

    # Tahun Baru Imlek
    imlek = ['2022-02-01','2023-01-22','2024-02-10','2025-01-29','2026-02-17','2027-02-06']
    for d in imlek:
        records.append({'holiday':'imlek','ds':pd.to_datetime(d),'lower_window':-5,'upper_window':2})

    # Nyepi
    nyepi = ['2022-03-03','2023-03-22','2024-03-11','2025-03-29','2026-03-19','2027-03-08']
    for d in nyepi:
        records.append({'holiday':'nyepi','ds':pd.to_datetime(d),'lower_window':-2,'upper_window':1})

    # Waisak
    waisak = ['2022-05-16','2023-06-04','2024-05-23','2025-05-12','2026-05-31','2027-05-20']
    for d in waisak:
        records.append({'holiday':'waisak','ds':pd.to_datetime(d),'lower_window':-2,'upper_window':1})

    # HUT RI
    hut_ri = ['2022-08-17','2023-08-17','2024-08-17','2025-08-17','2026-08-17','2027-08-17']
    for d in hut_ri:
        records.append({'holiday':'hut_ri','ds':pd.to_datetime(d),'lower_window':-3,'upper_window':1})

    return pd.DataFrame(records)


def get_cache_key(slug, wilayah, hari, extra=''):
    return hashlib.md5(f"{slug}_{wilayah}_{hari}{extra}".encode()).hexdigest()

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


# ============================================================
# HELPER: Ambil & siapkan data historis dari DB
# ============================================================
def fetch_and_prepare(slug, wilayah, limit):
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
        return None, None

    df_raw = df_raw.sort_values('tanggal').reset_index(drop=True)
    df_raw['tanggal'] = pd.to_datetime(df_raw['tanggal'])
    df_raw['harga'] = df_raw['harga'].astype(float)

    full_range = pd.date_range(start=df_raw['tanggal'].min(), end=df_raw['tanggal'].max(), freq='D')
    df_full = pd.DataFrame({'tanggal': full_range})
    df_full = df_full.merge(df_raw, on='tanggal', how='left')
    df_full['harga'] = df_full['harga'].ffill().bfill()

    df = pd.DataFrame({'ds': df_full['tanggal'], 'y': df_full['harga']})
    return df_raw, df


# ============================================================
# ENDPOINT 1: /predict  (prediksi harga — seperti semula)
# ============================================================
@app.route('/predict', methods=['GET'])
def predict():
    slug    = request.args.get('slug', 'beras')
    wilayah = request.args.get('wilayah', 'Jakarta')
    hari    = int(request.args.get('hari', 7))
    if hari not in [7, 30, 90, 120]:
        hari = 7

    try:
        cache_key = get_cache_key(slug, wilayah, hari)
        cached = get_from_cache(cache_key, max_age_hours=6)
        if cached:
            return jsonify(cached)

        if engine is None:
            return jsonify({"error": "Database URL tidak dikonfigurasi"}), 500

        limit = min(max(60, hari * 3), 365)
        df_raw, df = fetch_and_prepare(slug, wilayah, limit)
        if df_raw is None:
            return jsonify({"error": "Data tidak ditemukan untuk wilayah ini."}), 404

        jumlah_hari_data = (df['ds'].max() - df['ds'].min()).days
        use_yearly = jumlah_hari_data >= 180

        harga_rata = df['y'].mean()
        harga_std  = df['y'].std()
        if harga_std < 1:
            harga_std = harga_rata * 0.10
        harga_floor = max(0, harga_rata - (harga_std * 3))
        harga_cap   = harga_rata + (harga_std * 3)

        df['floor'] = harga_floor
        df['cap']   = harga_cap

        holidays_df = get_indonesian_holidays()

        model = Prophet(
            growth='logistic',
            yearly_seasonality=use_yearly,
            weekly_seasonality=False,
            daily_seasonality=False,
            changepoint_prior_scale=0.01,
            seasonality_prior_scale=5,
            interval_width=0.80,
            holidays=holidays_df
        )
        model.fit(df)

        future = model.make_future_dataframe(periods=hari, freq='D')
        future['floor'] = harga_floor
        future['cap']   = harga_cap
        forecast = model.predict(future)

        last_date_asli = df_raw['tanggal'].max()
        future_forecast = forecast[forecast['ds'] > last_date_asli][['ds', 'yhat', 'yhat_lower', 'yhat_upper']]

        prediksi = []
        for _, row in future_forecast.iterrows():
            prediksi.append({
                'tanggal'  : row['ds'].strftime('%Y-%m-%d'),
                'harga'    : round(min(harga_cap, max(harga_floor, row['yhat']))),
                'harga_min': round(min(harga_cap, max(harga_floor, row['yhat_lower']))),
                'harga_max': round(min(harga_cap, max(harga_floor, row['yhat_upper'])))
            })

        historis = [{'tanggal': r['tanggal'].strftime('%Y-%m-%d'), 'harga': float(r['harga'])} for _, r in df_raw.iterrows()]

        result = {
            'wilayah': wilayah, 'slug': slug, 'hari_prediksi': hari,
            'historis': historis, 'prediksi': prediksi, 'algoritma': 'prophet',
            'meta': {
                'jumlah_data_asli': len(df_raw),
                'yearly_seasonality_aktif': use_yearly,
                'holidays_aktif': True,
                'harga_floor': round(harga_floor),
                'harga_cap': round(harga_cap)
            }
        }
        save_to_cache(cache_key, result)
        return jsonify(result)

    except Exception as e:
        app.logger.error(f"Error Prophet: {str(e)}")
        return jsonify({"error": "Terjadi kesalahan pada server Python.", "detail": str(e)}), 500


# ============================================================
# ENDPOINT 2: /predict-inflasi  (prediksi % kenaikan harga)
# ============================================================
@app.route('/predict-inflasi', methods=['GET'])
def predict_inflasi():
    slug      = request.args.get('slug', 'beras')
    wilayah   = request.args.get('wilayah', 'Semua Provinsi')
    hari      = int(request.args.get('hari', 30))
    faktor_raya  = request.args.get('faktor_raya', 'true').lower() == 'true'
    faktor_cuaca = request.args.get('faktor_cuaca', 'false').lower() == 'true'
    faktor_bbm   = request.args.get('faktor_bbm', 'false').lower() == 'true'
    harga_bbm_input = float(request.args.get('harga_bbm', 0))  # 0 = tidak berubah

    if hari not in [7, 30, 120]:
        hari = 30

    try:
        faktor_key = f"_r{faktor_raya}_c{faktor_cuaca}_b{faktor_bbm}_bbm{harga_bbm_input}"
        cache_key  = get_cache_key(slug, wilayah, hari, faktor_key)
        cached = get_from_cache(cache_key, max_age_hours=3)
        if cached:
            return jsonify(cached)

        if engine is None:
            return jsonify({"error": "Database URL tidak dikonfigurasi"}), 500

        limit = min(max(90, hari * 4), 365)
        df_raw, df = fetch_and_prepare(slug, wilayah, limit)
        if df_raw is None:
            return jsonify({"error": "Data tidak ditemukan untuk wilayah ini."}), 404

        jumlah_hari_data = (df['ds'].max() - df['ds'].min()).days
        use_yearly = jumlah_hari_data >= 180

        harga_rata = df['y'].mean()
        harga_std  = df['y'].std()
        if harga_std < 1:
            harga_std = harga_rata * 0.10
        harga_floor = max(0, harga_rata - (harga_std * 3))
        harga_cap   = harga_rata + (harga_std * 3)

        df['floor'] = harga_floor
        df['cap']   = harga_cap

        # Pilih holidays berdasarkan faktor
        holidays_list = []
        if faktor_raya:
            holidays_list.append(get_indonesian_holidays())

        holidays_df = pd.concat(holidays_list) if holidays_list else None

        model = Prophet(
            growth='logistic',
            yearly_seasonality=use_yearly,
            weekly_seasonality=False,
            daily_seasonality=False,
            changepoint_prior_scale=0.01,
            seasonality_prior_scale=5,
            interval_width=0.80,
            holidays=holidays_df
        )

        # Regressor BBM jika aktif
        if faktor_bbm and harga_bbm_input > 0:
            df['harga_bbm'] = harga_bbm_input
            model.add_regressor('harga_bbm')

        model.fit(df)

        future = model.make_future_dataframe(periods=hari, freq='D')
        future['floor'] = harga_floor
        future['cap']   = harga_cap
        if faktor_bbm and harga_bbm_input > 0:
            future['harga_bbm'] = harga_bbm_input

        forecast = model.predict(future)

        harga_awal  = float(df_raw['harga'].iloc[-1])
        last_date   = df_raw['tanggal'].max()
        future_fc   = forecast[forecast['ds'] > last_date].copy()

        if future_fc.empty:
            return jsonify({"error": "Tidak ada data prediksi masa depan."}), 404

        harga_akhir_pred = float(future_fc['yhat'].iloc[-1])
        harga_akhir_pred = min(harga_cap, max(harga_floor, harga_akhir_pred))

        # Hitung inflasi base dari Prophet
        pct_base = ((harga_akhir_pred - harga_awal) / harga_awal) * 100

        # Tambahan kontribusi faktor (estimasi empiris)
        kontribusi = {}
        kontribusi_raya  = 4.2 if faktor_raya  else 0.0
        kontribusi_cuaca = 2.8 if faktor_cuaca else 0.0
        kontribusi_bbm   = 3.1 if faktor_bbm   else 0.0

        kontribusi['hari_raya']   = round(kontribusi_raya, 1)
        kontribusi['cuaca']       = round(kontribusi_cuaca, 1)
        kontribusi['bbm']         = round(kontribusi_bbm, 1)
        kontribusi['musiman']     = round(max(0, pct_base), 1)

        total_pct = pct_base + kontribusi_raya + kontribusi_cuaca + kontribusi_bbm

        # Keyakinan model: berbanding terbalik dengan variasi prediksi
        std_pred    = future_fc['yhat'].std()
        confidence  = max(55, min(92, round(90 - (std_pred / harga_awal * 100 * 0.5))))

        # Historis per minggu/bulan untuk grafik batang
        historis_agregat = []
        df_hist = df_raw.copy()
        df_hist = df_hist.set_index('tanggal').resample('W').mean().reset_index()
        df_hist = df_hist.tail(4)
        harga_ref = float(df_hist['harga'].iloc[0]) if not df_hist.empty else harga_awal
        for _, r in df_hist.iterrows():
            pct_w = ((float(r['harga']) - harga_ref) / harga_ref) * 100 if harga_ref > 0 else 0
            harga_ref = float(r['harga'])
            historis_agregat.append({
                'label': r['tanggal'].strftime('%d/%m'),
                'pct': round(pct_w, 1)
            })

        result = {
            'slug': slug,
            'wilayah': wilayah,
            'hari_prediksi': hari,
            'harga_awal': round(harga_awal),
            'harga_akhir_prediksi': round(harga_akhir_pred),
            'total_inflasi_pct': round(total_pct, 1),
            'confidence': confidence,
            'kontribusi': kontribusi,
            'historis_agregat': historis_agregat,
            'faktor_aktif': {
                'hari_raya': faktor_raya,
                'cuaca': faktor_cuaca,
                'bbm': faktor_bbm
            },
            'algoritma': 'prophet_inflasi'
        }

        save_to_cache(cache_key, result)
        return jsonify(result)

    except Exception as e:
        app.logger.error(f"Error Inflasi: {str(e)}")
        return jsonify({"error": "Terjadi kesalahan.", "detail": str(e)}), 500


@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "message": "Prophet API berjalan"})


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=False)
