import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

const STORAGE_KEY = 'ansor_market_admin_token';

function readStoredToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export type AdminProfile = {
  id: string;
  email: string;
  fullName: string | null;
  isActive: boolean;
  isSuperAdmin: boolean;
  role: {
    id: string;
    key: string;
    name: string;
    isSuperAdmin: boolean;
  } | null;
  permissions: string[];
};

type AuthState = {
  accessToken: string | null;
  profile: AdminProfile | null;
};

const initialState: AuthState = {
  accessToken: readStoredToken(),
  profile: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setProfile(state, action: PayloadAction<AdminProfile | null>) {
      state.profile = action.payload;
    },
    setCredentials(state, action: PayloadAction<{ accessToken: string }>) {
      state.accessToken = action.payload.accessToken;
      state.profile = null;
      try {
        localStorage.setItem(STORAGE_KEY, action.payload.accessToken);
      } catch {
        /* ignore */
      }
    },
    logout(state) {
      state.accessToken = null;
      state.profile = null;
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
    },
  },
});

export const { setCredentials, setProfile, logout } = authSlice.actions;
