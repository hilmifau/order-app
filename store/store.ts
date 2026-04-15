import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import cartReducer from './cartSlice';
import inventoryReducer from './inventorySlice';
import favoriteReducer from './favoriteSlice';

export const store = configureStore({
  reducer: {
    inventory: inventoryReducer,
    cart: cartReducer,
    auth: authReducer,
    favorites: favoriteReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
