import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TOKEN_KEY = '@auth_token';

/**
 * Simpan authentication token ke AsyncStorage
 */
export const saveAuthToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch (error) {
    console.error('Error saving auth token:', error);
    throw error;
  }
};

/**
 * Ambil authentication token dari AsyncStorage
 */
export const getAuthToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

/**
 * Hapus authentication token dari AsyncStorage
 */
export const removeAuthToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('Error removing auth token:', error);
    throw error;
  }
};

/**
 * Clear semua data (untuk logout)
 */
export const clearAllStorage = async (): Promise<void> => {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error('Error clearing storage:', error);
    throw error;
  }
};
