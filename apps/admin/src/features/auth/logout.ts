import type { AppDispatch } from '../../app/store';
import { parfumApi } from '../../app/parfumApi';
import { logout as logoutAction } from './authSlice';

/** Clears auth state, localStorage token, and all RTK Query cache. */
export function performLogout(dispatch: AppDispatch) {
  dispatch(logoutAction());
  dispatch(parfumApi.util.resetApiState());
}
