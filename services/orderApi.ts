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
    
    console.log(`Fetching orders for: [${kd_cus}]`);
    
    // Jika backend tidak melakukan filtering otomatis, kita filter di client
    if (response.data && response.data.data) {
      const allOrders = response.data.data;
      console.log(`Total orders from API: ${allOrders.length}`);
      
      const filtered = allOrders.filter((o: any) => {
        const orderKdCus = (o.kd_cus || o.kdcus || '').toString().trim();
        const targetKdCus = kd_cus.toString().trim();
        return orderKdCus === targetKdCus;
      });
      
      console.log(`Filtered orders: ${filtered.length}`);
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
    // Berdasarkan API_COLLECTION.md, kita gunakan /detail-po-plg
    // Kita fetch semua detail dan filter berdasarkan no_tran
    const response = await axiosInstance.get(`/detail-po-plg?per_page=100`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (response.data && response.data.data) {
      return response.data.data.filter((d: any) => String(d.no_tran) === String(no_tran));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching order details:', error);
    throw error;
  }
};
