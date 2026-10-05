import axiosInstance from './axiosInstance';

const SAVE_TIMEOUT_MS = 60000;

export interface OpnameHeader {
  no_buku: string;
  tgl_opname?: string;
  penulis?: string;
  penghitung?: string;
  pengawas?: string;
  Ket?: string;
  ket?: string;
  jenis?: string;
  total?: number;
  status?: string;
  Penulis?: string;
  Penghitung?: string;
  Pengawas?: string;
  Total?: number;
}

export interface OpnameDetail {
  no_buku?: string;
  kd_br: string;
  qty: number;
  nilai: number;
  subtotal: number;
  no_urut?: number;
  nama_br?: string;
  satuan?: string;
  barang?: {
    kd_br?: string;
    nama?: string;
    satuan?: string;
    h_anggota?: string | number;
  } | null;
}

export interface OpnameItemPayload {
  kd_br: string;
  qty: number;
  nilai: number;
  nama?: string;
  satuan?: string;
}

export interface CreateOpnamePayload {
  no_buku: string;
  penulis: string;
  penghitung: string;
  pengawas: string;
  tgl_opname?: string;
  ket?: string;
  jenis?: string;
  items: OpnameItemPayload[];
}

function unwrapList(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
}

export const getOpnames = async (): Promise<OpnameHeader[]> => {
  const response = await axiosInstance.get('/master-opname', {
    params: { limit: 50 },
  });
  return unwrapList(response.data) as OpnameHeader[];
};

export const getOpnameDetails = async (noBuku: string): Promise<{ header: OpnameHeader | null; details: OpnameDetail[] }> => {
  const response = await axiosInstance.get('/detail-opname', {
    params: { no_buku: noBuku },
  });
  const details = unwrapList(response.data) as OpnameDetail[];
  const header = (response.data?.header as OpnameHeader) || null;
  return { header, details };
};

export const createOpname = async (payload: CreateOpnamePayload) => {
  const response = await axiosInstance.post('/master-opname', payload, {
    timeout: SAVE_TIMEOUT_MS,
  });
  return response.data;
};
