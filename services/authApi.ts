
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

// Mock data - TEMPORARY (akan diganti dengan real API nanti)
const MOCK_USERS = [
  {
    id: 'USR001',
    username: 'user1',
    pass: 'pass123',
    kd_cus: 'CUST001',
    name: 'John Doe',
    storeName: 'Store Alpha',
    address: 'Jl. Raya No. 123, Jakarta',
    phone: '021-12345678',
    email: 'user1@store.com',
    memberSince: '2023-01-15',
  },
  {
    id: 'USR002',
    username: 'admin',
    pass: 'admin123',
    kd_cus: 'CUST002',
    name: 'Administrator',
    storeName: 'Main Store',
    address: 'Jl. Utama No. 456, Jakarta',
    phone: '021-87654321',
    email: 'admin@store.com',
    memberSince: '2023-01-01',
  },
];

// Mock API call to /pengguna endpoint
// TODO: Replace dengan real API ketika endpoint /pengguna sudah siap
export const loginApi = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    // Simulasi network delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // MOCK: Cek user dari mock data
    const user = MOCK_USERS.find(
      (u) =>
        u.username === credentials.UserID &&
        u.pass === credentials.Pass &&
        u.kd_cus === credentials.kd_cus
    );

    if (!user) {
      return {
        success: false,
        token: '',
        user: {} as any,
        message: 'UserID, Password, atau Kode Pelanggan salah',
      };
    }

    // Generate mock token
    const token = `token_${user.id}_${Date.now()}`;

    return {
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        storeName: user.storeName,
        address: user.address,
        phone: user.phone,
        email: user.email,
        memberSince: user.memberSince,
      },
    };

    /* REAL API CALL (uncomment ketika API siap):
    const response = await axiosInstance.post('/pengguna', {
      UserID: credentials.UserID,
      Pass: credentials.Pass,
      kd_cus: credentials.kd_cus,
    });

    if (response.data && response.data.success) {
      const token = response.data.token || `token_${credentials.UserID}_${Date.now()}`;

      return {
        success: true,
        token,
        user: {
          id: response.data.user?.id || credentials.UserID,
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
    */
  } catch (error: any) {
    return {
      success: false,
      token: '',
      user: {} as any,
      message: error.message || 'Login error',
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
