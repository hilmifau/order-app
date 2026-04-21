import axiosInstance from './axiosInstance';
import { getAuthToken } from './storageService';

export interface PoNotePayload {
  no_tran?: string;
  tgl: string;
  kd_cus: string;
  jam: string;
  nama_adm: string;
  kpb: string;
  ket: string;
  status: string;
  total_po: number;
  jenis: string;
  items?: unknown[];
}

export interface DetailPoNotePayload {
  no_tran: string | number;
  NO_PO?: string | number;
  NO_URUT: string;
  KD_BR: string;
  RASA: string;
  QTY: number;
  SAT: string;
  harga: number;
  subtotal: number;
  kd: string;
  nama_br: string;
}

export const createPoNote = async (payload: PoNotePayload) => {
  const token = await getAuthToken();
  const response = await axiosInstance.post('/po-note', payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const createDetailPoNote = async (payload: DetailPoNotePayload) => {
  const token = await getAuthToken();
  const response = await axiosInstance.post('/detail-po-plg', payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const createOrderWithDetails = async (
  master: PoNotePayload,
  details: DetailPoNotePayload[]
) => {
  const masterResponse = await createPoNote(master);

  for (const detail of details) {
    await createDetailPoNote(detail);
  }

  return masterResponse;
};

/**
 * Mengambil daftar pesanan (header) berdasarkan kode pelanggan
 */
export const getOrdersByCustomer = async (kd_cus: string): Promise<any[]> => {
  try {
    const token = await getAuthToken();
    // Berdasarkan API_COLLECTION.md, kita gunakan /po-note
    const response = await axiosInstance.get(`/po-note?kd_cus=${encodeURIComponent(kd_cus)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    // Jika backend tidak melakukan filtering otomatis, kita filter di client
    if (response.data && response.data.data) {
      const allOrders = response.data.data;
      
      const filtered = allOrders.filter((o: any) => {
        const orderKdCus = (o.kd_cus || o.kdcus || '').toString().trim();
        const targetKdCus = kd_cus.toString().trim();
        return orderKdCus === targetKdCus;
      });
      
      return filtered;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
};

/**
 * Mengambil detail item untuk satu transaksi
 */
export const getOrderDetails = async (no_tran: string | number): Promise<any[]> => {
  try {
    const token = await getAuthToken();
    const headers = {
      Authorization: `Bearer ${token}`,
    };

    const targetNoTran = String(no_tran);
    const matchedDetails: any[] = [];

    // Endpoint detail-po-plg bersifat paginated, jadi ambil semua halaman
    // agar detail transaksi tidak hilang saat data total > 100.
    let page = 1;
    let lastPage = 1;

    do {
      const response = await axiosInstance.get(`/detail-po-plg?per_page=100&page=${page}`, {
        headers,
      });

      const pageData = Array.isArray(response.data?.data) ? response.data.data : [];
      const pageMatches = pageData.filter((d: any) => String(d.no_tran) === targetNoTran);
      matchedDetails.push(...pageMatches);

      const apiLastPage = Number(response.data?.last_page || 1);
      lastPage = Number.isFinite(apiLastPage) && apiLastPage > 0 ? apiLastPage : 1;
      page += 1;
    } while (page <= lastPage);

    return matchedDetails;
  } catch (error) {
    console.error('Error fetching order details:', error);
    throw error;
  }
};
