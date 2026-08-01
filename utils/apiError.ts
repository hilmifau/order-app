import { AxiosError } from 'axios';

export interface FriendlyErrorOptions {
  /** Pesan default jika error tidak dikenali. */
  fallback?: string;
  /** Override pesan per status HTTP, mis. { 401: 'Email atau password salah.' } */
  overrides?: Record<number, string>;
}

const DEFAULT_FALLBACK = 'Terjadi kesalahan. Silakan coba lagi.';

/**
 * Menerjemahkan error dari API (axios) menjadi pesan berbahasa Indonesia
 * yang mudah dibaca user, tanpa menampilkan pesan mentah dari backend.
 */
export function getFriendlyErrorMessage(
  error: unknown,
  options: FriendlyErrorOptions = {}
): string {
  const fallback = options.fallback || DEFAULT_FALLBACK;
  const err = error as AxiosError;

  if (!err || (!err.isAxiosError && !err.response && !err.request)) {
    return fallback;
  }

  // Timeout (axios pakai code ECONNABORTED / ETIMEDOUT)
  if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT' || /timeout/i.test(err.message || '')) {
    return 'Koneksi ke server melebihi batas waktu. Silakan coba lagi.';
  }

  // Request terkirim tapi tidak ada respons sama sekali (offline / server mati)
  if (!err.response) {
    return 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda lalu coba lagi.';
  }

  const status = err.response.status;

  if (options.overrides && options.overrides[status]) {
    return options.overrides[status];
  }

  if (status === 401) return 'Sesi Anda telah berakhir. Silakan login ulang.';
  if (status === 403) return 'Anda tidak memiliki akses untuk melakukan aksi ini.';
  if (status === 404) return 'Data tidak ditemukan di server.';
  if (status === 422) return 'Data yang dikirim tidak valid. Periksa kembali isian Anda.';
  if (status === 429) return 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.';
  if (status >= 500) return 'Terjadi gangguan pada server. Silakan coba beberapa saat lagi.';

  return fallback;
}
