import { notifications } from '@mantine/notifications';
import i18n from '../../i18n';
import { playNotificationSound } from './notificationSound';

/** Matches API `NotificationNewPayload` from socket `notifications:new`. */
export type AdminNotificationNewPayload = {
  id: string;
  kind: string;
  orderId: string;
  createdAt: string;
  read: boolean;
};

export function showAdminNotificationToast(payload: AdminNotificationNewPayload): void {
  const kindKey = `notifications.kind.${payload.kind}`;
  const kindLabel = i18n.exists(kindKey)
    ? String(i18n.t(kindKey))
    : payload.kind;
  const orderShort =
    payload.orderId.length > 10 ? `${payload.orderId.slice(0, 8)}…` : payload.orderId;

  notifications.show({
    id: payload.id,
    title: kindLabel,
    message: i18n.t('notifications.toastBody', { order: orderShort }),
    color: 'parfum',
    variant: 'filled',
    withBorder: true,
    autoClose: 6500,
    withCloseButton: true,
  });

  playNotificationSound();
}
