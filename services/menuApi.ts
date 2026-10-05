import Config from '@/constants/Config';
import axiosInstance from './axiosInstance';

export const BARANG_KET_HARGA = ['NAIK', 'TURUN', 'SAMA', 'BARU'] as const;
export type BarangKetHarga = (typeof BARANG_KET_HARGA)[number];

export function normalizeBarangKetHarga(raw: string | null | undefined): BarangKetHarga | null {
  const u = (raw || '').trim().toUpperCase();
  if (u === 'NAIK' || u === 'TURUN' || u === 'SAMA' || u === 'BARU') return u as BarangKetHarga;
  return null;
}

export function getBarangImageUrl(gambar?: string | null): string | null {
  if (!gambar || typeof gambar !== 'string' || !gambar.trim()) return null;
  const trimmed = gambar.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  const baseUrl = (Config.API_URL || '').replace(/\/api\/?$/, '');
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/uploads/${trimmed}`;
  return `${baseUrl}${cleanPath}`;
}

export interface Barang {
  kd_br: string;
  nama: string;
  kd: string;
  kd_sp: string;
  jenis_produk: string;
  satuan: string;
  status: string;
  HPP: string;
  h_anggota: string;
  h_to: string;
  h_boman: string;
  h_royan: string;
  h_cabang: string;
  h_non: string;
  markup: string;
  s_awal: string;
  j_beli: string;
  j_jual: string;
  r_beli: string;
  r_jual: string;
  d_min: string;
  d_pls: string;
  stok_akhir: string;
  minim_stok: string;
  hpp_beli: string;
  tgl_beli: string | null;
  tgl_jual: string | null;
  kd_hd: string | null;
  qty_hd: string | null;
  qty_br: string | null;
  status_hadiah: string | null;
  sistem_hadiah: string | null;
  ket: string;
  Barcode: string;
  gambar?: string;
}

export interface Gudang {
  kd: string;
  nama: string;
  dept: string;
  counter: string;
  status?: string;
  barang_count?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  total?: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// Laravel: GET /barangs?page&limit&search&kd=
export const getBarangsWithPagination = async (
  page: number = 1,
  limit: number = 20,
  search?: string,
  gudang?: string
): Promise<{ data: Barang[]; total: number; totalPages: number }> => {
  try {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (search?.trim()) {
      params.set('search', search.trim());
    }
    if (gudang?.trim()) {
      params.set('kd', gudang.trim());
    }

    const response = await axiosInstance.get(`/barangs?${params.toString()}`);
    if (response.data && Array.isArray(response.data.data)) {
      const pagination = response.data.pagination || {};
      const total = pagination.total == null ? 0 : Number(pagination.total);
      const totalPages = Number(
        pagination.total_pages ?? (total > 0 ? Math.max(1, Math.ceil(total / limit)) : page)
      );
      return {
        data: response.data.data,
        total,
        totalPages: Number.isFinite(totalPages) && totalPages > 0 ? totalPages : 1,
      };
    }

    return { data: [], total: 0, totalPages: 1 };
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return { data: [], total: 0, totalPages: 1 };
    }
    console.error('Error fetching barangs with pagination:', error);
    throw error;
  }
};

export const getBarangs = async (): Promise<Barang[]> => {
  const response = await axiosInstance.get('/barangs?limit=50');
  return response.data?.data || response.data || [];
};

export const getGudangs = async (): Promise<Gudang[]> => {
  try {
    const response = await axiosInstance.get('/gudangs');
    const rows = response.data?.data || response.data || [];
    if (Array.isArray(rows) && rows.length > 0) {
      return rows;
    }
  } catch (error: any) {
    console.warn('GET /gudangs gagal, fallback /jenis-produk', error?.response?.status);
  }

  try {
    const response = await axiosInstance.get('/jenis-produk');
    if (response.data && response.data.data) {
      return response.data.data;
    }
    return response.data;
  } catch (error: any) {
    console.error('Error fetching gudangs:', error?.response?.status, error?.response?.data || error.message);
    throw error;
  }
};
