/**
 * Helper modul normalisasi data API Indonesia dan pemetaan status anomali pangan
 */

export function normalizePrice(
  harga: number | null | undefined,
  hargaRaw?: string | null
): number | null {
  if (harga !== null && harga !== undefined) {
    const rounded = Math.round(Number(harga));
    return !isNaN(rounded) && rounded > 0 ? rounded : null;
  }

  if (hargaRaw && hargaRaw.trim() !== "" && hargaRaw.trim() !== "-") {
    const digitsOnly = hargaRaw.replace(/[^\d]/g, "");
    if (!digitsOnly) return null;
    const parsed = parseInt(digitsOnly, 10);
    return !isNaN(parsed) && parsed > 0 ? parsed : null;
  }

  return null;
}

export function calculatePercentageChange(
  currentPrice: number | null,
  previousPrice: number | null
): number | null {
  if (currentPrice === null || previousPrice === null || previousPrice <= 0) {
    return null;
  }

  const change = ((currentPrice - previousPrice) / previousPrice) * 100;
  return Number(change.toFixed(2));
}

export function calculateSpreadMargin(
  konsumen: number | null,
  produsen: number | null
): number | null {
  if (konsumen === null || produsen === null || produsen <= 0) {
    return null;
  }
  const spread = ((konsumen - produsen) / produsen) * 100;
  return Number(spread.toFixed(2));
}

export type AnomalySeverity = "normal" | "warning" | "alert_low" | "alert_high";

export interface AnomalyMappingResult {
  severity: AnomalySeverity;
  label: string;
}

export function mapAnomalySeverity(
  status: string | null | undefined,
  qipa?: number | null,
  ifpa?: number | null
): AnomalyMappingResult {
  const normStatus = (status || "").toLowerCase().trim();

  // 1. Cek status tekstual resmi
  if (normStatus.includes("alert (high price)") || normStatus.includes("high price")) {
    return { severity: "alert_high", label: "Alert (High Price)" };
  }

  if (normStatus.includes("alert (low price)") || normStatus.includes("low price")) {
    return { severity: "alert_low", label: "Alert (Low Price)" };
  }

  if (normStatus.includes("warning") || normStatus.includes("waspada")) {
    return { severity: "warning", label: "Warning (Waspada)" };
  }

  // 2. Evaluasi indeks numerik jika status teks tidak ada atau normal
  if (ifpa !== null && ifpa !== undefined) {
    if (ifpa >= 10.0) return { severity: "alert_high", label: "Alert (High Price)" };
    if (ifpa <= -10.0) return { severity: "alert_low", label: "Alert (Low Price)" };
    if (ifpa >= 5.0 || ifpa <= -5.0) return { severity: "warning", label: "Warning (Waspada)" };
  }

  if (qipa !== null && qipa !== undefined) {
    if (qipa >= 10.0) return { severity: "alert_high", label: "Alert (High Price)" };
    if (qipa <= -10.0) return { severity: "alert_low", label: "Alert (Low Price)" };
    if (qipa >= 5.0 || qipa <= -5.0) return { severity: "warning", label: "Warning (Waspada)" };
  }

  return { severity: "normal", label: "Normal" };
}
