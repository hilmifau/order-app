import { AuthResponse, getCurrentUserApi, loginApi, LoginCredentials, logoutApi, registerApi, RegisterCredentials, validateToken } from '@/services/authApi';
import { clearAllStorage, getAuthToken, getUser, removeAuthToken, removeUser, saveAuthToken, saveUser } from '@/services/storageService';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface User {
  id: string;
  kd_cus: string;
  username: string;
  name: string;
  storeName: string;
  address: string;
  phone: string;
  email: string;
  memberSince: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  loading: false,
  error: null,
  isAuthenticated: false,
  isInitialized: false,
};

// Async thunk untuk login
export const loginAsync = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await loginApi(credentials);
      console.log("---response", response);

      if (!response.success) {
        return rejectWithValue(response.message || 'Login failed');
      }

      // Save to persistent storage
      if (response.token) {
        await saveAuthToken(response.token);
      }
      if (response.user) {
        await saveUser(response.user);
      }

      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'An error occurred');
    }
  }
);

// Async thunk untuk register
export const registerAsync = createAsyncThunk(
  'auth/register',
  async (credentials: RegisterCredentials, { rejectWithValue }) => {
    try {
      const response = await registerApi(credentials);
      if (!response.success) {
        return rejectWithValue(response.message || 'Registrasi gagal');
      }

      // Save to persistent storage
      if (response.token) {
        await saveAuthToken(response.token);
      }
      if (response.user) {
        await saveUser(response.user);
      }

      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Terjadi kesalahan saat registrasi');
    }
  }
);

// Async thunk untuk check token saat app start
export const checkAuthAsync = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      const token = await getAuthToken();
      const user = await getUser();

      if (!token) {
        return rejectWithValue('No token found');
      }

      const isValid = await validateToken(token);
      if (!isValid) {
        return rejectWithValue('Token invalid');
      }

      // Jika token valid, return token dan user yang direstore
      return { token, user };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Token validation failed');
    }
  }
);

// Async thunk untuk mengambil data user saat ini
export const fetchCurrentUserAsync = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getCurrentUserApi();
      if (!response.success) {
        return rejectWithValue(response.message || 'Gagal mengambil data user');
      }

      // Save data user yang baru diambil ke storage
      if (response.user) {
        await saveUser(response.user);
      }

      return response.user;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Terjadi kesalahan saat mengambil profil');
    }
  }
);

// Async thunk untuk logout
export const logoutAsync = createAsyncThunk(
  'auth/logoutAsync',
  async (_, { dispatch }) => {
    try {
      await logoutApi();
    } catch (error) {
      console.error('Logout error ignored:', error);
    } finally {
      // Selalu hapus data lokal meskipun API gagal
      await removeAuthToken();
      await removeUser();
      // Bisa panggil clearAllStorage() untuk benar-benar bersih
      await clearAllStorage();
      dispatch(logout());
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Handle loginAsync
    builder
      .addCase(loginAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginAsync.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
      });

    // Handle registerAsync
    builder
      .addCase(registerAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerAsync.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        state.loading = false;
        state.isAuthenticated = !!action.payload.token;
        state.token = action.payload.token || null;
        state.user = action.payload.user || null;
      })
      .addCase(registerAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Handle checkAuthAsync
    builder
      .addCase(checkAuthAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkAuthAsync.fulfilled, (state, action: PayloadAction<{ token: string; user: User | null }>) => {
        state.loading = false;
        state.isInitialized = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(checkAuthAsync.rejected, (state) => {
        state.loading = false;
        state.isInitialized = true;
        state.token = null;
        state.isAuthenticated = false;
        state.user = null;
      });

    // Handle fetchCurrentUserAsync
    builder
      .addCase(fetchCurrentUserAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCurrentUserAsync.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(fetchCurrentUserAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(logoutAsync.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
