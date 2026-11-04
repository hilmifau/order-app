import axios, { AxiosInstance } from 'axios';
import { getAuthToken } from './storageService';

// Laravel Backend — Sanctum Bearer token
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

const PUBLIC_ENDPOINTS = ['/login', '/register'];

axiosInstance.interceptors.request.use(
  async (config) => {
    const pathOnly = (config.url || '').split('?')[0];
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
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('No response from server:', error.request);
    } else {
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
