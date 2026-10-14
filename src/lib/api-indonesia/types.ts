export type TingkatHarga = "konsumen" | "produsen";
export type WilayahHarga = "nasional" | "provinsi";

export interface PaginationMeta {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ApiIndonesiaResponse<T> {
  data: T;
  meta?: PaginationMeta;
  success?: boolean;
  message?: string;
}

export interface HargaPanganSummaryItem {
  tingkat: TingkatHarga;
  wilayah: WilayahHarga;
  komoditas: number;
  rows: number;
  dari: string; // format 'YYYY-MM'
  sampai: string; // format 'YYYY-MM'
}

export interface HargaPanganItem {
  tingkat: TingkatHarga;
  wilayah: WilayahHarga;
  kode_provinsi: string | null;
  provinsi: string | null;
  komoditas: string;
  tanggal: string; // 'YYYY-MM'
  harga: number | null;
  harga_raw: string | null;
}

export interface HargaPanganAnomaliItem {
  tanggal: string; // 'YYYY-MM'
  komoditas: string;
  qipa: number;
  aipa: number;
  ifpa: number;
  status: string;
}

export interface ProvinsiItem {
  id?: string | number;
  code?: string;
  kode?: string;
  name?: string;
  nama?: string;
  alt_name?: string | null;
  lat?: number | null;
  latitude?: number | null;
  lng?: number | null;
  longitude?: number | null;
}

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "MISSING_API_KEY"
  | "INVALID_API_KEY"
  | "QUOTA_EXCEEDED"
  | "INSUFFICIENT_CREDITS"
  | "RATE_LIMIT_EXCEEDED"
  | "NOT_FOUND"
  | string;

export interface ApiIndonesiaErrorPayload {
  error: {
    code: ApiErrorCode;
    message: string;
  };
}

export class ApiIndonesiaException extends Error {
  code: ApiErrorCode;
  status: number;

  constructor(code: ApiErrorCode, message: string, status: number) {
    super(`[API Indonesia ${code}] ${message} (Status: ${status})`);
    this.name = "ApiIndonesiaException";
    this.code = code;
    this.status = status;
  }
}
