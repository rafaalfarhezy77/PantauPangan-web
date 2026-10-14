import { describe, it, expect } from "vitest";
import {
  normalizePrice,
  calculatePercentageChange,
} from "@/lib/api-indonesia/normalizer";

describe("API Indonesia Price Normalization", () => {
  it("harus mengonversi tanda strip '-' menjadi null", () => {
    expect(normalizePrice(null, "-")).toBeNull();
    expect(normalizePrice(undefined, "-")).toBeNull();
    expect(normalizePrice(null, " - ")).toBeNull();
    expect(normalizePrice(null, "")).toBeNull();
  });

  it("harus mem-parsing string angka berformat Rupiah menjadi integer bulat", () => {
    expect(normalizePrice(null, "15.000")).toBe(15000);
    expect(normalizePrice(null, "Rp 24.500")).toBe(24500);
    expect(normalizePrice(null, "12,500")).toBe(12500);
    expect(normalizePrice(null, "18500")).toBe(18500);
  });

  it("harus membulatkan angka float dari properti harga numerik", () => {
    expect(normalizePrice(14999.8, "15000")).toBe(15000);
    expect(normalizePrice(23500.4, null)).toBe(23500);
    expect(normalizePrice(0, null)).toBeNull();
    expect(normalizePrice(-500, null)).toBeNull();
  });

  it("harus menghitung persentase perubahan MoM (Month-over-Month) dengan benar", () => {
    // Kenaikan harga dari 10.000 ke 12.000 (+20%)
    const momIncrease = calculatePercentageChange(12000, 10000);
    expect(momIncrease).toBe(20.0);

    // Penurunan harga dari 20.000 ke 17.500 (-12.5%)
    const momDecrease = calculatePercentageChange(17500, 20000);
    expect(momDecrease).toBe(-12.5);

    // Harga stabil (0%)
    const momStable = calculatePercentageChange(15000, 15000);
    expect(momStable).toBe(0.0);
  });

  it("harus menangani nilai null dan pembagian nol pada perhitungan persentase perubahan", () => {
    expect(calculatePercentageChange(15000, null)).toBeNull();
    expect(calculatePercentageChange(null, 15000)).toBeNull();
    expect(calculatePercentageChange(null, null)).toBeNull();
    expect(calculatePercentageChange(15000, 0)).toBeNull();
    expect(calculatePercentageChange(15000, -100)).toBeNull();
  });
});
