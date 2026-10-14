"use client";

import React from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix icon issue in Leaflet with webpack/Next.js
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export interface ProvincePriceData {
  provinceCode: string;
  provinceName: string;
  lat: number | null;
  lng: number | null;
  price: number | null;
  momChangePct: string | null;
}

interface MapProps {
  provincesData: ProvincePriceData[];
  nationalAverage: number | null;
  commodityName: string;
  level: "konsumen" | "produsen";
}

export default function IndonesiaChoroplethMap({
  provincesData,
  nationalAverage,
  commodityName,
  level,
}: MapProps) {
  // Koordinat tengah kepulauan Indonesia
  const center: [number, number] = [-2.5, 118.0];
  const zoom = 5;

  return (
    <div className="relative w-full h-[450px] sm:h-[520px] rounded-2xl overflow-hidden border border-cream-100 shadow-md">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        className="w-full h-full z-10"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {provincesData.map((prov) => {
          if (!prov.lat || !prov.lng) return null;

          const price = prov.price;
          let diffPct = 0;
          let color = "#94a3b8"; // default slate
          let fillColor = "#cbd5e1";

          if (price && nationalAverage && nationalAverage > 0) {
            diffPct = Math.round(((price - nationalAverage) / nationalAverage) * 100);

            if (level === "konsumen") {
              if (diffPct > 10) {
                // Sangat mahal di tingkat konsumen: Waspada Merah
                color = "#dc2626";
                fillColor = "#ef4444";
              } else if (diffPct > 3) {
                // Sedikit di atas rata-rata: Oranye
                color = "#d97706";
                fillColor = "#f59e0b";
              } else if (diffPct < -5) {
                // Murah di bawah nasional: Hijau
                color = "#15803d";
                fillColor = "#22c55e";
              } else {
                // Normal / mendekati rata-rata nasional
                color = "#2D6A4F";
                fillColor = "#52B788";
              }
            } else {
              // Tingkat produsen (harga tinggi menguntungkan petani produsen)
              if (diffPct > 10) {
                color = "#15803d";
                fillColor = "#22c55e";
              } else if (diffPct < -10) {
                color = "#dc2626";
                fillColor = "#ef4444";
              } else {
                color = "#2D6A4F";
                fillColor = "#52B788";
              }
            }
          }

          return (
            <CircleMarker
              key={prov.provinceCode}
              center={[prov.lat, prov.lng]}
              radius={price ? 12 : 6}
              pathOptions={{
                color,
                fillColor,
                fillOpacity: 0.75,
                weight: 2,
              }}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
                <div className="text-xs font-sans">
                  <div className="font-bold text-slate-800">{prov.provinceName}</div>
                  {price ? (
                    <div>
                      <span className="text-slate-600">Harga: </span>
                      <span className="font-mono font-bold text-slate-900">
                        Rp {price.toLocaleString("id-ID")}
                      </span>
                      {nationalAverage ? (
                        <div
                          className={`text-[10px] font-semibold ${
                            diffPct > 0 ? "text-red-600" : "text-emerald-700"
                          }`}
                        >
                          {diffPct > 0 ? `+${diffPct}%` : `${diffPct}%`} thd rata-rata nasional
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">Data belum tersedia</span>
                  )}
                </div>
              </Tooltip>

              <Popup>
                <div className="p-1 text-xs font-sans max-w-[200px]">
                  <div className="font-bold text-sm text-forest-900 mb-1">
                    {prov.provinceName}
                  </div>
                  <div className="text-[11px] text-slate-500 mb-2 capitalize">
                    {commodityName} ({level})
                  </div>
                  {price ? (
                    <div className="space-y-1">
                      <div className="text-base font-bold font-mono text-slate-900">
                        Rp {price.toLocaleString("id-ID")}
                      </div>
                      {prov.momChangePct && (
                        <div className="text-[11px] text-slate-600">
                          Perubahan MoM:{" "}
                          <span className="font-bold">{prov.momChangePct}%</span>
                        </div>
                      )}
                      {nationalAverage && (
                        <div className="text-[11px] text-slate-600">
                          Selisih vs Nasional:{" "}
                          <span
                            className={`font-bold ${
                              diffPct > 0 ? "text-red-600" : "text-emerald-700"
                            }`}
                          >
                            {diffPct > 0 ? `+Rp ${(price - nationalAverage).toLocaleString("id-ID")}` : `-Rp ${(nationalAverage - price).toLocaleString("id-ID")}`}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-slate-400 italic">
                      Belum ada laporan data harga pada bulan ini.
                    </div>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Legenda Peta Interaktif */}
      <div className="absolute bottom-4 right-4 z-20 bg-white/95 backdrop-blur-md p-3 rounded-xl border border-cream-100 shadow-lg text-[11px] space-y-1.5 font-sans">
        <div className="font-bold text-slate-800 text-xs mb-1">
          Sebaran Harga vs Nasional
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-500 inline-block"></span>
          <span>&gt; +10% Lebih Tinggi (Mahal)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-forest-500 inline-block"></span>
          <span>Mendekati Rata-rata Nasional</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-emerald-500 inline-block"></span>
          <span>&gt; -5% Lebih Terjangkau</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <span className="h-2 w-2 rounded-full bg-slate-300 inline-block"></span>
          <span>Data Belum Tersedia</span>
        </div>
      </div>
    </div>
  );
}
