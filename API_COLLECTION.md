# API Collection Dokumentasi

Base URL: `http://{host}/api`
Headers umum:
- `Accept: application/json`
- `Content-Type: application/json` (kecuali `multipart/form-data` untuk upload gambar)
- `Authorization: Bearer {token}` untuk semua endpoint auth kecuali `/login` dan `/register`

---

## Autentikasi

### POST `/login`
- Request body:
  - `email` (string, required)
  - `password` (string, required)
- Response success 200:
  - `success`: true
  - `message`: `Login berhasil`
  - `data`: object
    - `user`: user object
    - `token`: string
- Response error 401:
  - `success`: false
  - `message`: `Email atau password salah`

### POST `/register`
- Request body:
  - `name` (string, required)
  - `email` (string, required, unique)
  - `password` (string, required, min 6)
  - `password_confirmation` (string, required)
- Response success 201:
  - `success`: true
  - `message`: `Registrasi berhasil`
  - `data`: object
    - `user`: user object
    - `token`: string

### POST `/logout`
- Auth required
- Request body: kosong
- Response success 200:
  - `success`: true
  - `message`: `Logout berhasil`

---

## Users
Semua endpoint `users` memerlukan auth.

### GET `/users`
- Response success 200:
  - `success`: true
  - `message`: `Daftar pengguna berhasil diambil`
  - `data`: array user
  - `total`: jumlah user

### POST `/users`
- Request body:
  - `name` (string, required)
  - `email` (string, required, unique)
  - `password` (string, required, min 6)
- Response success 201:
  - `success`: true
  - `message`: `User berhasil dibuat`
  - `data`: user object

### GET `/users/{id}`
- Response success 200:
  - `success`: true
  - `message`: `Detail user berhasil diambil`
  - `data`: user object
- Response error 404:
  - `success`: false
  - `message`: `User tidak ditemukan`

### PUT `/users/{id}`
- Request body:
  - `name` (string, sometimes|required)
  - `email` (string, sometimes|required, unique)
  - `password` (string, nullable, min 6)
- Response success 200:
  - `success`: true
  - `message`: `User berhasil diperbarui`
  - `data`: user object

### DELETE `/users/{id}`
- Response success 200:
  - `success`: true
  - `message`: `User berhasil dihapus`

---

## Barang
Semua endpoint `barangs` memerlukan auth.

### GET `/barangs/by-kd?kd={value}`
- Query params:
  - `kd` (string, required)
- Response success 200:
  - `success`: true
  - `message`: `Daftar barang berdasarkan kd berhasil diambil`
  - `data`: array barang
- Response error 404:
  - `success`: false
  - `message`: `Barang tidak ditemukan`

### GET `/barangs`
- Response success 200:
  - `success`: true
  - `message`: `Daftar barang berhasil diambil`
  - `data`: array barang

### POST `/barangs`
- Request body (form-data untuk upload file `gambar`):
  - `kd_br` (string, required, unique)
  - `nama` (string, required)
  - `hpp` (numeric, required)
  - `satuan` (string, required)
  - `h_anggota` (numeric, required)
  - `barcode` (string, nullable, unique)
  - `ket` (string, nullable)
  - `kd` (string, nullable)
  - `gambar` (file image, nullable, jpeg/png/jpg/gif, max 2048)
- Response success 201:
  - `success`: true
  - `message`: `Barang berhasil dibuat`
  - `data`: barang object

### GET `/barangs/{id}`
- Response success 200:
  - `success`: true
  - `message`: `Detail barang berhasil diambil`
  - `data`: barang object
- Response error 404:
  - `success`: false
  - `message`: `Barang tidak ditemukan`

### PUT `/barangs/{id}`
- Request body (form-data jika upload `gambar`):
  - `kd_br` (string, sometimes)
  - `nama` (string, sometimes)
  - `hpp` (numeric, sometimes)
  - `satuan` (string, sometimes)
  - `h_anggota` (numeric, sometimes)
  - `barcode` (string, nullable)
  - `ket` (string, nullable)
  - `kd` (string, nullable)
  - `gambar` (file image, nullable)
- Response success 200:
  - `success`: true
  - `message`: `Barang berhasil diupdate`
  - `data`: barang object

### DELETE `/barangs/{id}`
- Response success 200:
  - `success`: true
  - `message`: `Barang berhasil dihapus`

---

## Jenis Produk
Semua endpoint `jenis-produk` memerlukan auth.

### GET `/jenis-produk`
- Response success 200:
  - `success`: true
  - `message`: `Data jenis produk retrieved successfully`
  - `data`: array jenis produk
  - `total`: jumlah data

### POST `/jenis-produk`
- Request body:
  - `kd` (string, required, unique)
  - `nama` (string, required)
- Response success 201:
  - `success`: true
  - `message`: `Jenis produk created successfully`
  - `data`: object

### GET `/jenis-produk/{id}`
- Response success 200:
  - `success`: true
  - `message`: `Jenis produk retrieved successfully`
  - `data`: object
- Response error 404:
  - `success`: false
  - `message`: `Jenis produk not found`

### PUT `/jenis-produk/{id}`
- Request body:
  - `nama` (string, required)
- Response success 200:
  - `success`: true
  - `message`: `Jenis produk updated successfully`
  - `data`: object

### DELETE `/jenis-produk/{id}`
- Response success 200:
  - `success`: true
  - `message`: `Jenis produk deleted successfully`
  - `data`: object

---

## PO Note
Semua endpoint `po-note` memerlukan auth.

### GET `/po-note`
- Response success 200:
  - `success`: true
  - `message`: `Data po note retrieved successfully`
  - `data`: array po note
  - `total`: jumlah data

