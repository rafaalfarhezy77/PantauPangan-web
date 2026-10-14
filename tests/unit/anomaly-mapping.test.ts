import { describe, it, expect } from "vitest";
import { mapAnomalySeverity } from "@/lib/api-indonesia/normalizer";

describe("Food Price Anomaly Mapping", () => {
  it("harus memetakan status teks 'Alert (High Price)' dengan tingkat alert_high", () => {
    const result = mapAnomalySeverity("Alert (High Price)");
    expect(result.severity).toBe("alert_high");
    expect(result.label).toBe("Alert (High Price)");
  });

  it("harus memetakan status teks 'Alert (Low Price)' dengan tingkat alert_low", () => {
    const result = mapAnomalySeverity("Alert (Low Price)");
    expect(result.severity).toBe("alert_low");
    expect(result.label).toBe("Alert (Low Price)");
  });

  it("harus memetakan status teks 'Warning' atau 'Waspada' dengan tingkat warning", () => {
    const result1 = mapAnomalySeverity("Warning");
    expect(result1.severity).toBe("warning");

    const result2 = mapAnomalySeverity("Kondisi Waspada");
    expect(result2.severity).toBe("warning");
  });

  it("harus mengevaluasi indeks IFPA/QIPA jika status teks kosong atau Normal", () => {
    // IFPA positif tinggi (+12.5) -> alert_high
    const highAnomaly = mapAnomalySeverity("Normal", 12.5, 14.0);
    expect(highAnomaly.severity).toBe("alert_high");

    // IFPA negatif tajam (-15.2) -> alert_low (anjlok saat panen)
    const lowAnomaly = mapAnomalySeverity(null, -11.0, -15.2);
    expect(lowAnomaly.severity).toBe("alert_low");

    // IFPA moderat (+6.5) -> warning
    const warningAnomaly = mapAnomalySeverity(null, 6.5, null);
    expect(warningAnomaly.severity).toBe("warning");
  });

  it("harus mengembalikan status 'normal' jika indeks stabil dalam rentang aman", () => {
    const normal = mapAnomalySeverity("Normal", 1.2, 0.8);
    expect(normal.severity).toBe("normal");
    expect(normal.label).toBe("Normal");
  });
});
