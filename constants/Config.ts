/**
 * Application configuration centralized here.
 * Derived from environment variables (expo-constants).
 */

export const Config = {
  // Toggle for using mock/dummy data as fallback
  // Defaults to false (use real API only)
  USE_MOCK_DATA: process.env.EXPO_PUBLIC_USE_MOCK_DATA === 'true',
  
  // API Base URL
  API_URL: process.env.EXPO_PUBLIC_API_URL || 'http://45.112.125.75:8080/public/api',
};

export default Config;
