
import Config from '@/constants/Config';
import { getFriendlyErrorMessage } from '@/utils/apiError';
import { UserRole, normalizeRole } from '@/utils/roles';
import axiosInstance from './axiosInstance';
import { getAuthToken, getDeviceId } from './storageService';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  kd_cus: string;
}

export interface AuthUser {
  id: string;
  kd_cus: string;
  username: string;
  name: string;
  storeName: string;
  address: string;
  phone: string;
  email: string;
  memberSince: string;
  role: UserRole;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: AuthUser;
  message?: string;
}

function mapUser(userData: any, fallbackEmail = ''): AuthUser {
  return {
    id: String(userData?.id || ''),
    kd_cus: userData?.kd_cus || '',
    username: userData?.name || userData?.username || '',
    name: userData?.name || 'User',
    storeName: userData?.storeName || userData?.store_name || 'Store',
    address: userData?.address || '',
    phone: userData?.phone || '',
    email: userData?.email || fallbackEmail,
    memberSince: userData?.memberSince || userData?.created_at || new Date().toISOString(),
    role: normalizeRole(userData?.role),
  };
}

export const loginApi = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  if (Config.USE_MOCK_DATA) {
    return {
      success: true,
      token: 'mock-token-bypass',
      user: {
        id: 'mock-1',
        kd_cus: 'CUS001',
        username: 'Demo User',
        name: 'Demo User',
        storeName: 'Demo Store',
        address: 'Jl. Demo No. 1',
        phone: '081234567890',
        email: credentials.email || 'demo@example.com',
        memberSince: new Date().toISOString(),
        role: 'customer',
      },
    };
  }

  try {
    const response = await axiosInstance.post('/login', {
      email: credentials.email,
      password: credentials.password,
      device_id: await getDeviceId(),
    });

    if (response.data && response.data.success) {
      const userData = response.data.data?.user || response.data.user;
      const token = response.data.data?.token || response.data.token || '';

      return {
        success: true,
        token,
        user: mapUser(userData, credentials.email),
      };
    }

    return {
      success: false,
      token: '',
      user: {} as any,
      message: response.data?.message || 'Login gagal',
    };
  } catch (error: any) {
    console.error('Login API error:', error?.response?.status, error?.response?.data || error?.message);

    const wrongCredentials = 'Email atau password salah. Periksa kembali data login Anda.';
    const errorMessage = getFriendlyErrorMessage(error, {
      fallback: 'Login gagal. Silakan coba lagi.',
      overrides: {
        400: wrongCredentials,
        401: wrongCredentials,
        422: wrongCredentials,
      },
    });

    return {
      success: false,
      token: '',
      user: {} as any,
      message: errorMessage,
    };
  }
};

export const registerApi = async (credentials: RegisterCredentials): Promise<AuthResponse> => {
  try {
    const response = await axiosInstance.post('/register', {
      ...credentials,
      device_id: await getDeviceId(),
    });

    if (response.data && response.data.success) {
      const userData = response.data.data?.user || response.data.user;

      return {
        success: true,
        token: response.data.token || response.data.data?.token || '',
        user: mapUser(userData, credentials.email),
      };
    }

    return {
      success: false,
      token: '',
      user: {} as any,
      message: response.data?.message || 'Registrasi gagal',
    };
  } catch (error: any) {
    console.error('Register API error:', error?.response?.status, error?.response?.data || error?.message);

    let validationMessage = 'Data registrasi tidak valid. Periksa kembali isian Anda.';
    const validationErrors = error?.response?.data?.errors;
    if (validationErrors && typeof validationErrors === 'object') {
      const allMessages = Object.values(validationErrors).flat().join(' ').toLowerCase();
      if (allMessages.includes('taken')) {
        validationMessage = 'Email sudah terdaftar. Gunakan email lain atau silakan login.';
      } else if (allMessages.includes('confirmation')) {
        validationMessage = 'Password dan Konfirmasi Password tidak cocok.';
      }
    }

    const errorMessage = getFriendlyErrorMessage(error, {
      fallback: 'Registrasi gagal. Silakan coba lagi.',
      overrides: {
        400: validationMessage,
        422: validationMessage,
      },
    });

    return {
      success: false,
      token: '',
      user: {} as any,
      message: errorMessage,
    };
  }
};

export const validateToken = async (token: string): Promise<boolean> => {
  return Boolean(token && token.trim() !== '');
};

export const getCurrentUserApi = async (): Promise<{ success: boolean; user: AuthUser | null; message?: string }> => {
  try {
    const token = await getAuthToken();
    const response = await axiosInstance.get('/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.data) {
      const userData = response.data.data || response.data.user || response.data;

      return {
        success: true,
        user: mapUser(userData),
      };
    }

    return { success: false, user: null, message: 'Data user tidak ditemukan' };
  } catch (error: any) {
    console.error('Error fetching current user:', error?.response?.status, error?.response?.data || error.message);
    return {
      success: false,
      user: null,
      message: getFriendlyErrorMessage(error, { fallback: 'Gagal mengambil data profil. Silakan coba lagi.' }),
    };
  }
};

export const logoutApi = async (): Promise<{ success: boolean; message?: string }> => {
  try {
    const token = await getAuthToken();
    const response = await axiosInstance.post('/logout', {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return {
      success: response.data?.success || true,
      message: response.data?.message || 'Logout berhasil',
    };
  } catch (error: any) {
    console.error('Logout API Error:', error?.response?.status, error?.response?.data || error.message);
    return { success: true, message: 'Logout lokal berhasil (API error)' };
  }
};
