import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Provider, useDispatch, useSelector } from 'react-redux';

import { ThemeContext, useThemeState } from '@/hooks/use-theme';
import { checkAuthAsync } from '@/store/authSlice';
import { AppDispatch, RootState, store } from '@/store/store';

export const unstable_settings = {
  initialRouteName: 'login',
};

function RootLayoutContent() {
  const { colorScheme, toggleTheme } = useThemeState();
  const bgColor = colorScheme === 'dark' ? '#1a1a1a' : '#ffffff';
  const dispatch = useDispatch<AppDispatch>();
  const { isInitialized, isAuthenticated } = useSelector((state: RootState) => state.auth);

  // Check token saat app start
  useEffect(() => {
    dispatch(checkAuthAsync());
  }, [dispatch]);

  // Loading state saat check token
  if (!isInitialized) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colorScheme === 'dark' ? '#FFD700' : '#FF9800'} />
      </SafeAreaView>
    );
  }

  return (
    <ThemeContext.Provider value={{ colorScheme, toggleTheme }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="login" />
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

