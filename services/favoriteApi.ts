import { Barang } from '@/services/menuApi';
import axiosInstance from './axiosInstance';

function toSyncItem(item: Barang) {
  return {
    kd_br: item.kd_br,
    nama: item.nama,
    satuan: item.satuan,
    h_anggota: item.h_anggota,
    kd: item.kd,
    ket: item.ket,
    gambar: item.gambar,
  };
}

export async function fetchFavorites(): Promise<Barang[]> {
  const response = await axiosInstance.get('/favorites');
  return Array.isArray(response.data?.data) ? response.data.data : [];
}

export async function syncFavorites(items: Barang[]): Promise<Barang[]> {
  const response = await axiosInstance.put('/favorites/sync', {
    items: items.map(toSyncItem),
  });
  return Array.isArray(response.data?.data) ? response.data.data : items;
}

export async function toggleFavoriteApi(barang: Barang): Promise<{ is_favorite: boolean }> {
  const response = await axiosInstance.post('/favorites/toggle', {
    kd_br: barang.kd_br,
    nama: barang.nama,
    satuan: barang.satuan,
    h_anggota: barang.h_anggota,
    kd: barang.kd,
    ket: barang.ket,
    gambar: barang.gambar,
  });
  return {
    is_favorite: Boolean(response.data?.data?.is_favorite),
  };
}
