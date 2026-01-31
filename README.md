# Order App - Expo React Native

Aplikasi order berbasis React Native dengan Expo, menggunakan Redux untuk state management dan Axios untuk API integration.

## 🚀 Fitur

- **Login System** - Autentikasi dengan UserID, Password, dan Kode Pelanggan
- **Product Browsing** - Daftar barang dengan filter gudang dan pencarian
- **Shopping Cart** - Tambah/hapus barang, edit quantity, kalkulasi total
- **PDF Invoice** - Generate dan download invoice otomatis
- **Theme Support** - Dark/Light mode support
- **Responsive Design** - Adaptif untuk mobile dan tablet

## 📦 Tech Stack

- **React Native** - UI Framework
- **Expo** - Development platform
- **Redux Toolkit** - State management
- **Axios** - HTTP client
- **React Navigation** - Navigation
- **AsyncStorage** - Local persistence
- **expo-print** - PDF generation

## 🔧 Setup

```bash
# Install dependencies
npm install

# Start dev server
npm start

# Web
npm run web

# Android
npm run android

# iOS
npm run ios
```

## 📁 Project Structure

```
app/
├── _layout.tsx          # Root layout & auth check
├── login.tsx            # Login screen
└── (tabs)/
    ├── _layout.tsx      # Tab navigation
    ├── index.tsx        # Home/Products
    ├── explore.tsx      # Shopping cart
    └── profile.tsx      # User profile

services/
├── authApi.ts           # Auth API (mock + real ready)
├── axiosInstance.ts     # Axios config
├── menuApi.ts           # Menu/Products API
└── storageService.ts    # AsyncStorage

store/
├── authSlice.ts         # Auth state
├── cartSlice.ts         # Cart state
├── inventorySlice.ts    # Products state
└── store.ts             # Redux store config

components/             # Reusable components
constants/              # App constants
hooks/                  # Custom hooks
```

## 🔐 Login (Mock)

**Test credentials:**

| UserID | Password | Kode Pelanggan |
|--------|----------|----------------|
| user1  | pass123  | CUST001        |
| admin  | admin123 | CUST002        |

> **Note:** Saat ini menggunakan mock login. Akan otomatis switch ke real API ketika endpoint `/pengguna` siap (uncomment di `services/authApi.ts`)

## 🔄 API Integration

- **Base URL:** `http://45.112.125.75:8080/public/api`
- **Products:** `GET /barangs` (paginated)
- **Categories:** `GET /jenis-produk`
- **Login:** `POST /pengguna` (akan di-implement)

## 📝 Environment Variables

Buat `.env` file:

```
EXPO_PUBLIC_API_BASE_URL=http://45.112.125.75:8080/public/api
```

## 📸 Screenshots

- Login screen dengan 3 input fields
- Home dengan product grid (responsive 2-3 columns)
- Shopping cart dengan quantity editor
- PDF invoice download

## �️ Logo & Splash Screen

- ✅ App icon (logo)
- ✅ Splash screen (light & dark mode)
- 📖 Panduan: Lihat [ASSET_SETUP.md](./ASSET_SETUP.md)

> **Quick Start:** Buka `assets/ASSET_GENERATOR.html` di browser untuk download template design

## 👨‍💻 Development

### Uncomment Real API

Ketika API `/pengguna` siap:

1. Edit `services/authApi.ts`
2. Uncomment bagian `/* REAL API CALL */`
3. Comment bagian `// MOCK:`
4. Selesai!

### Add New Feature

1. Create slice di `store/` jika perlu state
2. Create screen/component
3. Wire dengan Redux jika perlu
4. Test di Expo

## 📄 License

Private

## 👤 Author

Order App Team
