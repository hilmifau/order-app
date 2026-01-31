import { AuthResponse, loginApi, LoginCredentials, validateToken } from '@/services/authApi';
import { getAuthToken } from '@/services/storageService';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface User {
  id: string;
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
      if (!response.success) {
        return rejectWithValue(response.message || 'Login failed');
      }
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'An error occurred');
    }
  }
);

// Async thunk untuk check token saat app start
export const checkAuthAsync = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        return rejectWithValue('No token found');
      }

      const isValid = await validateToken(token);
      if (!isValid) {
        return rejectWithValue('Token invalid');
      }

      // Jika token valid, return token (dalam real app, bisa fetch user data dari backend)
      return { token };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Token validation failed');
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

    // Handle checkAuthAsync
    builder
      .addCase(checkAuthAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkAuthAsync.fulfilled, (state, action: PayloadAction<{ token: string }>) => {
        state.loading = false;
        state.isInitialized = true;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        // User data akan diisi saat login, ini hanya untuk restore session
      })
      .addCase(checkAuthAsync.rejected, (state) => {
        state.loading = false;
        state.isInitialized = true;
        state.token = null;
        state.isAuthenticated = false;
        state.user = null;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
