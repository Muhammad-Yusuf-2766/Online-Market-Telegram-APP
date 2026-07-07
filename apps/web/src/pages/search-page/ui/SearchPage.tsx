import { Input, Spinner } from '@telegram-apps/telegram-ui';
import {
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { Product } from '../../../app/parfumApi';
import {
  getParfumApiBaseUrl,
  useGetCategoriesQuery,
  useGetProductsQuery,
} from '../../../app/parfumApi';
import { resolveMediaUrlOrFallback } from '../../../shared/lib/media';
import { formatPrice } from '../../../shared/lib/money';
import { ProductRatingInline } from '../../../shared/ui/ProductRatingInline';
import { trackEvent } from '../../../shared/lib/analytics';
import '../../catalog-page/ui/catalog-page.css';

const PAGE_SIZE = 20;

function productImageUrl(id: string, images: string[] | undefined): string {
  return resolveMediaUrlOrFallback(
    images?.[0],
    `https://picsum.photos/seed/ansor-${id}/400/400`,
  );
}

export function SearchPage() {
  const { t } = useTranslation();
  const [qInput, setQInput] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Product[]>([]);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const { data: categories } = useGetCategoriesQuery();

  useEffect(() => {
    const tmr = window.setTimeout(() => setDebouncedQ(qInput.trim()), 300);
    return () => window.clearTimeout(tmr);
  }, [qInput]);

  useEffect(() => {
    setPage(1);
    setItems([]);
  }, [debouncedQ, categorySlug]);

  useEffect(() => {
    if (!debouncedQ) return;
    trackEvent('SEARCH', { searchQuery: debouncedQ });
  }, [debouncedQ]);

  const { data, isLoading, isError, isFetching } = useGetProductsQuery({
    page,
    pageSize: PAGE_SIZE,
    q: debouncedQ || undefined,
    categorySlug: categorySlug || undefined,
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
          className="tma-form-control"
          type="search"
          header={t('search.queryLabel')}
          placeholder={t('search.queryPlaceholder')}
          value={qInput}
          onChange={(e) => setQInput(e.target.value)}
          autoComplete="off"
        />
      </div>

      {categories?.length ? (
        <>
          <div className="home-section__head" style={{ padding: 0 }}>
            <h2 className="home-section__title">{t('catalog.filterCategoriesTitle')}</h2>
          </div>
          <div
            className="home-chip-row"
            style={{ padding: '0 0 4px' }}
            role="tablist"
            aria-label={t('catalog.filterCategoriesTitle')}
          >
            <CategoryChip current={categorySlug} value="" onSelect={setCategorySlug}>
              {t('catalog.filterAllCategories')}
            </CategoryChip>
            {categories.map((category) => (
              <CategoryChip
                key={category.id}
                current={categorySlug}
                value={category.slug}
                onSelect={(value) =>
                  setCategorySlug((prev) => (prev === value ? '' : value))
                }
              >
                {category.name}
              </CategoryChip>
            ))}
          </div>
        </>
      ) : null}

      {showInitialLoader ? (
        <div className="tma-page tma-page--centered" style={{ padding: 32 }}>
          <Spinner size="l" />
        </div>
      ) : (data?.total ?? 0) === 0 && listItems.length === 0 ? (
        <p className="page-placeholder">{t('search.empty')}</p>
      ) : (
        <>
          <div className="explore-grid">
            {listItems.map((p) => (
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
                      {formatPrice(p.priceKrw)}
                      {p.measurementUnit?.symbol ? (
                        <span style={{ color: 'var(--pb-text-muted)', fontWeight: 500 }}>
                          {' '}
                          / {p.measurementUnit.symbol}
                        </span>
                      ) : null}
                    </span>
                    <ProductRatingInline
                      ratingAvg={p.ratingAvg ?? null}
                      ratingCount={p.ratingCount ?? 0}
                      className="explore-card__rating"
                    />
                  </div>
                </Link>
              ))}
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

function CategoryChip({
  current,
  value,
  onSelect,
  children,
}: {
  current: string;
  value: string;
  onSelect: (value: string) => void;
  children: ReactNode;
}) {
  const isActive = current === value;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      className={`home-chip${isActive ? ' home-chip--active' : ''}`}
      onClick={() => onSelect(value)}
    >
      {children}
    </button>
  );
}
