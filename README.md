# PO NARI PDA (Order App)

[![React Native](https://img.shields.io/badge/React%20Native-0.79-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK%2053-black.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Aplikasi mobile Point of Order (PDA) & manajemen inventaris berbasis **React Native** dan **Expo**. Dirancang untuk menunjang operasional sales, kasir/admin, dan pergudangan dalam pencatatan pesanan, pengelolaan kupon/diskon, verifikasi stok fisik (stok opname), serta ekspor faktur invoice dalam format PDF.

---

## 🚀 Fitur Utama

- 🔐 **Autentikasi & Manajemen Pengguna**
  - Login aman berbasis token (Laravel Sanctum).
  - Pembagian hak akses peran (*Role-based access*): Administrator & User / Sales.
  - Kelola data pengguna langsung dari aplikasi (khusus Admin).

- 📦 **Katalog Barang & Pencarian Cepat**
  - Daftar produk dengan pagination dan cache inventaris.
  - Filter barang berdasarkan kategori (*jenis produk*) dan gudang penyimpanan.
  - Pencarian instan berdasarkan kode atau nama barang tanpa duplikasi data.

- 🛒 **Manajemen Keranjang Belanja & Diskon**
  - Tambah, ubah kuantitas, atau hapus item secara responsif.
  - Dukungan multi-varian barang per produk.
  - Kalkulasi subtotal, potongan kupon diskon, dan grand total otomatis.
  - Validasi sisa stok gudang secara *real-time*.

- 📋 **Stok Opname (Penyesuaian Fisik Stok)**
  - Pemeriksaan dan pencatatan fisik barang di gudang.
  - Perhitungan selisih (*selisih fisik vs sistem*).
  - Riwayat dan catatan laporan opname terintegrasi ke backend.

- 📜 **Riwayat Pesanan (Order History)**
  - Pantau daftar pesanan yang telah dibuat beserta statusnya.
  - Detail transaksi lengkap dengan rincian item barang dan kupon.

- 🖨️ **Generate Faktur / Invoice PDF**
  - Pembuatan dokumen invoice otomatis menggunakan `expo-print`.
  - Format siap cetak (*print-ready*) atau dibagikan langsung.

- 🔄 **Sinkronisasi Server & Mode Offline**
  - *Server persistence*: sinkronisasi otomatis keranjang pesanan ke backend.
  - Mode *Mock Data*: pengujian alur aplikasi tanpa ketergantungan koneksi backend aktif.

- 🌓 **Dukungan Tema Dinamis**
  - Antarmuka adaptif dengan dukungan Dark Mode dan Light Mode.

---

## 📦 Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) via [Expo](https://expo.dev/) (SDK 53)
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing)
- **State Management**: [Redux Toolkit](https://redux-toolkit.js.org/)
- **HTTP Client**: [Axios](https://axios-http.com/) dengan interceptor token Sanctum
- **Penyimpanan Lokal**: `@react-native-async-storage/async-storage` & `expo-secure-store`
- **PDF Generation**: `expo-print` & `expo-sharing`
- **Bahasa**: [TypeScript](https://www.typescriptlang.org/)

---

## 📁 Struktur Direktori

```text
order-app/
├── app/                        # Rute dan halaman (Expo Router)
│   ├── _layout.tsx             # Root layout & inisialisasi state
│   ├── login.tsx               # Halaman autentikasi / login
│   ├── users.tsx               # Halaman manajemen pengguna (Admin)
│   └── (tabs)/                 # Navigasi tab utama
│       ├── _layout.tsx         # Bottom tab bar configuration
│       ├── index.tsx           # Katalog barang & pencarian
│       ├── explore.tsx         # Keranjang belanja & checkout
│       ├── opname.tsx          # Fitur stok opname gudang
│       ├── history.tsx         # Riwayat pesanan PO
│       └── profile.tsx         # Profil akun, pengaturan tema, & logout
├── assets/                     # Aset gambar, icon aplikasi, dan splash screen
├── components/                 # Komponen UI modular yang dapat digunakan ulang
├── constants/                  # Warna tema, konfigurasi aplikasi, dan konstanta global
├── hooks/                      # Custom React hooks (tema, server persistence, dll.)
├── services/                   # Service API (Axios instance, auth, menu, order, opname)
├── store/                      # Redux Toolkit slices dan konfigurasi store
└── utils/                      # Helper utilitas (format mata uang, generator PDF, error handler)
```

---

## 🔧 Panduan Instalasi & Menjalankan

### 1. Prasyarat Sistem
- **Node.js**: Versi 18 LTS atau lebih baru
- **Package Manager**: npm, yarn, atau bun
- **Aplikasi Expo Go** (pada perangkat Android/iOS fisik) atau Android Studio Emulator

### 2. Clone Repository
```bash
git clone https://github.com/hilmifau/order-app.git
cd order-app
```

### 3. Install Dependensi
```bash
npm install
```

### 4. Konfigurasi Environment (`.env`)
Salin file template `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```

Buka file `.env` lalu sesuaikan konfigurasi sesuai server backend Anda:
```env
# Alamat Base URL API backend Anda (diakhiri /api)
EXPO_PUBLIC_API_URL=http://localhost:8000/api

# Set true jika ingin mencoba aplikasi dalam mode offline / mock data
EXPO_PUBLIC_USE_MOCK_DATA=false
```

### 5. Jalankan Aplikasi
```bash
# Menjalankan Metro Bundler Expo
npm start

# Atau langsung target platform:
npm run android   # Android (Emulator / Perangkat USB)
npm run ios       # iOS Simulator (macOS only)
npm run web       # Browser Web
```

Scan QR Code yang muncul di terminal menggunakan aplikasi **Expo Go** di ponsel Anda.

---

## ⚙️ Variabel Environment

| Variabel | Tipe | Default / Contoh | Deskripsi |
| :--- | :--- | :--- | :--- |
| `EXPO_PUBLIC_API_URL` | String | `http://localhost:8000/api` | Alamat base URL API backend Laravel. Harus memiliki path `/api`. |
| `EXPO_PUBLIC_USE_MOCK_DATA` | Boolean | `false` | Menentukan apakah aplikasi menggunakan mock data lokal (`true`) atau request riil ke backend (`false`). |

---

## 🌐 Dokumentasi API Backend

Aplikasi ini mengonsumsi REST API standar (kompatibel dengan Laravel Sanctum). Dokumentasi rute lengkap dapat dilihat pada [API_COLLECTION.md](./API_COLLECTION.md).

Ringkasan endpoint utama:
- `POST /login` - Autentikasi pengguna & penerbitan Bearer token
- `POST /logout` - Revokasi session token
- `GET /barangs` - Mengambil daftar barang (paginated)
- `GET /jenis-produk` - Mengambil daftar kategori produk
- `POST /po-note` - Menyimpan pesanan baru (checkout PO)
- `GET /po-notes` - Mengambil riwayat pesanan
- `POST /opname` - Mengirim data penyesuaian stok opname

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE).

---

## 👤 Penulis / Pengembang

**Hilmi Fauzi**
- GitHub: [@hilmifau](https://github.com/hilmifau)
