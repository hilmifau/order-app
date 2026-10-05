import axiosInstance from './axiosInstance';

export const DETAIL_BULK_CHUNK = 100;
const CHECKOUT_TIMEOUT_MS = 60000;
const LINE_TIMEOUT_MS = 20000;

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
  NO_PO?: string | number | null;
  NO_URUT: string | number;
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
  const response = await axiosInstance.post('/po-note', payload, {
    timeout: CHECKOUT_TIMEOUT_MS,
  });
  return response.data;
};

export const createDetailPoNote = async (payload: DetailPoNotePayload) => {
  const response = await axiosInstance.post('/detail-po-plg', payload, {
    timeout: LINE_TIMEOUT_MS,
  });
  return response.data;
};

function chunkItems<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export const createDetailPoNotesBulk = async (
  items: DetailPoNotePayload[],
  onProgress?: (saved: number, total: number) => void
) => {
  if (items.length === 0) {
    return { success: true, data: { count: 0 } };
  }

  const chunks = chunkItems(items, DETAIL_BULK_CHUNK);
  let saved = 0;
  let useSequential = false;

  for (const chunk of chunks) {
    if (!useSequential) {
      try {
        await axiosInstance.post('/detail-po-plg/bulk', { items: chunk }, {
          timeout: CHECKOUT_TIMEOUT_MS,
        });
        saved += chunk.length;
        onProgress?.(saved, items.length);
        continue;
      } catch (error: any) {
        const status = error?.response?.status;
        if (status === 404 || status === 405) {
          useSequential = true;
        } else {
          throw error;
        }
      }
    }

    for (const item of chunk) {
      await createDetailPoNote(item);
      saved += 1;
      onProgress?.(saved, items.length);
    }
  }

  return { success: true, fallback: useSequential, data: { count: saved } };
};

export const abortPoNote = async (noTran: string | number): Promise<boolean> => {
  try {
    await axiosInstance.post(`/po-note/${noTran}/abort`, {}, {
      timeout: LINE_TIMEOUT_MS,
    });
    return true;
  } catch {
    try {
      await axiosInstance.delete(`/po-note/${noTran}`, {
        timeout: LINE_TIMEOUT_MS,
      });
      return true;
    } catch {
      return false;
    }
  }
};

export const parsePoNoteNoTran = (poNoteRes: any): string | null => {
  let finalNoTran: string | null = null;
  if (typeof poNoteRes?.data === 'number' || typeof poNoteRes?.data === 'string') {
    finalNoTran = String(poNoteRes.data);
  } else if (poNoteRes?.data && typeof poNoteRes.data === 'object') {
    finalNoTran = String(
      poNoteRes.data.no_tran || poNoteRes.data.NO_PO || poNoteRes.data.id || poNoteRes.data.po_no || ''
    );
  } else if (poNoteRes && typeof poNoteRes === 'object') {
    finalNoTran = String(
      poNoteRes.no_tran || poNoteRes.NO_PO || poNoteRes.id || poNoteRes.po_no || ''
    );
  }

  if (!finalNoTran || finalNoTran === 'undefined' || finalNoTran === 'null') {
    return null;
  }
  return finalNoTran;
};

export const createOrderWithDetails = async (
  master: PoNotePayload,
  details: DetailPoNotePayload[]
) => {
  const masterResponse = await createPoNote(master);
  await createDetailPoNotesBulk(details);
  return masterResponse;
};

/**
 * Mengambil daftar pesanan (header) berdasarkan kode pelanggan (filter di server)
 */
export const getOrdersByCustomer = async (kd_cus?: string | null): Promise<any[]> => {
  try {
    const params: Record<string, string | number> = { limit: 50 };
    if (kd_cus) {
      params.kd_cus = kd_cus;
    }

    const response = await axiosInstance.get('/po-note', { params });

    if (response.data && response.data.data) {
      return response.data.data;
    }

    return [];
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
};

/** Admin: semua PO (atau filter kd_cus jika diisi). */
export const getAllOrders = async (): Promise<any[]> => {
  return getOrdersByCustomer(null);
};

/**
 * Mengambil detail item untuk satu transaksi (filter di server)
 */
export const getOrderDetails = async (no_tran: string | number): Promise<any[]> => {
  try {
    try {
      const byPoNote = await axiosInstance.get(`/po-note/${no_tran}/details`);
      if (Array.isArray(byPoNote.data?.data)) {
        return byPoNote.data.data;
      }
    } catch {
      // fallback ke query no_tran
    }

    const response = await axiosInstance.get('/detail-po-plg', {
      params: { no_tran },
    });

    return Array.isArray(response.data?.data) ? response.data.data : [];
  } catch (error) {
    console.error('Error fetching order details:', error);
    throw error;
  }
};
