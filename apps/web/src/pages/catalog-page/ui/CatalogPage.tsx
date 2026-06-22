import { Select, Spinner } from '@telegram-apps/telegram-ui';
import {
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { Product, ProductListSort } from '../../../app/parfumApi';
import {
  getParfumApiBaseUrl,
  useGetBannersQuery,
  useGetBestsellerProductsQuery,
  useGetCategoriesQuery,
  useGetProductsQuery,
  useGetSaleProductsQuery,
} from '../../../app/parfumApi';
import { BannerCarousel } from '../../../widgets/banner-carousel/ui/BannerCarousel';
import { formatPrice } from '../../../shared/lib/money';
import { resolveProductDiscount } from '../../../shared/lib/productDiscount';
import { ProductGridTile } from '../../../shared/ui/ProductGridTile';
import { trackEvent } from '../../../shared/lib/analytics';
import './catalog-page.css';

const PAGE_SIZE = 20;
const SECTION_PAGE_SIZE = 10;

function productImageUrl(id: string, images: string[] | undefined): string {
  return images?.[0] ?? `https://picsum.photos/seed/ansor-${id}/400/400`;
}

function ProductRowCard({ product }: { product: Product }) {
  const { t } = useTranslation();
  const discount = resolveProductDiscount(product);
  return (
    <Link to={`/product/${product.id}`} className="home-h-card">
      <div className="home-h-card__media">
        {discount ? (
          <span className="home-h-card__badge">
            {t('catalog.discountBadge', { percent: discount.percent })}
          </span>
        ) : null}
        <img src={productImageUrl(product.id, product.images)} alt="" loading="lazy" />
      </div>
      <div className="home-h-card__meta">
        <span className="home-h-card__title">{product.title}</span>
        <span className="home-h-card__price-row">
          <span className="home-h-card__price">
            {formatPrice(product.priceKrw)}
          </span>
          {discount ? (
            <span className="home-h-card__old-price">
              {formatPrice(discount.oldPrice)}
            </span>
          ) : null}
        </span>
      </div>
    </Link>
  );
}

function HorizontalRow({ products }: { products: Product[] }) {
  if (products.length === 0) return null;
  return (
    <div className="home-h-scroll">
      {products.map((product) => (
        <ProductRowCard key={product.id} product={product} />
      ))}
    </div>
  );
}

function HighlightSkeleton() {
  return (
    <div className="home-h-scroll" aria-hidden>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="home-skel home-skel--card" />
      ))}
    </div>
  );
}

function ProductSection({
  title,
  rows,
  loading,
}: {
  title: string;
  rows: Product[][];
  loading: boolean;
}) {
  const { t } = useTranslation();
  const hasProducts = rows.some((row) => row.length > 0);
  return (
    <section className="home-section">
      <div className="home-section__head">
        <h2 className="home-section__title">{title}</h2>
        <Link to="/search" className="home-section__link">
          {t('catalog.viewAll')}
        </Link>
      </div>
      {loading && !hasProducts ? (
        <>
          <HighlightSkeleton />
          <HighlightSkeleton />
        </>
      ) : hasProducts ? (
        rows.map((row, index) => <HorizontalRow key={index} products={row} />)
      ) : (
        <p className="home-empty-section">{t('catalog.sectionEmpty')}</p>
      )}
    </section>
  );
}

