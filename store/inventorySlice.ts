import { Barang, Gudang } from '@/services/menuApi';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface InventoryState {
  gudangs: Gudang[];
  barangs: Barang[];
  loading: boolean;
  error: string | null;
  isInitialized: boolean;
}

const initialState: InventoryState = {
  gudangs: [],
  barangs: [],
  loading: false,
  error: null,
  isInitialized: false,
};

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setGudangs: (state, action: PayloadAction<Gudang[]>) => {
      state.gudangs = action.payload;
    },
    setBarangs: (state, action: PayloadAction<Barang[]>) => {
      state.barangs = action.payload;
    },
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload;
    },
    addMoreBarangs: (state, action: PayloadAction<Barang[]>) => {
      state.barangs = [...state.barangs, ...action.payload];
    },
    resetInventory: () => initialState,
  },
});

export const {
  setLoading,
  setError,
  setGudangs,
  setBarangs,
  setInitialized,
  addMoreBarangs,
  resetInventory,
} = inventorySlice.actions;

export default inventorySlice.reducer;
