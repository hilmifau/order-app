import { Barang } from '@/services/menuApi';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface FavoriteState {
  items: Barang[];
}

const initialState: FavoriteState = {
  items: [],
};

const favoriteSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    toggleFavorite: (state, action: PayloadAction<Barang>) => {
      const barang = action.payload;
      const index = state.items.findIndex(item => item.kd_br === barang.kd_br);
      
      if (index !== -1) {
        // Remove if exists
        state.items.splice(index, 1);
      } else {
        // Add if not exists
        state.items.push(barang);
      }
    },
    loadFavoritesFromStorage: (state, action: PayloadAction<Barang[]>) => {
      state.items = action.payload;
    },
    clearFavorites: (state) => {
      state.items = [];
    }
  },
});

export const { toggleFavorite, loadFavoritesFromStorage, clearFavorites } = favoriteSlice.actions;
export default favoriteSlice.reducer;
