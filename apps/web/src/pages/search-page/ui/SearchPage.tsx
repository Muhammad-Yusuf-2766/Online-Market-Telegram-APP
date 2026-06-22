import { Input, Select, Spinner } from '@telegram-apps/telegram-ui';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { Product, ProductListSort } from '../../../app/parfumApi';
import { getParfumApiBaseUrl, useGetProductsQuery } from '../../../app/parfumApi';
import { catalogListingDisplay } from '../../../shared/lib/productSizes';
import { formatPrice } from '../../../shared/lib/money';
import { ProductRatingInline } from '../../../shared/ui/ProductRatingInline';
import { trackEvent } from '../../../shared/lib/analytics';

const PAGE_SIZE = 20;

function productImageUrl(id: string, images: string[] | undefined): string {
  if (images?.length) {
    return images[0];
  }
  return `https://picsum.photos/seed/pb-${id}/400/400`;
}

export function SearchPage() {
  const { t } = useTranslation();
  const [qInput, setQInput] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [sort, setSort] = useState<ProductListSort>('newest');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Product[]>([]);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const tmr = window.setTimeout(() => setDebouncedQ(qInput.trim()), 300);
    return () => window.clearTimeout(tmr);
  }, [qInput]);

  useEffect(() => {
    setPage(1);
    setItems([]);
  }, [debouncedQ, sort]);

  useEffect(() => {
    if (!debouncedQ) return;
    trackEvent('SEARCH', { searchQuery: debouncedQ });
  }, [debouncedQ]);

  const { data, isLoading, isError, isFetching } = useGetProductsQuery({
    page,
    pageSize: PAGE_SIZE,
    q: debouncedQ || undefined,
    sort,
  });

  useLayoutEffect(() => {
    if (!data) return;
    const pageItems = data.items ?? [];
    setItems((prev) => (page === 1 ? pageItems : [...(prev ?? []), ...pageItems]));
  }, [data, page]);

  const listItems = items ?? [];
  const total = data?.total ?? 0;
  const hasMore = total > listItems.length;
  const showInitialLoader = isLoading && listItems.length === 0;

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

  if (isError) {
    return (
      <div className="tma-page">
        <h1 className="page-title">{t('search.title')}</h1>
        <p className="page-placeholder">
          {t('catalog.loadError', { url: getParfumApiBaseUrl() })}
        </p>
      </div>
    );
  }

  return (
    <div className="tma-page">
      <h1 className="page-title">{t('search.title')}</h1>
      <div className="form-stack" style={{ marginBottom: 16 }}>
        <Input
          id="search-q"
          type="search"
          header={t('search.queryLabel')}
          placeholder={t('search.queryPlaceholder')}
          value={qInput}
          onChange={(e) => setQInput(e.target.value)}
          autoComplete="off"
        />
        <Select
          id="search-sort"
          header={t('search.sortLabel')}
          value={sort}
          onChange={(e) => setSort(e.target.value as ProductListSort)}
        >
          <option value="newest">{t('search.sortNewest')}</option>
          <option value="price_asc">{t('search.sortPriceAsc')}</option>
          <option value="price_desc">{t('search.sortPriceDesc')}</option>
          <option value="title_asc">{t('search.sortTitleAsc')}</option>
          <option value="title_desc">{t('search.sortTitleDesc')}</option>
          <option value="rating_desc">{t('search.sortRatingDesc')}</option>
          <option value="rating_asc">{t('search.sortRatingAsc')}</option>
        </Select>
      </div>

      {showInitialLoader ? (
        <div className="tma-page tma-page--centered" style={{ padding: 32 }}>
          <Spinner size="l" />
        </div>
      ) : (data?.total ?? 0) === 0 && listItems.length === 0 ? (
        <p className="page-placeholder">{t('search.empty')}</p>
      ) : (
        <>
          <div className="explore-grid">
            {listItems.map((p) => {
              const list = catalogListingDisplay(p.priceUzs, p.sizes);
              return (
                <Link key={p.id} to={`/product/${p.id}`} className="explore-card">
                  <div className="explore-card__media">
                    <img
                      src={productImageUrl(p.id, p.images)}
                      alt=""
                      loading="lazy"
                    />
                  </div>
                  <div className="explore-card__meta">
                    <span className="explore-card__title">{p.title}</span>
                    <span className="explore-card__price">
                      {list.showFromPrefix ? (
                        <>
                          {t('catalog.from')}{' '}
                          <span style={{ whiteSpace: 'nowrap' }}>
                            {formatPrice(list.displayPrice)}
                          </span>
                        </>
                      ) : (
                        formatPrice(list.displayPrice)
                      )}
                    </span>
                    <ProductRatingInline
                      ratingAvg={p.ratingAvg ?? null}
                      ratingCount={p.ratingCount ?? 0}
                      className="explore-card__rating"
                    />
                  </div>
                </Link>
              );
            })}
          </div>
          {hasMore ? (
            <div
              ref={sentinelRef}
              className="tma-page--centered"
              style={{ padding: '16px 0', minHeight: 1 }}
              aria-hidden
            />
          ) : null}
          {isFetching && listItems.length > 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
              <Spinner size="m" />
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
