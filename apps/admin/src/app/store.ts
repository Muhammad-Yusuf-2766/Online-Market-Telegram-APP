import { configureStore } from '@reduxjs/toolkit';
import { authSlice } from '../features/auth/authSlice';
import { parfumApi } from './parfumApi';

export const store = configureStore({
  reducer: {
    [authSlice.name]: authSlice.reducer,
    [parfumApi.reducerPath]: parfumApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(parfumApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
