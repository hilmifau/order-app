import axiosInstance from './axiosInstance';
import { getAuthToken } from './storageService';

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
    per_page: number;
    total: number;
    total_pages: number;
  };
}

// Get barang dengan pagination dan search
export const getBarangsWithPagination = async (
  page: number = 1,
  limit: number = 10,
  search?: string,
  gudang?: string
): Promise<{ data: Barang[]; total: number; totalPages: number }> => {
  try {
    let url = `/barangs?page=${page}&limit=${limit}`;
    if (search && search.trim()) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    if (gudang && gudang.trim()) {
      url += `&gudang=${encodeURIComponent(gudang)}`;
    }

    const token = await getAuthToken();
    const response = await axiosInstance.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.data && response.data.data) {
      const total = response.data.pagination?.total || response.data.data.length;
      const totalPages = response.data.pagination?.total_pages || Math.ceil(total / limit);

      return {
        data: response.data.data,
        total,
        totalPages,
      };
    }

    return {
      data: response.data,
      total: response.data.length,
      totalPages: 1,
    };
  } catch (error) {
    console.error('Error fetching barangs with pagination:', error);
    throw error;
  }
};

// Get semua barang (legacy, tanpa pagination)
export const getBarangs = async (): Promise<Barang[]> => {
  try {
    const token = await getAuthToken();
    const response = await axiosInstance.get('/barangs', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (response.data && response.data.data) {
      return response.data.data;
    }
    return response.data;
  } catch (error) {
    console.error('Error fetching barangs:', error);
    throw error;
  }
};

// Get gudang (warehouse) list
export const getGudangs = async (): Promise<Gudang[]> => {
  try {
    const token = await getAuthToken();
    const response = await axiosInstance.get('/jenis-produk', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (response.data && response.data.data) {
      return response.data.data;
    }
    return response.data;
  } catch (error: any) {
    console.error('Error fetching gudangs:', error?.response?.status, error?.response?.data || error.message);
    throw error;
  }
};
