import {
  ApiIndonesiaResponse,
  ApiIndonesiaException,
  HargaPanganSummaryItem,
  HargaPanganItem,
  HargaPanganAnomaliItem,
  ProvinsiItem,
  TingkatHarga,
  WilayahHarga,
} from "./types";

class RateLimiter {
  private lastRequestTime = 0;
  private minIntervalMs = 100; // max 10 requests per second

  async throttle(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.minIntervalMs) {
      const waitTime = this.minIntervalMs - elapsed;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
    this.lastRequestTime = Date.now();
  }
}

const throttler = new RateLimiter();

export class ApiIndonesiaClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl =
      process.env.API_INDONESIA_BASE_URL?.replace(/\/+$/, "") ||
      "https://use.apiindonesia.id";
    this.apiKey = process.env.API_INDONESIA_KEY || "";
  }

  private async request<T>(
    path: string,
    query?: Record<string, string | number | undefined>
  ): Promise<ApiIndonesiaResponse<T>> {
    if (!this.apiKey) {
      throw new ApiIndonesiaException(
        "MISSING_API_KEY",
        "API_INDONESIA_KEY environment variable is not configured",
        401
      );
    }

    const url = new URL(`${this.baseUrl}${path}`);
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== null && v !== "") {
          url.searchParams.append(k, String(v));
        }
      }
    }

    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      attempt++;
      await throttler.throttle();

      try {
        const res = await fetch(url.toString(), {
          method: "GET",
          headers: {
            "x-api-key": this.apiKey,
            Accept: "application/json",
          },
          cache: "no-store",
        });

        if (res.ok) {
          const json = await res.json();
          // API Indonesia might return { data: [...], meta: {...} } or directly array
          if (Array.isArray(json)) {
            return { data: json as unknown as T };
          }
          return json as ApiIndonesiaResponse<T>;
        }

        // Special handling for 402: Insufficient credits or quota exceeded
        if (res.status === 402) {
          const errBody = await res.json().catch(() => ({}));
          const message =
            errBody?.error?.message ||
            "API Indonesia credits depleted or quota exceeded.";
          throw new ApiIndonesiaException(
            "INSUFFICIENT_CREDITS",
            message,
            402
          );
        }

        // Rate limit 429
        if (res.status === 429) {
          if (attempt >= maxRetries) {
            throw new ApiIndonesiaException(
              "RATE_LIMIT_EXCEEDED",
              "Too many requests to API Indonesia, retry limit reached.",
              429
            );
          }
          const backoff = Math.pow(2, attempt) * 500;
          console.warn(`[ApiIndonesiaClient] 429 Rate limited. Backing off ${backoff}ms...`);
          await new Promise((resolve) => setTimeout(resolve, backoff));
          continue;
        }

        // Other errors
        const errorJson = await res.json().catch(() => null);
        const errorCode = errorJson?.error?.code || `HTTP_${res.status}`;
        const errorMsg =
          errorJson?.error?.message ||
          `Request to API Indonesia failed with status ${res.status}`;

        // Don't retry on 4xx client errors (e.g. 401, 403, 404)
        if (res.status >= 400 && res.status < 500) {
          throw new ApiIndonesiaException(errorCode, errorMsg, res.status);
        }

        // 5xx errors: retry with backoff
        if (attempt >= maxRetries) {
          throw new ApiIndonesiaException(errorCode, errorMsg, res.status);
        }
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 400)
        );
      } catch (err: unknown) {
        if (err instanceof ApiIndonesiaException) {
          throw err;
        }
        if (attempt >= maxRetries) {
          throw new ApiIndonesiaException(
            "NETWORK_ERROR",
            (err as Error).message || "Network request failed",
            500
          );
        }
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 300)
        );
      }
    }

    throw new ApiIndonesiaException(
      "UNKNOWN_ERROR",
      "Failed to fetch data from API Indonesia after retries",
      500
    );
  }

  /**
   * GET /api/v1/harga-pangan
   * Mengambil ringkasan cakupan dataset seluruh seri pangan (1 hit = 2 kredit)
   */
  async getSeriesSummary(): Promise<ApiIndonesiaResponse<HargaPanganSummaryItem[]>> {
    return this.request<HargaPanganSummaryItem[]>("/api/v1/harga-pangan");
  }

  /**
   * GET /api/v1/harga-pangan/harga
   * Mengambil data historis bulanan harga komoditas pangan
   */
  async getMonthlyPrices(params: {
    tingkat?: TingkatHarga;
    wilayah?: WilayahHarga;
    komoditas?: string;
    provinsi?: string;
    dari?: string;
    sampai?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiIndonesiaResponse<HargaPanganItem[]>> {
    const query: Record<string, string | number | undefined> = {
      tingkat: params.tingkat,
      wilayah: params.wilayah,
      komoditas: params.komoditas,
      provinsi: params.provinsi,
      dari: params.dari,
      sampai: params.sampai,
      page: params.page ?? 1,
      limit: params.limit ?? 100, // default 100 to maximize rows per 2 credits
    };
    return this.request<HargaPanganItem[]>("/api/v1/harga-pangan/harga", query);
  }

  /**
   * GET /api/v1/harga-pangan/anomali
   * Mengambil data indikator anomali harga (QIPA, AIPA, IFPA, Status)
   */
  async getPriceAnomalies(params?: {
    komoditas?: string;
    dari?: string;
    sampai?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiIndonesiaResponse<HargaPanganAnomaliItem[]>> {
    const query: Record<string, string | number | undefined> = {
      komoditas: params?.komoditas,
      dari: params?.dari,
      sampai: params?.sampai,
      page: params?.page ?? 1,
      limit: params?.limit ?? 100,
    };
    return this.request<HargaPanganAnomaliItem[]>(
      "/api/v1/harga-pangan/anomali",
      query
    );
  }

  /**
   * GET /api/v1/wilayah/provinsi
   * Mengambil master data 38 provinsi di Indonesia
   */
  async getProvinces(): Promise<ApiIndonesiaResponse<ProvinsiItem[]>> {
    return this.request<ProvinsiItem[]>("/api/v1/wilayah/provinsi", {
      page: 1,
      per_page: 100,
    });
  }
}

export const apiIndonesiaClient = new ApiIndonesiaClient();
