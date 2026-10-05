import { fetchCart, syncCart } from '@/services/cartApi';
import { fetchFavorites, syncFavorites } from '@/services/favoriteApi';
import { getCart, getFavorites, saveCart, saveFavorites } from '@/services/storageService';
import { loadCartFromStorage } from '@/store/cartSlice';
import { loadFavoritesFromStorage } from '@/store/favoriteSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useEffect, useRef } from 'react';

const SYNC_DEBOUNCE_MS = 1500;

/**
 * Sumber utama keranjang & favorit: database Laravel.
 * AsyncStorage hanya cache lokal (tampilan cepat + fallback offline).
 */
export function useServerPersistence() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const cartItems = useAppSelector((state) => state.cart.items);
  const favoriteItems = useAppSelector((state) => state.favorites.items);

  const hydratedRef = useRef(false);
  const canSyncRef = useRef(false);
  const skipNextCartSync = useRef(false);
  const skipNextFavoriteSync = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      hydratedRef.current = false;
      canSyncRef.current = false;
      return;
    }

    let cancelled = false;

    const hydrateFromServer = async () => {
      const [localCart, localFavorites] = await Promise.all([getCart(), getFavorites()]);

      try {
        const [serverCart, serverFavorites] = await Promise.all([fetchCart(), fetchFavorites()]);
        if (cancelled) return;

        if (serverCart.length > 0) {
          skipNextCartSync.current = true;
          dispatch(loadCartFromStorage(serverCart));
        } else if (localCart.length > 0) {
          skipNextCartSync.current = true;
          dispatch(loadCartFromStorage(localCart));
          await syncCart(localCart);
        } else {
          skipNextCartSync.current = true;
          dispatch(loadCartFromStorage([]));
        }

        if (serverFavorites.length > 0) {
          skipNextFavoriteSync.current = true;
          dispatch(loadFavoritesFromStorage(serverFavorites));
        } else if (localFavorites.length > 0) {
          skipNextFavoriteSync.current = true;
          dispatch(loadFavoritesFromStorage(localFavorites));
          await syncFavorites(localFavorites);
        } else {
          skipNextFavoriteSync.current = true;
          dispatch(loadFavoritesFromStorage([]));
        }
      } catch (error) {
        console.error('Failed to hydrate cart/favorites from server:', error);
        if (cancelled) return;
        if (localCart.length > 0) {
          skipNextCartSync.current = true;
          dispatch(loadCartFromStorage(localCart));
        }
        if (localFavorites.length > 0) {
          skipNextFavoriteSync.current = true;
          dispatch(loadFavoritesFromStorage(localFavorites));
        }
      } finally {
        if (!cancelled) {
          hydratedRef.current = true;
          canSyncRef.current = true;
        }
      }
    };

    hydrateFromServer();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, dispatch]);

  useEffect(() => {
    if (!hydratedRef.current || !canSyncRef.current) return;

    if (skipNextCartSync.current) {
      skipNextCartSync.current = false;
      saveCart(cartItems);
      return;
    }

    const timer = setTimeout(() => {
      saveCart(cartItems);
      if (canSyncRef.current && isAuthenticated) {
        syncCart(cartItems).catch((error) => {
          console.error('Failed to sync cart:', error);
        });
      }
    }, SYNC_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [cartItems, isAuthenticated]);

  useEffect(() => {
    if (!hydratedRef.current || !canSyncRef.current) return;

    if (skipNextFavoriteSync.current) {
      skipNextFavoriteSync.current = false;
      saveFavorites(favoriteItems);
      return;
    }

    const timer = setTimeout(() => {
      saveFavorites(favoriteItems);
      if (canSyncRef.current && isAuthenticated) {
        syncFavorites(favoriteItems).catch((error) => {
          console.error('Failed to sync favorites:', error);
        });
      }
    }, SYNC_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [favoriteItems, isAuthenticated]);
}
