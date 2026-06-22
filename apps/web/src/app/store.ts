import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { parfumApi } from './parfumApi';
import { authSlice } from '../features/auth/authSlice';
import { cartSlice } from '../features/cart/cartSlice';

export const store = configureStore({
  reducer: {
    [authSlice.name]: authSlice.reducer,
    [cartSlice.name]: cartSlice.reducer,
    [parfumApi.reducerPath]: parfumApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(parfumApi.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
