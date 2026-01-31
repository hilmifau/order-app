# API Services

Folder ini berisi semua konfigurasi dan fungsi untuk berkomunikasi dengan API backend.

## File Structure

### axiosInstance.ts
Konfigurasi axios dengan:
- Base URL dari environment variable
- Default headers
- Request/Response interceptors untuk error handling

### menuApi.ts
API endpoints untuk menu yang mencakup:
- `getCategories()` - Get semua kategori menu
- `getMenuItems()` - Get semua menu items
- `getCategoryById(id)` - Get kategori berdasarkan ID
- `getMenuItemsByCategory(categoryId)` - Get menu items berdasarkan kategori

## Penggunaan

### Setup Environment
1. Copy `.env.example` menjadi `.env.local`
2. Update `EXPO_PUBLIC_API_URL` sesuai dengan server Anda

```bash
cp .env.example .env.local
```

### Import dan Menggunakan API
```typescript
import { getCategories, getMenuItems } from '@/services/menuApi';

// Fetch categories
try {
  const categories = await getCategories();
  console.log(categories);
} catch (error) {
  console.error('Failed to fetch categories', error);
}
```

## API Response Format

### Categories
```typescript
{
  id: number;
  name: string;
  items: number;
  color: string;
  icon: string;
}
```

### Menu Items
```typescript
{
  id: number;
  name: string;
  price: number;
  icon: string;
}
```

## Error Handling

Semua API calls dilengkapi dengan error handling:
- Automatic retry dengan timeout
- Fallback ke default data jika API gagal
- Console logging untuk debugging

## Backend API Requirements

Backend server harus menyediakan endpoints:
- `GET /api/categories` - Return array of categories
- `GET /api/menu-items` - Return array of menu items
- `GET /api/categories/:id` - Return specific category
- `GET /api/menu-items?categoryId=:id` - Return menu items by category
