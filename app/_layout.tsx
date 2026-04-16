import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import { useEffect } from 'react';
import { ActivityIndicator, Alert, Image, View } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Provider, useDispatch, useSelector } from 'react-redux';

import { ThemeContext, useThemeState } from '@/hooks/use-theme';
import { checkAuthAsync } from '@/store/authSlice';
import { loadCartFromStorage } from '@/store/cartSlice';
import { loadFavoritesFromStorage } from '@/store/favoriteSlice';
import { AppDispatch, RootState, store } from '@/store/store';
import { getCart, getFavorites, saveCart, saveFavorites } from '@/services/storageService';

export const unstable_settings = {
  initialRouteName: 'login',
};

function RootLayoutContent() {
  const { colorScheme, toggleTheme } = useThemeState();
  const bgColor = colorScheme === 'dark' ? '#1a1a1a' : '#ffffff';
  const dispatch = useDispatch<AppDispatch>();
  const { isInitialized, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const favoriteItems = useSelector((state: RootState) => state.favorites.items);

  // Load data dari storage saat startup
  useEffect(() => {
    const restoreData = async () => {
      try {
        const [savedCart, savedFavorites] = await Promise.all([
          getCart(),
          getFavorites()
        ]);
        
        if (savedCart && savedCart.length > 0) {
          dispatch(loadCartFromStorage(savedCart));
        }
        
        if (savedFavorites && savedFavorites.length > 0) {
          dispatch(loadFavoritesFromStorage(savedFavorites));
        }
      } catch (error) {
        console.error('Failed to restore persistence data:', error);
      }
    };
    restoreData();
  }, [dispatch]);

  // Sync state keranjang ke storage saat ada perubahan
  useEffect(() => {
    if (cartItems.length >= 0) {
      saveCart(cartItems);
    }
  }, [cartItems]);

  // Sync state favorit ke storage saat ada perubahan
  useEffect(() => {
    if (favoriteItems.length >= 0) {
      saveFavorites(favoriteItems);
    }
  }, [favoriteItems]);

  // Check token saat app start
  useEffect(() => {
    dispatch(checkAuthAsync());
  }, [dispatch]);

  // Check for OTA updates (hanya jalan di build native)
  useEffect(() => {
    async function onFetchUpdateAsync() {
      try {
        const update = await Updates.checkForUpdateAsync();

        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          Alert.alert(
            'Pembaruan Tersedia',
            'Versi terbaru aplikasi telah diunduh. Restart sekarang untuk menerapkan perubahan?',
            [
              { text: 'Nanti', style: 'cancel' },
              { text: 'Restart', onPress: async () => await Updates.reloadAsync() },
            ]
          );
        }
      } catch (error) {
        // Abaikan error di development/simulator
        console.log('Update check skipped or failed:', error);
      }
    }

    if (!__DEV__) {
      onFetchUpdateAsync();
    }
  }, []);

  // Loading state saat check token (Custom Splash Screen)
  if (!isInitialized) {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff6ea', justifyContent: 'center', alignItems: 'center' }}>
        <Image
          source={require('@/assets/images/order_logo_new.png')}
          style={{ width: 180, height: 180, marginBottom: 20 }}
          resizeMode="contain"
        />
        <ActivityIndicator size="small" color="#ffffff" />
      </View>
    );
  }

  return (
    <ThemeContext.Provider value={{ colorScheme, toggleTheme }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="(tabs)" />
          </Stack>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        </SafeAreaView>
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <RootLayoutContent />
    </Provider>
  );
}

