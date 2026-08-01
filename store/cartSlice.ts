import { Barang } from '@/services/menuApi';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CartItem {
  kd_br: string;
  quantity: number;
  barang: Barang; // Store full barang data for display
  variant?: string;
}

interface CartState {
  items: CartItem[];
}

const initialState: CartState = {
  items: [],
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<{ barang: Barang; quantity: number }>) => {
      const { barang, quantity } = action.payload;
      const existingItem = state.items.find(item => item.kd_br === barang.kd_br);

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        state.items.push({
          kd_br: barang.kd_br,
          quantity,
          barang,
        });
      }
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.kd_br !== action.payload);
    },
    updateQuantity: (state, action: PayloadAction<{ kd_br: string; quantity: number }>) => {
      const { kd_br, quantity } = action.payload;
      const item = state.items.find(item => item.kd_br === kd_br);

      if (item) {
        if (quantity <= 0) {
          state.items = state.items.filter(item => item.kd_br !== kd_br);
        } else {
          item.quantity = quantity;
        }
      }
    },
    updateVariant: (state, action: PayloadAction<{ kd_br: string; variant: string }>) => {
      const { kd_br, variant } = action.payload;
      const item = state.items.find(item => item.kd_br === kd_br);

      if (item) {
        item.variant = variant;
      }
    },
    clearCart: (state) => {
      state.items = [];
    },
    loadCartFromStorage: (state, action: PayloadAction<CartItem[]>) => {
      state.items = action.payload;
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  updateVariant,
  clearCart,
  loadCartFromStorage,
} = cartSlice.actions;

export default cartSlice.reducer;
