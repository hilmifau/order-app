
import axiosInstance from './axiosInstance';

export interface LoginCredentials {
  UserID: string;
  Pass: string;
  kd_cus: string;
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
  console.log('Logging in with credentials:', credentials);
  
  try {
    const payload = {
      UserID: credentials.UserID,
      Pass: credentials.Pass,
      // kd_cus: credentials.kd_cus,
    };

    const response = await axiosInstance.post('/pengguna/login', payload);

    if (response.data && response.data.success) {
      const token = response.data.token || `token_${credentials.UserID}_${Date.now()}`;
      console.log("---response---",response);
      

      return {
        success: true,
        token,
        user: {
          id: response.data.user?.id || credentials.UserID,
          kd_cus: response.data.user?.kd_cus || credentials.kd_cus,
          username: response.data.user?.username || credentials.UserID,
          name: response.data.user?.name || 'User',
          storeName: response.data.user?.storeName || 'Store',
          address: response.data.user?.address || '',
          phone: response.data.user?.phone || '',
          email: response.data.user?.email || '',
          memberSince: response.data.user?.memberSince || new Date().toISOString(),
        },
      };
    }

    return {
      success: false,
      token: '',
      user: {} as any,
      message: response.data?.message || 'Login failed',
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

// Validasi token (untuk check session saat app start)
export const validateToken = async (token: string): Promise<boolean> => {
  // Cek apakah token ada dan tidak empty
  if (!token || token.trim() === '') {
    return false;
  }

  try {
    // Token format: token_[id]_[timestamp]
    return token.startsWith('token_');

    /* REAL API CALL (uncomment ketika API siap):
    const response = await axiosInstance.get('/validate-token', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data?.valid === true;
    */
  } catch (error) {
    return false;
  }
};
