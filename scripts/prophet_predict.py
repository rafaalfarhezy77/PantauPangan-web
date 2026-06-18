#!/usr/bin/env python3
"""
prophet_predict.py
------------------
Flask server untuk prediksi harga komoditas menggunakan algoritma Prophet.
Jalankan manual dengan: python scripts/prophet_predict.py

Endpoints:
  GET  /health                      - cek status server
  POST /predict                     - prediksi via JSON body
  GET  /predict?komoditas=...&...   - prediksi via query string (kompatibilitas)

Format request POST (JSON body):
{
    "komoditas": "bawang",
    "provinsi":  "Nasional",
    "days":      30,
    "historis":  [{"tanggal": "2024-01-01", "harga": 12000}, ...]
}

Format response:
{
    "prediksi":          [{"tanggal": "...", "harga": 12500, "harga_bawah": ..., "harga_atas": ...}],
    "algoritma":         "prophet",
    "konfigurasi":       "full|weekly_only|trend_only",
    "data_points":       123,
    "rentang_historis_hari": 365
}
"""

import os
import sys
import json
import logging
import warnings

warnings.filterwarnings("ignore")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger(__name__)

from flask import Flask, request, jsonify

app = Flask(__name__)


# ─── Fungsi Prophet ───────────────────────────────────────────────────────────

def build_prophet_config(n_rows: int, date_span_days: int) -> dict:
    """
    Tentukan konfigurasi Prophet secara adaptif berdasarkan
    jumlah data dan rentang waktu data historis.
    """
    config = {
        "daily_seasonality": False,
        "changepoint_prior_scale": 0.05,
        "seasonality_prior_scale": 10.0,
        "seasonality_mode": "additive",
    }

    if date_span_days >= 365:
        config["yearly_seasonality"] = True
        config["weekly_seasonality"] = True
        config["label"] = "full"
    elif date_span_days >= 60:
        config["yearly_seasonality"] = False
        config["weekly_seasonality"] = True
        config["label"] = "weekly_only"
    else:
        config["yearly_seasonality"] = False
        config["weekly_seasonality"] = False
        config["changepoint_prior_scale"] = 0.15
        config["label"] = "trend_only"

    return config


def run_prophet(historis: list, days: int) -> dict:
    """Jalankan prediksi menggunakan Facebook Prophet dengan konfigurasi adaptif."""
    try:
        import pandas as pd
        from prophet import Prophet
    except ImportError as e:
        return {"error": f"Dependensi tidak ditemukan: {e}"}

    if len(historis) < 2:
        return {"error": "Data historis tidak cukup (minimal 2 titik data)."}

    import pandas as pd

    df = pd.DataFrame(historis)
    df["ds"] = pd.to_datetime(df["tanggal"])
    df["y"] = pd.to_numeric(df["harga"], errors="coerce")
    df = df.dropna(subset=["ds", "y"]).sort_values("ds").reset_index(drop=True)

    if len(df) < 2:
        return {"error": "Data historis tidak valid setelah pembersihan."}

    date_span_days = (df["ds"].max() - df["ds"].min()).days
    n_rows = len(df)

    cfg = build_prophet_config(n_rows, date_span_days)
    log.info(f"Prophet config: {cfg['label']} | {n_rows} titik | rentang {date_span_days} hari")

    model = Prophet(
        yearly_seasonality=cfg["yearly_seasonality"],
        weekly_seasonality=cfg["weekly_seasonality"],
        daily_seasonality=cfg["daily_seasonality"],
        changepoint_prior_scale=cfg["changepoint_prior_scale"],
        seasonality_prior_scale=cfg["seasonality_prior_scale"],
        seasonality_mode=cfg["seasonality_mode"],
    )
    model.fit(df[["ds", "y"]])

    future   = model.make_future_dataframe(periods=days, freq="D")
    forecast = model.predict(future)

    last_date       = df["ds"].max()
    future_forecast = forecast[forecast["ds"] > last_date].copy()

    y_min = df["y"].min() * 0.5
    y_max = df["y"].max() * 2.0

    prediksi = []
    for _, row in future_forecast.iterrows():
        harga = int(round(max(y_min, min(row["yhat"], y_max))))
        harga = max(harga, 0)
        prediksi.append({
            "tanggal":     row["ds"].strftime("%Y-%m-%d"),
            "harga":       harga,
            "harga_bawah": int(round(max(0, row["yhat_lower"]))),
            "harga_atas":  int(round(max(0, row["yhat_upper"]))),
        })

    return {
        "prediksi":              prediksi,
        "algoritma":             "prophet",
        "konfigurasi":           cfg["label"],
        "data_points":           n_rows,
        "rentang_historis_hari": date_span_days,
    }


# ─── Endpoints Flask ──────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "prophet-predict"}), 200


@app.route("/predict", methods=["GET", "POST"])
def predict():
    try:
        if request.method == "POST":
            body = request.get_json(force=True) or {}
        else:
            # GET: terima historis dari query string (opsional) atau body
            body = request.args.to_dict()

        historis = body.get("historis", [])
        days     = int(body.get("days", 30))

        if not historis:
            return jsonify({"error": "Parameter 'historis' wajib diisi (array data tanggal & harga)."}), 422

        log.info(f"Prediksi diminta: {len(historis)} titik data, {days} hari ke depan")
        result = run_prophet(historis, days)

        if "error" in result:
            return jsonify(result), 422

        log.info(f"Prediksi selesai: {len(result.get('prediksi', []))} titik, konfigurasi={result.get('konfigurasi')}")
        return jsonify(result), 200

    except Exception as e:
        log.exception("Unexpected error saat prediksi")
        return jsonify({"error": str(e)}), 500


# ─── Entry point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.environ.get("PROPHET_PORT", 5000))
    log.info(f"Memulai Prophet Flask server di http://0.0.0.0:{port}")
    log.info("Tekan Ctrl+C untuk menghentikan server")
    app.run(host="0.0.0.0", port=port, debug=False)
