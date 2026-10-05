import { Barang } from '@/services/menuApi';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface OpnameCartItem {
  kd_br: string;
  quantity: number;
  barang: Barang;
}

interface OpnameCartState {
  items: OpnameCartItem[];
}

const initialState: OpnameCartState = {
  items: [],
};

const opnameCartSlice = createSlice({
  name: 'opnameCart',
  initialState,
  reducers: {
    addToOpnameCart: (state, action: PayloadAction<{ barang: Barang; quantity: number }>) => {
      const { barang, quantity } = action.payload;
      const existingItem = state.items.find((item) => item.kd_br === barang.kd_br);

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
    removeFromOpnameCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.kd_br !== action.payload);
    },
    updateOpnameQuantity: (state, action: PayloadAction<{ kd_br: string; quantity: number }>) => {
      const { kd_br, quantity } = action.payload;
      const item = state.items.find((row) => row.kd_br === kd_br);

      if (!item) return;
      if (quantity <= 0) {
        state.items = state.items.filter((row) => row.kd_br !== kd_br);
      } else {
        item.quantity = quantity;
      }
    },
    clearOpnameCart: (state) => {
      state.items = [];
    },
    loadOpnameCartFromStorage: (state, action: PayloadAction<OpnameCartItem[]>) => {
      state.items = action.payload;
    },
  },
});

export const {
  addToOpnameCart,
  removeFromOpnameCart,
  updateOpnameQuantity,
  clearOpnameCart,
  loadOpnameCartFromStorage,
} = opnameCartSlice.actions;

export default opnameCartSlice.reducer;
