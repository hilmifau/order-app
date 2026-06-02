import axios, { AxiosInstance } from 'axios';
import { getAuthToken } from './storageService';

// Konfigurasi base URL - sesuaikan dengan API server Anda
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://103.125.42.217:8080/public/api';

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Endpoint yang tidak memerlukan autentikasi
const PUBLIC_ENDPOINTS = ['/login', '/register'];

// Request interceptor — otomatis tambahkan Authorization: Bearer {token}
// untuk semua endpoint kecuali /login dan /register (catatan FE #1 & #4)
axiosInstance.interceptors.request.use(
  async (config) => {
    const url = config.url || '';
    // Gunakan URL object atau regex untuk memastikan pencocokan endpoint yang akurat
    // Mengabaikan query parameters untuk pengecekan isPublic
    const pathOnly = url.split('?')[0];
    const isPublic = PUBLIC_ENDPOINTS.some((ep) => pathOnly.endsWith(ep));

    if (!isPublic) {
      try {
        const token = await getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Error getting auth token for request:', error);
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor untuk error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      console.error('API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      // Request made but no response
      console.error('No response from server:', error.request);
    } else {
      // Error in request setup
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
