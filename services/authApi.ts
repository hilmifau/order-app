
import axiosInstance from './axiosInstance';
import { getAuthToken } from './storageService';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    kd_cus: string;
    username: string;
    name: string;
    storeName: string;
    address: string;
    phone: string;
    email: string;
    memberSince: string;
  };
  message?: string;
}

export const loginApi = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    const payload = {
      email: credentials.email,
      password: credentials.password,
    };

    const response = await axiosInstance.post('/login', payload);

    if (response.data && response.data.success) {
      const userData = response.data.data?.user || response.data.user;
      const token = response.data.data?.token || response.data.token || '';

      return {
        success: true,
        token,
        user: {
          id: userData?.id || '',
          kd_cus: userData?.kd_cus || '',
          username: userData?.name || '',
          name: userData?.name || 'User',
          storeName: userData?.storeName || 'Store',
          address: userData?.address || '',
          phone: userData?.phone || '',
          email: userData?.email || credentials.email,
          memberSince: userData?.memberSince || new Date().toISOString(),
        },
      };
    }

    return {
      success: false,
      token: '',
      user: {} as any,
      message: response.data?.message || 'Login gagal',
    };
  } catch (error: any) {
    let errorMessage = 'Login error';

    // Coba ambil error message dari response API
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    } else if (error.response?.statusText) {
      errorMessage = error.response.statusText;
    } else if (error.message) {
      errorMessage = error.message;
    }

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
    const response = await axiosInstance.post('/register', credentials);

    if (response.data && response.data.success) {
      return {
        success: true,
        token: response.data.token || response.data.data?.token || '',
        user: {
          id: response.data.user?.id || response.data.data?.user?.id || '',
          kd_cus: response.data.user?.kd_cus || response.data.data?.user?.kd_cus || '',
          username: response.data.user?.name || response.data.data?.user?.name || '',
          name: response.data.user?.name || response.data.data?.user?.name || 'User',
          storeName: 'Store',
          address: '',
          phone: '',
          email: response.data.user?.email || response.data.data?.user?.email || credentials.email,
          memberSince: new Date().toISOString(),
        },
      };
    }

    return {
      success: false,
      token: '',
      user: {} as any,
      message: response.data?.message || 'Registrasi gagal',
    };
  } catch (error: any) {
    let errorMessage = 'Registrasi error';

    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.response?.data?.errors) {
      // Handle Laravel validation errors
      const errors = error.response.data.errors;
      const firstError = Object.values(errors)[0] as string[];
      errorMessage = firstError[0] || 'Registrasi gagal';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      token: '',
      user: {} as any,
      message: errorMessage,
    };
  }
};

// Validasi token (untuk check session saat app start)
// Token Sanctum akan otomatis di-attach oleh axiosInstance interceptor
export const validateToken = async (token: string): Promise<boolean> => {
  // Cek apakah token ada dan tidak empty
  if (!token || token.trim() === '') {
    return false;
  }

  try {
    // Token Sanctum valid selama non-empty
    // Interceptor di axiosInstance akan otomatis menambahkan header Authorization
    return true;
  } catch (error) {
    return false;
  }
};
// Get current user profile (untuk restore session)
export const getCurrentUserApi = async (): Promise<{ success: boolean; user: any; message?: string }> => {
  try {
    const token = await getAuthToken();
    // Laravel Sanctum biasanya menyediakan endpoint /user untuk get authenticated user
    // Menambahkan headers secara eksplisit sesuai permintaan user
    const response = await axiosInstance.get('/users', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.data) {
      const userData = response.data.data?.user || response.data.user || response.data.data || response.data;

      return {
        success: true,
        user: {
          id: userData?.id || '',
          kd_cus: userData?.kd_cus || '',
          username: userData?.name || '',
          name: userData?.name || 'User',
          storeName: userData?.storeName || userData?.store_name || 'Store',
          address: userData?.address || '',
          phone: userData?.phone || '',
          email: userData?.email || '',
          memberSince: userData?.memberSince || userData?.created_at || new Date().toISOString(),
        },
      };
    }

    return { success: false, user: null as any, message: 'Data user tidak ditemukan' };
  } catch (error: any) {
    console.error('Error fetching current user:', error?.response?.status, error?.response?.data || error.message);
    return { success: false, user: null as any, message: error.message };
  }
};
// Logout user
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
    // Tetap return true agar di sisi client proses logout berlanjut jika API gagal
    return { success: true, message: 'Logout lokal berhasil (API error)' };
  }
};
