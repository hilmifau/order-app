import { CartItem } from '@/store/cartSlice';
import axiosInstance from './axiosInstance';

function toSyncItem(item: CartItem) {
  return {
    kd_br: item.kd_br,
    quantity: item.quantity,
    variant: item.variant || '',
    nama: item.barang?.nama,
    satuan: item.barang?.satuan,
    h_anggota: item.barang?.h_anggota,
    kd: item.barang?.kd,
    ket: item.barang?.ket,
    gambar: item.barang?.gambar,
  };
}

export async function fetchCart(): Promise<CartItem[]> {
  const response = await axiosInstance.get('/cart');
  return Array.isArray(response.data?.data) ? response.data.data : [];
}

export async function syncCart(items: CartItem[]): Promise<CartItem[]> {
  const response = await axiosInstance.put('/cart/sync', {
    items: items.map(toSyncItem),
  });
  return Array.isArray(response.data?.data) ? response.data.data : items;
}

export async function clearRemoteCart(): Promise<void> {
  await axiosInstance.delete('/cart');
}
