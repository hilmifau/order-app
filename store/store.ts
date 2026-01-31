import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import cartReducer from './cartSlice';
import inventoryReducer from './inventorySlice';

export const store = configureStore({
  reducer: {
    inventory: inventoryReducer,
    cart: cartReducer,
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
