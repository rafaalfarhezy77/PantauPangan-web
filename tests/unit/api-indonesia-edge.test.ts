import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  normalizePrice,
  calculatePercentageChange,
  calculateSpreadMargin,
  mapAnomalySeverity,
} from "@/lib/api-indonesia/normalizer";
import { mapSeverity } from "@/lib/api-indonesia/sync-engine";
import {
  ApiIndonesiaClient,
} from "@/lib/api-indonesia/client";
import { ApiIndonesiaException } from "@/lib/api-indonesia/types";

describe("API Indonesia Edge Cases & Resiliency Suite", () => {
  const originalEnvKey = process.env.API_INDONESIA_KEY;
  const originalEnvUrl = process.env.API_INDONESIA_BASE_URL;

  beforeEach(() => {
    process.env.API_INDONESIA_KEY = "test-secret-key-xyz";
    process.env.API_INDONESIA_BASE_URL = "https://use.apiindonesia.id";
  });

  afterEach(() => {
    process.env.API_INDONESIA_KEY = originalEnvKey;
    process.env.API_INDONESIA_BASE_URL = originalEnvUrl;
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------
  // SKENARIO 1: Nilai String "-" dan null (Zero Division & NaN Safety)
  // -------------------------------------------------------------
  describe("Skenario 1: Penanganan Nilai Kosong/Strip '-' dan Keamanan Pembagian", () => {
    it("harus menormalkan tanda strip '-', spasi, dan nilai kosong menjadi null", () => {
      expect(normalizePrice(null, "-")).toBeNull();
      expect(normalizePrice(null, " - ")).toBeNull();
      expect(normalizePrice(null, "--")).toBeNull();
      expect(normalizePrice(null, "")).toBeNull();
      expect(normalizePrice(null, "   ")).toBeNull();
      expect(normalizePrice(undefined, "-")).toBeNull();
      expect(normalizePrice(null, null)).toBeNull();
    });

    it("tidak boleh menghasilkan NaN atau Infinity pada perhitungan MoM", () => {
      // Pembagian dengan nol
      expect(calculatePercentageChange(15000, 0)).toBeNull();
      // Pembagian dengan angka negatif atau null
      expect(calculatePercentageChange(15000, -100)).toBeNull();
      expect(calculatePercentageChange(null, 15000)).toBeNull();
      expect(calculatePercentageChange(15000, null)).toBeNull();
      expect(calculatePercentageChange(null, null)).toBeNull();

      const validChange = calculatePercentageChange(16500, 15000);
      expect(validChange).toBe(10.0);
      expect(Number.isFinite(validChange)).toBe(true);
    });

    it("harus menghitung margin spread aman saat produsen 0 atau null", () => {
      expect(calculateSpreadMargin(16000, 0)).toBeNull();
      expect(calculateSpreadMargin(16000, null)).toBeNull();
      expect(calculateSpreadMargin(null, 12000)).toBeNull();
      expect(calculateSpreadMargin(null, null)).toBeNull();

      // Kasus normal: Konsumen 15.000, Produsen 10.000 -> Spread +50%
      const spread = calculateSpreadMargin(15000, 10000);
      expect(spread).toBe(50.0);
    });
  });

  // -------------------------------------------------------------
  // SKENARIO 2: Respons HTTP 402 INSUFFICIENT_CREDITS
  // -------------------------------------------------------------
  describe("Skenario 2: Penanganan Error 402 Insufficient Credits", () => {
    it("harus melempar ApiIndonesiaException dengan code INSUFFICIENT_CREDITS dan status 402", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 402,
        json: async () => ({
          error: {
            code: "INSUFFICIENT_CREDITS",
            message: "Kredit API Indonesia habis atau batas kuota bulanan terlampaui.",
          },
        }),
      });
      vi.stubGlobal("fetch", mockFetch);

      const client = new ApiIndonesiaClient();

      await expect(client.getSeriesSummary()).rejects.toThrow(ApiIndonesiaException);

      try {
        await client.getSeriesSummary();
      } catch (err: unknown) {
        const apiErr = err as ApiIndonesiaException;
        expect(apiErr.code).toBe("INSUFFICIENT_CREDITS");
        expect(apiErr.status).toBe(402);
        expect(apiErr.message).toContain("Kredit API Indonesia habis");
      }
    });

    it("harus menangani 402 dengan pesan default jika respons json error kosong", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 402,
        json: async () => {
          throw new Error("Invalid JSON");
        },
      });
      vi.stubGlobal("fetch", mockFetch);

      const client = new ApiIndonesiaClient();

      try {
        await client.getMonthlyPrices({ tingkat: "konsumen", wilayah: "nasional" });
      } catch (err: unknown) {
        const apiErr = err as ApiIndonesiaException;
        expect(apiErr.code).toBe("INSUFFICIENT_CREDITS");
        expect(apiErr.status).toBe(402);
        expect(apiErr.message).toContain("API Indonesia credits depleted");
      }
    });
  });

  // -------------------------------------------------------------
  // SKENARIO 3: Respons HTTP 429 RATE_LIMIT_EXCEEDED & Exponential Retry
  // -------------------------------------------------------------
  describe("Skenario 3: Penanganan HTTP 429 Rate Limit dengan Exponential Backoff Retry", () => {
    it("harus melakukan retry saat menerima 429 dan berhasil pada percobaan ke-3", async () => {
      let callCount = 0;
      const expectedData = [
        { kode: "11", nama: "Aceh" },
        { kode: "12", nama: "Sumatera Utara" },
      ];

      const mockFetch = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount < 3) {
          return {
            ok: false,
            status: 429,
            json: async () => ({
              error: {
                code: "RATE_LIMIT_EXCEEDED",
                message: "Rate limit 20 req/s exceeded. Please slow down.",
              },
            }),
          };
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: expectedData,
          }),
        };
      });
      vi.stubGlobal("fetch", mockFetch);

      const client = new ApiIndonesiaClient();
      const result = await client.getProvinces();

      expect(callCount).toBe(3);
      expect(result.data).toEqual(expectedData);
    }, 10000); // Allow sufficient timeout for backoff

    it("harus melempar RATE_LIMIT_EXCEEDED setelah mencapai batas retry (3 kali)", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "Too many requests",
          },
        }),
      });
      vi.stubGlobal("fetch", mockFetch);

      const client = new ApiIndonesiaClient();

      await expect(client.getSeriesSummary()).rejects.toThrow(ApiIndonesiaException);

      try {
        await client.getSeriesSummary();
      } catch (err: unknown) {
        const apiErr = err as ApiIndonesiaException;
        expect(apiErr.code).toBe("RATE_LIMIT_EXCEEDED");
        expect(apiErr.status).toBe(429);
      }
    }, 10000);
  });

  // -------------------------------------------------------------
  // SKENARIO 4: Indikator & Anomaly Severity Mapping
  // -------------------------------------------------------------
  describe("Skenario 4: Pemetaan Tingkat Keparahan Anomali (Normal, Warning, Alert)", () => {
    it("harus memetakan status 'Alert (High Price)' dan variannya ke alert_high", () => {
      expect(mapSeverity("Alert (High Price)")).toBe("alert_high");
      expect(mapSeverity("alert (high price)")).toBe("alert_high");
      expect(mapSeverity("High Price Warning")).toBe("alert_high");

      const normResult = mapAnomalySeverity("Alert (High Price)");
      expect(normResult.severity).toBe("alert_high");
    });

    it("harus memetakan status 'Alert (Low Price)' dan variannya ke alert_low", () => {
      expect(mapSeverity("Alert (Low Price)")).toBe("alert_low");
      expect(mapSeverity("alert (low price)")).toBe("alert_low");
      expect(mapSeverity("Low Price Drop")).toBe("alert_low");

      const normResult = mapAnomalySeverity("Alert (Low Price)");
      expect(normResult.severity).toBe("alert_low");
    });

    it("harus memetakan status 'Warning' atau 'Waspada' ke warning", () => {
      expect(mapSeverity("Warning")).toBe("warning");
      expect(mapSeverity("Warning (Waspada)")).toBe("warning");
      expect(mapSeverity("warning")).toBe("warning");

      const normResult = mapAnomalySeverity("Warning (Waspada)");
      expect(normResult.severity).toBe("warning");
    });

    it("harus memetakan status 'Normal' ke normal", () => {
      expect(mapSeverity("Normal")).toBe("normal");
      expect(mapSeverity("Kondisi Stabil")).toBe("normal");

      const normResult = mapAnomalySeverity("Normal");
      expect(normResult.severity).toBe("normal");
    });
  });
});
