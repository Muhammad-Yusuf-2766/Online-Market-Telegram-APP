import { Button, Spinner } from '@telegram-apps/telegram-ui';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  type OrderStatus,
  type UserNotification,
  useGetMyNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from '../../../app/parfumApi';
import { useAppSelector } from '../../../app/hooks';
import { resolveMediaUrl } from '../../../shared/lib/media';

const UZ_ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Kutilmoqda',
  CONFIRMED: 'Tasdiqlangan',
  PREPARING: 'Tayyorlanmoqda',
  SHIPPED: 'Yo‘lda',
  DELIVERED: 'Yetkazilgan',
  CANCELLED: 'Bekor qilingan',
};

function getNotificationPreview(notification: UserNotification) {
  if (notification.kind !== 'ORDER_STATUS') {
    return {
      title: notification.title,
      body: notification.body,
      imageUrl: resolveMediaUrl(notification.imageUrl),
    };
  }

  const metadata = notification.metadata ?? {};
  const rawStatus = metadata.status;
  const status =
    typeof rawStatus === 'string' && rawStatus in UZ_ORDER_STATUS_LABELS
      ? (rawStatus as OrderStatus)
      : null;
  const rawOrderId =
    typeof metadata.orderId === 'string'
      ? metadata.orderId
      : notification.targetUrl?.split('/').filter(Boolean).at(-1) ?? '';
  const orderSuffix = rawOrderId ? ` #${rawOrderId.slice(-6)}` : '';

  return {
    title: `Buyurtma${orderSuffix}`,
    body: status
      ? `Holat: ${UZ_ORDER_STATUS_LABELS[status]}`
      : 'Buyurtma holati yangilandi.',
    imageUrl: resolveMediaUrl(notification.imageUrl),
  };
}

export function NotificationsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const token = useAppSelector((s) => s.auth.accessToken);
  const { data, isLoading } = useGetMyNotificationsQuery(
    { page: 1, pageSize: 50 },
    { skip: !token, pollingInterval: 15000 },
  );
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead, { isLoading: markingAll }] = useMarkAllNotificationsReadMutation();

  if (!token) {
    return (
      <div className="tma-page">
        <h1 className="page-title">{t('notifications.title')}</h1>
        <p className="page-placeholder">{t('notifications.needAuth')}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="tma-page tma-page--centered">
        <Spinner size="l" />
      </div>
    );
  }

  const items = data?.items ?? [];

  return (
    <div className="tma-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <h1 className="page-title" style={{ margin: 0 }}>
          {t('notifications.title')}
        </h1>
        {items.length > 0 ? (
          <Button
            mode="plain"
            size="s"
            loading={markingAll}
            onClick={() => void markAllRead()}
          >
            {t('notifications.markAllRead')}
          </Button>
        ) : null}
      </div>
      {items.length === 0 ? (
        <p className="page-placeholder">{t('notifications.empty')}</p>
      ) : (
        <ul className="notification-list">
          {items.map((n) => {
            const preview = getNotificationPreview(n);
            return (
              <li key={n.id}>
                <button
                  type="button"
                  className={`notification-item${n.readAt ? '' : ' notification-item--unread'}`}
                  onClick={() => {
                    if (!n.readAt) void markRead(n.id);
                    if (n.targetUrl?.startsWith('/')) {
                      navigate(n.targetUrl);
                    }
                  }}
                >
                  {preview.imageUrl ? (
                    <img className="notification-item__img" src={preview.imageUrl} alt="" />
                  ) : null}
                  <div className="notification-item__body">
                    <strong>{preview.title}</strong>
                    <p>{preview.body}</p>
                    <time>{new Date(n.createdAt).toLocaleString('uz-UZ')}</time>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
