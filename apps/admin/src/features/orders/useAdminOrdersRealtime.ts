import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import { getParfumApiBaseUrl } from '../../app/apiBase';
import { useAppDispatch } from '../../app/hooks';
import { parfumApi } from '../../app/parfumApi';
import {
  type AdminNotificationNewPayload,
  showAdminNotificationToast,
} from '../notifications/showAdminNotificationToast';

export function useAdminOrdersRealtime(): void {
  const token = useSelector(
    (state: { auth: { accessToken: string | null } }) => state.auth.accessToken,
  );
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!token) return;

    const apiBase = getParfumApiBaseUrl();
    const useRelativeProxy = apiBase === '' || apiBase.startsWith('/');
    const namespaceUrl = useRelativeProxy ? '/admin' : `${apiBase}/admin`;
    const socketPath = useRelativeProxy && apiBase
      ? `${apiBase}/socket.io`
      : '/socket.io';
    const socket = io(namespaceUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      path: socketPath,
      withCredentials: true,
    });

    socket.on('orders:changed', () => {
      dispatch(
        parfumApi.util.invalidateTags([
          { type: 'Order', id: 'LIST' },
          'Stats',
        ]),
      );
    });

    socket.on('notifications:new', (payload: AdminNotificationNewPayload) => {
      dispatch(
        parfumApi.util.updateQueryData('getNotifications', undefined, (draft) => {
          if (draft.some((notification) => notification.id === payload.id)) {
            return;
          }
          draft.unshift({
            id: payload.id,
            kind: payload.kind,
            orderId: payload.orderId,
            read: false,
            createdAt: payload.createdAt,
          });
        }),
      );
      dispatch(parfumApi.util.invalidateTags(['Notification']));
      showAdminNotificationToast(payload);
    });

    return () => {
      socket.disconnect();
    };
  }, [dispatch, token]);
}
