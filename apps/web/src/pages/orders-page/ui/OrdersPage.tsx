import { Spinner } from '@telegram-apps/telegram-ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { Order } from '../../../app/parfumApi';
import { useListOrdersQuery } from '../../../app/parfumApi';
import { useAppSelector } from '../../../app/hooks';
import { intlLocaleForLanguage } from '../../../i18n';
import { formatPrice } from '../../../shared/lib/money';

const PAGE_SIZE = 15;
const ORDERS_POLL_MS = 5000;

function formatWhen(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}

export function OrdersPage() {
  const { t, i18n } = useTranslation();
  const locale = intlLocaleForLanguage(i18n.language);
  const token = useAppSelector((s) => s.auth.accessToken);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Order[]>([]);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const { data, isLoading, isError, isFetching } = useListOrdersQuery(
    { page, pageSize: PAGE_SIZE },
    {
      skip: !token,
      pollingInterval: ORDERS_POLL_MS,
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    },
  );

  useEffect(() => {
    if (!token) {
      setItems([]);
      setPage(1);
    }
  }, [token]);

  useEffect(() => {
    if (!data) return;
    const pageItems = data.items ?? [];
    setItems((prev) => {
      if (page === 1) return pageItems;
      const start = (page - 1) * PAGE_SIZE;
      return [...prev.slice(0, start), ...pageItems];
    });
  }, [data, page]);

  const orderItems = items ?? [];
  const hasMore = (data?.total ?? 0) > orderItems.length;
  const showInitialLoader = Boolean(token) && isLoading && orderItems.length === 0;

  const loadMore = useCallback(() => {
    if (!hasMore || isFetching) return;
    setPage((p) => p + 1);
  }, [hasMore, isFetching]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const ob = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: '280px' },
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, [loadMore]);

  if (!token) {
    return (
      <div className="tma-page">
        <h1 className="page-title">{t('orders.title')}</h1>
        <p className="page-placeholder">{t('orders.needTelegram')}</p>
      </div>
    );
  }

  if (showInitialLoader) {
    return (
      <div className="tma-page tma-page--centered">
        <Spinner size="l" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="tma-page">
        <h1 className="page-title">{t('orders.title')}</h1>
        <p className="page-placeholder">{t('orders.loadError')}</p>
      </div>
    );
  }

  if (orderItems.length === 0) {
    return (
      <div className="tma-page">
        <h1 className="page-title">{t('orders.title')}</h1>
        <p className="page-placeholder">{t('orders.empty')}</p>
      </div>
    );
  }

  return (
    <div className="tma-page">
      <h1 className="page-title">{t('orders.title')}</h1>
      <ul className="orders-list">
        {orderItems.map((o) => (
          <li key={o.id}>
            <Link to={`/orders/${o.id}`} className="orders-row">
              <div className="orders-row__meta">
                <span className="orders-row__id">{formatWhen(o.createdAt, locale)}</span>
                <span className={`order-status-badge order-status-badge--${o.status}`}>
                  {t(`orderStatus.${o.status}`)}
                </span>
              </div>
              <div style={{ marginTop: 8, fontWeight: 600 }}>
                {formatPrice(o.totalUzs)}
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {hasMore ? (
        <div
          ref={sentinelRef}
          style={{ minHeight: 1, padding: '8px 0' }}
          aria-hidden
        />
      ) : null}
      {isFetching && orderItems.length > 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
          <Spinner size="m" />
        </div>
      ) : null}
    </div>
  );
}
