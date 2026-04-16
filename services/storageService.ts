import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const AUTH_TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'user_data';
const FAVORITES_KEY = 'favorites_data';
const CART_KEY = 'cart_data';

/**
 * Simpan authentication token ke SecureStore (Encrypted)
 */
export const saveAuthToken = async (token: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
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
    const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    return token;
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

/**
 * Clear data autentikasi (untuk logout) - Data Favorit & Keranjang dipertahankan sesuai request
 */
export const clearAllStorage = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(USER_DATA_KEY);
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('Error clearing storage:', error);
    throw error;
  }
};