### POST `/po-note`
- Request body:
  - `tgl` (date, required)
  - `kd_cus` (string, required)
  - `jam` (string, nullable)
  - `nama_adm` (string, nullable)
  - `kpb` (string, nullable)
  - `ket` (string, nullable)
  - `status` (string, nullable)
  - `total_po` (integer, nullable)
  - `jenis` (string, nullable)
- Response success 201:
  - `success`: true
  - `message`: `PO note created successfully`
  - `data`: object

### GET `/po-note/{id}`
- Response success 200:
  - `success`: true
  - `message`: `PO note retrieved successfully`
  - `data`: object
- Response error 404:
  - `success`: false
  - `message`: `PO note not found`

### PUT `/po-note/{id}`
- Request body:
  - `tgl` (date, required)
  - `kdcus` (string, required)  
    > catatan: kode backend saat ini menggunakan `kdcus` untuk update, bukan `kd_cus`
  - `jam` (string, nullable)
  - `nama_adm` (string, nullable)
  - `kpb` (string, nullable)
  - `ket` (string, nullable)
  - `status` (string, nullable)
  - `total_po` (integer, nullable)
  - `jenis` (string, nullable)
- Response success 200:
  - `success`: true
  - `message`: `PO note updated successfully`
  - `data`: object

### DELETE `/po-note/{id}`
- Response success 200:
  - `success`: true
  - `message`: `PO note deleted successfully`
  - `data`: object

---

## Detail PO PLG
Semua endpoint `detail-po-plg` memerlukan auth.

### GET `/detail-po-plg`
- Query params:
  - `per_page` (integer, optional, default 50, max 100)
- Response success 200:
  - `success`: true
  - `message`: `Data detail PO PLG retrieved successfully`
  - `data`: array detail
  - `total`, `per_page`, `current_page`, `last_page`

### POST `/detail-po-plg`
- Request body:
  - `no_tran` (integer, required)
  - `NO_URUT` (integer, required)
  - `KD_BR` (string, required)
  - `RASA` (string, nullable)
  - `QTY` (integer, nullable)
  - `SAT` (string, nullable)
  - `harga` (integer, nullable)
  - `subtotal` (integer, nullable)
  - `kd` (string, nullable)
  - `nama_br` (string, nullable)
- Response success 201:
  - `success`: true
  - `message`: `Detail PO PLG created successfully`
  - `data`: object

### GET `/detail-po-plg/{id}`
- Response success 200:
  - `success`: true
  - `message`: `Detail PO PLG retrieved successfully`
  - `data`: object
- Response error 404:
  - `success`: false
  - `message`: `Detail PO PLG not found`

### PUT `/detail-po-plg/{id}`
- Request body:
  - `no_tran` (integer, required)
  - `KD_BR` (string, required)
  - `RASA` (string, nullable)
  - `QTY` (integer, nullable)
  - `SAT` (string, nullable)
  - `harga` (integer, nullable)
  - `subtotal` (integer, nullable)
  - `kd` (string, nullable)
  - `nama_br` (string, nullable)
- Response success 200:
  - `success`: true
  - `message`: `Detail PO PLG updated successfully`
  - `data`: object

### DELETE `/detail-po-plg/{id}`
- Response success 200:
  - `success`: true
  - `message`: `Detail PO PLG deleted successfully`
  - `data`: object

---

## Master Penjualan
Semua endpoint `master-penjualan` memerlukan auth.

### GET `/master-penjualan/filter?kd_cus={value}&tgl_jual={date}&per_page={n}`
- Query params:
  - `kd_cus` (string, required)
  - `tgl_jual` (date, required)
  - `per_page` (integer, optional, default 20)
- Response success 200:
  - `data`: paginated object dari Laravel

### GET `/master-penjualan`
- Query params:
  - `per_page` (integer, optional, default 20)
- Response success 200:
  - `data`: paginated object

### POST `/master-penjualan`
- Request body:
  - `no_jual` (numeric, required, unique)
  - `tgl_jual` (date, required)
  - `kd_cus` (string, required)
  - `jenis_jual` (string, required)
  - `memo` (string, nullable)
  - `terbilang` (string, nullable)
  - `kasir` (string, nullable)
  - `waktu` (string, nullable)
  - `userID` (string, nullable)
  - `total_jual` (numeric, required)
  - `saldo_piutang` (numeric, nullable)
  - `bon_sementara` (numeric, nullable)
  - `total_transaksi` (numeric, nullable)
  - `saldo_akhir` (numeric, nullable)
  - `bayar` (numeric, nullable)
  - `kupon` (numeric, nullable)
  - `bs` (numeric, nullable)
- Response success 201:
  - `data`: object

### GET `/master-penjualan/{id}`
- Response success 200:
  - objek `Master_Penjualan`
- Response error 404:
  - `message`: `Data not found`

### PUT `/master-penjualan/{id}`
- Request body: sama dengan `POST /master-penjualan`
- Response success 200:
  - objek `Master_Penjualan`

### DELETE `/master-penjualan/{id}`
- Response success 200:
  - `message`: `Deleted successfully`

---

## Catatan penting untuk FE
1. Login dan register menghasilkan token Sanctum di response: gunakan sebagai header `Authorization: Bearer {token}`.
2. Endpoint `POST /barangs` dan `PUT /barangs/{id}` mendukung upload gambar dengan `multipart/form-data`.
3. `PUT /po-note/{id}` saat ini menggunakan field `kdcus` untuk update, sementara `POST /po-note` menggunakan `kd_cus`.
4. Semua endpoint selain `/login` dan `/register` memerlukan autentikasi.
