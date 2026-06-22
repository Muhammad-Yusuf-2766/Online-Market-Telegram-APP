import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

const STORAGE_KEY = 'pb_tma_auth';

export type TelegramAuthUser = {
  id: string;
  telegramId: string;
  telegramUsername: string | null;
  firstName: string | null;
  lastName: string | null;
  locale?: 'ru' | 'uz';
};

export type AuthState = {
  accessToken: string | null;
  expiresAtMs: number | null;
  user: TelegramAuthUser | null;
};

function readStored(): Partial<AuthState> | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthState;
    if (
      typeof parsed.accessToken !== 'string' ||
      typeof parsed.expiresAtMs !== 'number'
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function persist(state: AuthState) {
  if (!state.accessToken || !state.expiresAtMs) {
    sessionStorage.removeItem(STORAGE_KEY);
    return;
  }
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      accessToken: state.accessToken,
      expiresAtMs: state.expiresAtMs,
      user: state.user,
    }),
  );
}

const stored = readStored();
const now = Date.now();
const initialState: AuthState = {
  accessToken:
    stored?.accessToken && stored.expiresAtMs && stored.expiresAtMs > now + 5000
      ? stored.accessToken
      : null,
  expiresAtMs:
    stored?.expiresAtMs && stored.expiresAtMs > now + 5000
      ? stored.expiresAtMs
      : null,
  user:
    stored?.accessToken && stored.expiresAtMs && stored.expiresAtMs > now + 5000
      ? stored.user ?? null
      : null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{
        accessToken: string;
        expiresIn?: number;
        expiresAtMs?: number;
        user: TelegramAuthUser | null;
      }>,
    ) {
      const { accessToken, user } = action.payload;
      let expiresAtMs = action.payload.expiresAtMs;
      if (expiresAtMs === undefined && action.payload.expiresIn !== undefined) {
        expiresAtMs = Date.now() + action.payload.expiresIn * 1000;
      }
      if (expiresAtMs === undefined) {
        expiresAtMs = Date.now() + 7 * 24 * 3600 * 1000;
      }
      state.accessToken = accessToken;
      state.expiresAtMs = expiresAtMs;
      state.user = user;
      persist(state);
    },
    setUser(state, action: PayloadAction<TelegramAuthUser | null>) {
      state.user = action.payload;
      persist(state);
    },
    logout(state) {
      state.accessToken = null;
      state.expiresAtMs = null;
      state.user = null;
      sessionStorage.removeItem(STORAGE_KEY);
    },
  },
});

export const { setCredentials, setUser, logout } = authSlice.actions;
