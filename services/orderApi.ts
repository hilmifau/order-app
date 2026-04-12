import axiosInstance from './axiosInstance';

export interface PoNotePayload {
  no_tran?: string;
  tgl: string;
  kd_cus: string;
  jam: string;
  nama_admin: string;
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
  const response = await axiosInstance.post('/po-note', payload);
  return response.data;
};

export const createDetailPoNote = async (payload: DetailPoNotePayload) => {
  const response = await axiosInstance.post('/detail-po-plg', payload);
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
