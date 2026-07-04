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

function buildKakaoMapSearchUrl(addressText: string): string {
  return `https://m.map.kakao.com/scheme/search?q=${encodeURIComponent(addressText)}`;
}

function openShippingMaps(addressText: string): void {
  const url = buildKakaoMapSearchUrl(addressText);
  if (openLink.isAvailable()) {
    openLink(url);
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

function mapSearchAddressText(order: {
  roadAddressSnapshot: string | null;
  jibunAddressSnapshot: string | null;
  addressNameSnapshot: string;
  buildingNameSnapshot: string | null;
}): string {
  return (
    order.roadAddressSnapshot?.trim() ||
    order.jibunAddressSnapshot?.trim() ||
    order.addressNameSnapshot?.trim() ||
    order.buildingNameSnapshot?.trim() ||
    ''
  );
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

  const mapAddressText = mapSearchAddressText(order);

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
          {order.addressNameSnapshot ? (
            <ShippingMapSearchBlock
              addressText={mapAddressText}
              missingLabel={t('orderDetail.addressNotFound')}
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
      <SectionBlock title={t('orderDetail.summary')}>
        <p style={{ margin: '0 0 6px' }}>
          {t('orderDetail.productsTotal')}: {formatPrice(order.subtotalKrw)}
        </p>
        <p style={{ margin: '0 0 6px' }}>
          {t('orderDetail.deliveryFee')}:{' '}
          {(order.deliveryFeeKrw ?? 0) === 0
            ? t('orderDetail.freeDelivery')
            : formatPrice(order.deliveryFeeKrw)}
        </p>
        <p style={{ margin: 0, fontWeight: 700 }}>
          {t('orderDetail.totalPrice')}: {formatPrice(order.totalKrw)}
        </p>
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

function ShippingMapSearchBlock({
  addressText,
  missingLabel,
  mapLabel,
}: {
  addressText: string;
  missingLabel: string;
  mapLabel: string;
}) {
  const query = addressText.trim();
  return (
    <>
      {!query ? (
        <p className="page-placeholder" style={{ margin: '0 0 8px' }}>
          {missingLabel}
        </p>
      ) : null}
      <Button
        mode="bezeled"
        size="s"
        disabled={!query}
        onClick={() => openShippingMaps(query)}
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
