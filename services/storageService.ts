import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const AUTH_TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'user_data';
const FAVORITES_KEY = 'favorites_data';
const CART_KEY = 'cart_data';
const OPNAME_CART_KEY = 'opname_cart_data';
const DEVICE_ID_KEY = 'device_id';

const SECURE_STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
};

/** Hindari baca SecureStore di setiap request Axios. */
let memoryToken: string | null | undefined = undefined;

export const getDeviceId = async (): Promise<string> => {
  try {
    const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (existing) {
      return existing;
    }
    const created = `dev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
    await AsyncStorage.setItem(DEVICE_ID_KEY, created);
    return created;
  } catch (error) {
    console.error('Error getting device id:', error);
    return `dev_fallback_${Date.now().toString(36)}`;
  }
};

/**
 * Simpan authentication token ke SecureStore (Encrypted)
 */
export const saveAuthToken = async (token: string): Promise<void> => {
  try {
    memoryToken = token;
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token, SECURE_STORE_OPTIONS);
  } catch (error) {
    console.error('Error saving auth token:', error);
    throw error;
  }
};

/**
 * Ambil authentication token dari SecureStore
 */
export const getAuthToken = async (): Promise<string | null> => {
  try {
    if (memoryToken !== undefined) {
      return memoryToken;
    }
    memoryToken = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    return memoryToken;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

/**
 * Hapus authentication token dari SecureStore
 */
export const removeAuthToken = async (): Promise<void> => {
  try {
    memoryToken = null;
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('Error removing auth token:', error);
    throw error;
  }
};

/**
 * Simpan data user ke AsyncStorage
 */
export const saveUser = async (user: any): Promise<void> => {
  try {
    await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Error saving user data:', error);
    throw error;
  }
};

/**
 * Ambil data user dari AsyncStorage
 */
export const getUser = async (): Promise<any | null> => {
  try {
    const userData = await AsyncStorage.getItem(USER_DATA_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

/**
 * Hapus data user dari AsyncStorage
 */
export const removeUser = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(USER_DATA_KEY);
  } catch (error) {
    console.error('Error removing user data:', error);
    throw error;
  }
};

/**
 * Simpan data favorit ke AsyncStorage
 */
export const saveFavorites = async (items: any[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Error saving favorites:', error);
  }
};

/**
 * Ambil data favorit dari AsyncStorage
 */
export const getFavorites = async (): Promise<any[]> => {
  try {
    const data = await AsyncStorage.getItem(FAVORITES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting favorites:', error);
    return [];
  }
};

/**
 * Simpan data keranjang ke AsyncStorage
 */
export const saveCart = async (items: any[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Error saving cart:', error);
  }
};

/**
 * Ambil data keranjang dari AsyncStorage
 */
export const getCart = async (): Promise<any[]> => {
  try {
    const data = await AsyncStorage.getItem(CART_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting cart:', error);
    return [];
  }
};

export const removeCart = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(CART_KEY);
  } catch (error) {
    console.error('Error removing cart:', error);
  }
};

export const removeFavorites = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(FAVORITES_KEY);
  } catch (error) {
    console.error('Error removing favorites:', error);
  }
};

export const saveOpnameCart = async (items: any[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(OPNAME_CART_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Error saving opname cart:', error);
  }
};

export const getOpnameCart = async (): Promise<any[]> => {
  try {
    const data = await AsyncStorage.getItem(OPNAME_CART_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting opname cart:', error);
    return [];
  }
};

export const removeOpnameCart = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(OPNAME_CART_KEY);
  } catch (error) {
    console.error('Error removing opname cart:', error);
  }
};

/**
 * Clear data autentikasi + cache keranjang/favorit lokal.
 * Data di server tetap tersimpan per user.
 */
export const clearAllStorage = async (): Promise<void> => {
  try {
    memoryToken = null;
    await AsyncStorage.removeItem(USER_DATA_KEY);
    await AsyncStorage.removeItem(CART_KEY);
    await AsyncStorage.removeItem(FAVORITES_KEY);
    await AsyncStorage.removeItem(OPNAME_CART_KEY);
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('Error clearing storage:', error);
    throw error;
  }
};
