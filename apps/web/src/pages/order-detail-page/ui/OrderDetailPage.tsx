import { Button, Spinner } from '@telegram-apps/telegram-ui';
import { openLink } from '@telegram-apps/sdk';
import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useCancelOrderMutation, useGetOrderQuery } from '../../../app/parfumApi';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { addOrMergeLine } from '../../../features/cart/cartSlice';
import { OrderLineProductFeedback } from './OrderLineProductFeedback';
import { intlLocaleForLanguage } from '../../../i18n';
import { formatPrice } from '../../../shared/lib/money';

function formatWhen(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date(iso));
}

const ORDER_DETAIL_POLL_MS = 5000;

function openShippingMaps(lat: number, lng: number): void {
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;
  if (openLink.isAvailable()) {
    openLink(url);
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function OrderDetailPage() {
  const { t, i18n } = useTranslation();
  const locale = intlLocaleForLanguage(i18n.language);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { id } = useParams<{ id: string }>();
  const token = useAppSelector((s) => s.auth.accessToken);
  const [cancelOrder, { isLoading: cancelling }] = useCancelOrderMutation();
  const { data: order, isLoading, isError } = useGetOrderQuery(id ?? '', {
    skip: !token || !id,
    pollingInterval: ORDER_DETAIL_POLL_MS,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  if (!token) {
    return (
      <div className="tma-page">
        <h1 className="page-title">{t('orderDetail.title')}</h1>
        <p className="page-placeholder">{t('orderDetail.needSignIn')}</p>
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

  if (isError || !order) {
    return (
      <div className="tma-page">
        <h1 className="page-title">{t('orderDetail.title')}</h1>
        <p className="page-placeholder">{t('orderDetail.notFound')}</p>
        <Button
          mode="filled"
          size="m"
          stretched
          style={{ marginTop: 16 }}
          onClick={() => navigate('/orders')}
        >
          {t('orderDetail.backToOrders')}
        </Button>
      </div>
    );
  }

  return (
    <div className="tma-page">
      <p className="page-placeholder" style={{ marginBottom: 4 }}>
        {formatWhen(order.createdAt, locale)}
      </p>
      <h1
        className={`page-title order-status-badge order-status-badge--${order.status} order-status-badge--lg`}
        style={{ marginBottom: 8 }}
      >
        {t(`orderStatus.${order.status}`)}
      </h1>
      <p
        style={{
          fontSize: 20,
          fontWeight: 700,
          marginBottom: 16,
        }}
      >
        {formatPrice(order.totalKrw)}
      </p>
      {(order.deliveryPhone ||
        order.deliveryFirstName ||
        order.deliveryLastName ||
        order.addressNameSnapshot) && (
        <SectionBlock title={t('orderDetail.delivery')}>
          {order.deliveryFirstName || order.deliveryLastName ? (
            <p style={{ margin: '0 0 8px' }}>
              {[order.deliveryFirstName, order.deliveryLastName]
                .filter(Boolean)
                .join(' ')}
            </p>
          ) : null}
          {order.deliveryPhone ? (
            <p style={{ margin: '0 0 8px' }}>{order.deliveryPhone}</p>
          ) : null}
          <p style={{ margin: '0 0 8px' }}>
            {[order.roadAddressSnapshot || order.addressNameSnapshot, order.detailAddressSnapshot]
              .filter(Boolean)
              .join(', ')}
          </p>
          {order.latitudeSnapshot != null &&
          order.longitudeSnapshot != null ? (
            <ShippingCoordsBlock
              lat={order.latitudeSnapshot}
              lng={order.longitudeSnapshot}
              coordsLabel={t('orderDetail.shippingCoords')}
              mapLabel={t('orderDetail.openShippingOnMap')}
            />
          ) : null}
        </SectionBlock>
      )}
      <SectionBlock title={t('orderDetail.items')}>
        <ul style={{ margin: 0, paddingLeft: 18, listStyle: 'disc' }}>
          {order.items.map((it) => (
            <li key={it.id} style={{ marginBottom: 12 }}>
              <div>
                {it.titleSnapshot} × {it.quantity} —{' '}
                {formatPrice(it.unitPriceKrw * it.quantity)}
                {it.unitSymbolSnapshot ? ` / ${it.unitSymbolSnapshot}` : ''}
              </div>
              {it.productId && order.status !== 'CANCELLED' ? (
                order.status === 'DELIVERED' ? (
                  <OrderLineProductFeedback
                    orderId={order.id}
                    productId={it.productId}
                    lineTitle={it.titleSnapshot}
                  />
                ) : (
                  <p className="page-placeholder order-detail-review-hint" style={{ marginTop: 8 }}>
                    {t('orderDetail.reviewAfterDelivery')}
                  </p>
                )
              ) : null}
            </li>
          ))}
        </ul>
      </SectionBlock>
      {order.status === 'PENDING' ? (
        <Button
          mode="bezeled"
          size="m"
          stretched
          loading={cancelling}
          style={{ marginTop: 16 }}
          onClick={() => {
            if (!window.confirm(t('orderDetail.cancelConfirm'))) return;
            void cancelOrder(order.id)
              .unwrap()
              .catch(() => undefined);
          }}
        >
          {t('orderDetail.cancelOrder')}
        </Button>
      ) : null}
      <Button
        mode="bezeled"
        size="m"
        stretched
        style={{ marginTop: 12 }}
        onClick={() => {
          let added = 0;
          for (const it of order.items) {
            if (!it.productId) continue;
            dispatch(
              addOrMergeLine({
                productId: it.productId,
                title: it.titleSnapshot,
                unitLabel: it.unitSymbolSnapshot,
                unitPriceKrw: it.unitPriceKrw,
                imageUrl: it.imageSnapshot,
                quantity: it.quantity,
              }),
            );
            added += 1;
          }
          if (added > 0) navigate('/cart');
        }}
      >
        {t('orderDetail.orderAgain')}
      </Button>
      <Button
        mode="bezeled"
        size="m"
        stretched
        style={{ marginTop: 12 }}
        onClick={() => navigate('/orders')}
      >
        {t('orderDetail.allOrders')}
      </Button>
    </div>
  );
}

function ShippingCoordsBlock({
  lat,
  lng,
  coordsLabel,
  mapLabel,
}: {
  lat: number;
  lng: number;
  coordsLabel: string;
  mapLabel: string;
}) {
  return (
    <>
      <p style={{ margin: '0 0 8px', fontSize: 14 }}>
        {coordsLabel}:{' '}
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
          {lat.toFixed(5)}, {lng.toFixed(5)}
        </span>
      </p>
      <Button
        mode="bezeled"
        size="s"
        onClick={() => openShippingMaps(lat, lng)}
      >
        {mapLabel}
      </Button>
    </>
  );
}

function SectionBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section style={{ marginBottom: 20 }}>
      <h2
        style={{
          fontSize: 13,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'var(--pb-text-muted)',
          margin: '0 0 8px',
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
