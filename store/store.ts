import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import cartReducer from './cartSlice';
import inventoryReducer from './inventorySlice';
import favoriteReducer from './favoriteSlice';
import opnameCartReducer from './opnameCartSlice';

export const store = configureStore({
  reducer: {
    inventory: inventoryReducer,
    cart: cartReducer,
    auth: authReducer,
    favorites: favoriteReducer,
    opnameCart: opnameCartReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Dev-only checks (omitted in production RTK builds) walk the full tree; large
      // `barangs` / cart / favorites payloads exceed the default 32ms warn threshold and add GC churn.
      serializableCheck: {
        warnAfter: 128,
        ignoredPaths: ['inventory.barangs', 'cart.items', 'favorites.items', 'opnameCart.items'],
        ignoredActions: [
          'inventory/setBarangs',
          'inventory/addMoreBarangs',
          'cart/loadCartFromStorage',
          'favorites/loadFavoritesFromStorage',
          'opnameCart/loadOpnameCartFromStorage',
        ],
      },
      immutableCheck: {
        warnAfter: 128,
        ignoredPaths: ['inventory.barangs', 'cart.items', 'favorites.items', 'opnameCart.items'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