function CatalogGrid({
  categorySlug,
  sort,
}: {
  categorySlug: string;
  sort: ProductListSort;
}) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [list, setList] = useState<{ items: Product[]; total: number }>({
    items: [],
    total: 0,
  });
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const mergedPagesRef = useRef<Set<number>>(new Set());

  const { data, isLoading, isError, isFetching } = useGetProductsQuery({
    page,
    pageSize: PAGE_SIZE,
    categorySlug: categorySlug || undefined,
    sort: sort !== 'newest' ? sort : undefined,
  });

  useLayoutEffect(() => {
    if (!data) return;
    if (typeof data.page === 'number' && data.page !== page) return;
    const slicePage = typeof data.page === 'number' ? data.page : page;
    if (mergedPagesRef.current.has(slicePage)) return;
    mergedPagesRef.current.add(slicePage);
    const pageItems = data.items ?? [];
    setList((prev) => ({
      items: page === 1 ? pageItems : [...prev.items, ...pageItems],
      total: typeof data.total === 'number' ? data.total : prev.total,
    }));
  }, [data, page]);

  const catalogItems = list.items;
  const total = (list.total || data?.total) ?? 0;
  const hasMore = total > catalogItems.length;
  const showInitialLoader = isLoading && catalogItems.length === 0;

  const loadMore = useCallback(() => {
    if (!hasMore || isFetching) return;
    setPage((p) => p + 1);
  }, [hasMore, isFetching]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const root = (document.querySelector('.tma-main') as Element | null) ?? null;
    const ob = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { root, rootMargin: '400px', threshold: 0 },
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, [loadMore, isFetching, hasMore]);

  if (isError) {
    return (
      <>
        <div className="home-grid-head">
          <h2 className="home-section__title">{t('catalog.allProducts')}</h2>
        </div>
        <div className="tma-page">
          <h2 className="page-title">{t('catalog.loadErrorTitle')}</h2>
          <p className="page-placeholder">
            {t('catalog.loadError', { url: getParfumApiBaseUrl() })}
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="home-grid-head">
        <h2 className="home-section__title">{t('catalog.allProducts')}</h2>
        {total ? (
          <span className="home-grid-head__count">
            {t('catalog.totalCount', { count: total })}
          </span>
        ) : null}
      </div>
      {showInitialLoader ? (
        <div className="home-grid">
          <div className="explore-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="home-skel home-skel--tile" />
            ))}
          </div>
        </div>
      ) : catalogItems.length === 0 ? (
        <p className="home-empty-section">{t('catalog.empty')}</p>
      ) : (
        <div className="home-grid">
          <div className="explore-grid">
            {catalogItems.map((p) => (
              <ProductGridTile key={p.id} product={p} />
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
          {isFetching && catalogItems.length > 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
              <Spinner size="m" />
            </div>
          ) : null}
        </div>
      )}
    </>
  );
}

export function CatalogPage() {
  const { t } = useTranslation();
  const [categorySlug, setCategorySlug] = useState('');
  const [sort, setSort] = useState<ProductListSort>('newest');
  const { data: categories } = useGetCategoriesQuery();
  const { data: banners } = useGetBannersQuery();
  const { data: saleRow1, isLoading: saleLoading1 } = useGetSaleProductsQuery({
    page: 1,
    pageSize: SECTION_PAGE_SIZE,
  });
  const { data: saleRow2, isLoading: saleLoading2 } = useGetSaleProductsQuery({
    page: 2,
    pageSize: SECTION_PAGE_SIZE,
  });
  const { data: bestsellerRow1, isLoading: bestsellerLoading1 } =
    useGetBestsellerProductsQuery({ page: 1, pageSize: SECTION_PAGE_SIZE });
  const { data: bestsellerRow2, isLoading: bestsellerLoading2 } =
    useGetBestsellerProductsQuery({ page: 2, pageSize: SECTION_PAGE_SIZE });

  useEffect(() => {
    trackEvent('APP_OPEN');
  }, []);

  const activeCategory = useMemo(
    () => categories?.find((c) => c.slug === categorySlug) ?? null,
    [categories, categorySlug],
  );
  const hasBanner = Boolean(banners?.length);

  return (
    <div className="home-page">
      {hasBanner ? <BannerCarousel banners={banners ?? []} /> : null}

      {(!hasBanner || categories?.length) ? (
        <>
          <div className="home-section__head">
            <h2 className="home-section__title">
              {t('catalog.filterCategoriesTitle')}
            </h2>
          </div>
          <div
            className="home-chip-row"
            role="tablist"
            aria-label={t('catalog.filterCategoriesTitle')}
          >
            <CategoryChip current={categorySlug} value="" onSelect={setCategorySlug}>
              {t('catalog.filterAllCategories')}
            </CategoryChip>
            {(categories ?? []).map((category) => (
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

      <ProductSection
        title={t('catalog.saleProducts')}
        rows={[saleRow1?.items ?? [], saleRow2?.items ?? []]}
        loading={saleLoading1 || saleLoading2}
      />
      <ProductSection
        title={t('catalog.bestsellerProducts')}
        rows={[bestsellerRow1?.items ?? [], bestsellerRow2?.items ?? []]}
        loading={bestsellerLoading1 || bestsellerLoading2}
      />

      {activeCategory ? (
        <div className="home-active-filters">
          <button
            type="button"
            className="home-active-filters__pill"
            onClick={() => setCategorySlug('')}
            aria-label={t('catalog.removeFilter')}
          >
            {activeCategory.name}
            <span aria-hidden className="home-active-filters__pill-x">
              x
            </span>
          </button>
        </div>
      ) : null}

      <div className="home-grid-head" style={{ marginTop: 8 }}>
        <Select
          id="catalog-sort"
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

      <CatalogGrid key={`${categorySlug}:${sort}`} categorySlug={categorySlug} sort={sort} />
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
