import axios, { AxiosInstance } from 'axios';

// Konfigurasi base URL - sesuaikan dengan API server Anda
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://45.112.125.75:8080/public/api';

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor untuk error handling
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
