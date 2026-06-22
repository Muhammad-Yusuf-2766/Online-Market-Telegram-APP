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
  useGetBrandsQuery,
  useGetCategoriesQuery,
  useGetFragranceFamiliesQuery,
  useGetHighlightsQuery,
  useGetProductsQuery,
  useGetRecentlyViewedQuery,
} from '../../../app/parfumApi';
import { BannerCarousel } from '../../../widgets/banner-carousel/ui/BannerCarousel';
import { useAppSelector } from '../../../app/hooks';
import { catalogListingDisplay } from '../../../shared/lib/productSizes';
import { formatPrice } from '../../../shared/lib/money';
import { resolveProductDiscount } from '../../../shared/lib/productDiscount';
import { ProductGridTile } from '../../../shared/ui/ProductGridTile';
import { trackEvent } from '../../../shared/lib/analytics';
import './catalog-page.css';

const PAGE_SIZE = 20;

type Gender = 'MEN' | 'WOMEN' | 'UNISEX' | '';

/** Remount grid when filters change so page is never stale on the first request (fixes empty/wrong products). */
function catalogFilterKey(
  categorySlug: string,
  brandSlug: string,
  familySlug: string,
  gender: Gender,
  sort: ProductListSort,
): string {
  return `${categorySlug}\0${brandSlug}\0${familySlug}\0${gender}\0${sort}`;
}

function productImageUrl(id: string, images: string[] | undefined): string {
  if (images?.length) {
    return images[0];
  }
  return `https://picsum.photos/seed/pb-${id}/400/400`;
}

function HighlightCard({
  product,
  extraBadge,
}: {
  product: Product;
  extraBadge?: string;
}) {
  const { t } = useTranslation();
  const list = catalogListingDisplay(product.priceUzs, product.sizes);
  const discount = resolveProductDiscount(product);
  return (
    <Link to={`/product/${product.id}`} className="home-h-card">
      <div className="home-h-card__media">
        {extraBadge ? (
          <span className="home-h-card__badge home-h-card__badge--secondary">
            {extraBadge}
          </span>
        ) : null}
        {discount ? (
          <span
            className="home-h-card__badge"
            style={extraBadge ? { top: 36 } : undefined}
          >
            {t('catalog.discountBadge', { percent: discount.percent })}
          </span>
        ) : null}
        <img
          src={productImageUrl(product.id, product.images)}
          alt=""
          loading="lazy"
        />
      </div>
      <div className="home-h-card__meta">
        <span className="home-h-card__title">{product.title}</span>
        <span className="home-h-card__price-row">
          <span className="home-h-card__price">
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

function HighlightCarouselSkeleton() {
  return (
    <div className="home-h-scroll" aria-hidden>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="home-skel home-skel--card" />
      ))}
    </div>
  );
}

function CatalogInfiniteGrid({
  categorySlug,
  brandSlug,
  familySlug,
  gender,
  sort,
}: {
  categorySlug: string;
  brandSlug: string;
  familySlug: string;
  gender: Gender;
  sort: ProductListSort;
}) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [list, setList] = useState<{ items: Product[]; total: number }>({
    items: [],
    total: 0,
  });
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  /** Avoids double-appending the same page when layout effects run twice (React Strict Mode). */
  const mergedPagesRef = useRef<Set<number>>(new Set());

  const { data, isLoading, isError, isFetching } = useGetProductsQuery({
    page,
    pageSize: PAGE_SIZE,
    categorySlug: categorySlug || undefined,
    brandSlug: brandSlug || undefined,
    familySlug: familySlug || undefined,
    gender: gender || undefined,
    sort: sort !== 'newest' ? sort : undefined,
  });

  useLayoutEffect(() => {
    if (!data) return;
    if (typeof data.page === 'number' && data.page !== page) return;
    const slicePage = typeof data.page === 'number' ? data.page : page;
    if (mergedPagesRef.current.has(slicePage)) return;
    mergedPagesRef.current.add(slicePage);
    const pageItems = data.items ?? [];
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fold RTK page slices into accumulated list before paint
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
    const root =
      (document.querySelector('.tma-main') as Element | null) ?? null;
    const ob = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { root, rootMargin: '400px', threshold: 0 },
    );
    ob.observe(el);
    return () => ob.disconnect();
    // Re-subscribe when a fetch finishes while the sentinel stays in view (IO does not re-fire if intersection unchanged).
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
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                padding: 16,
              }}
            >
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
  const token = useAppSelector((s) => s.auth.accessToken);

  const [categorySlug, setCategorySlug] = useState('');
  const [brandSlug, setBrandSlug] = useState('');
  const [familySlug, setFamilySlug] = useState('');
  const [gender, setGender] = useState<Gender>('');
  const [sort, setSort] = useState<ProductListSort>('newest');

  const { data: categories } = useGetCategoriesQuery();
  const { data: brands } = useGetBrandsQuery();
  const { data: families } = useGetFragranceFamiliesQuery();
  const { data: banners } = useGetBannersQuery();
  const { data: highlights, isLoading: highlightsLoading } =
    useGetHighlightsQuery();
  const { data: recentlyViewed } = useGetRecentlyViewedQuery(undefined, {
    skip: !token,
  });

  useEffect(() => {
    trackEvent('APP_OPEN');
  }, []);

  const activeCategory = useMemo(
    () => categories?.find((c) => c.slug === categorySlug) ?? null,
    [categories, categorySlug],
  );
  const activeBrand = useMemo(
    () => brands?.find((b) => b.slug === brandSlug) ?? null,
    [brands, brandSlug],
  );

  const activeFamily = useMemo(
    () => families?.find((f) => f.slug === familySlug) ?? null,
    [families, familySlug],
  );

  const hasAnyFilter = Boolean(categorySlug || brandSlug || familySlug || gender);

  const resetAll = useCallback(() => {
    setCategorySlug('');
    setBrandSlug('');
    setFamilySlug('');
    setGender('');
    setSort('newest');
  }, []);

  const bestseller = highlights?.bestseller ?? [];
  const newArrivals = highlights?.newArrivals ?? [];
  const discounted = highlights?.discounted ?? [];
  const recent = recentlyViewed ?? [];

  return (
    <div className="home-page">
      <BannerCarousel banners={banners ?? []} />

      {/* Gender chips */}
      <div
        className="home-chip-row"
        role="tablist"
        aria-label={t('catalog.filterGenderTitle')}
      >
        <GenderChip current={gender} value="" onSelect={setGender}>
          {t('catalog.filterAll')}
        </GenderChip>
        <GenderChip current={gender} value="MEN" onSelect={setGender}>
          {t('catalog.genderMen')}
        </GenderChip>
        <GenderChip current={gender} value="WOMEN" onSelect={setGender}>
          {t('catalog.genderWomen')}
        </GenderChip>
        <GenderChip current={gender} value="UNISEX" onSelect={setGender}>
          {t('catalog.genderUnisex')}
        </GenderChip>
      </div>

      {/* Categories chip row */}
      {categories?.length ? (
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
            <button
              type="button"
              className={`home-chip${categorySlug === '' ? ' home-chip--active' : ''}`}
              onClick={() => setCategorySlug('')}
            >
              {t('catalog.filterAllCategories')}
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`home-chip${
                  categorySlug === c.slug ? ' home-chip--active' : ''
                }`}
                onClick={() =>
                  setCategorySlug((prev) => (prev === c.slug ? '' : c.slug))
                }
              >
                {c.name}
              </button>
            ))}
          </div>
        </>
      ) : null}

      {/* Brand chip row */}
      {brands?.length ? (
        <>
          <div className="home-section__head">
            <h2 className="home-section__title">
              {t('catalog.filterBrandsTitle')}
            </h2>
          </div>
          <div
            className="home-chip-row"
            role="tablist"
            aria-label={t('catalog.filterBrandsTitle')}
          >
            <button
              type="button"
              className={`home-chip${brandSlug === '' ? ' home-chip--active' : ''}`}
              onClick={() => setBrandSlug('')}
            >
              {t('catalog.filterAllBrands')}
            </button>
            {brands.map((b) => (
              <button
                key={b.id}
                type="button"
                className={`home-chip${
                  brandSlug === b.slug ? ' home-chip--active' : ''
                }`}
                onClick={() =>
                  setBrandSlug((prev) => (prev === b.slug ? '' : b.slug))
                }
              >
                {b.name}
              </button>
            ))}
          </div>
        </>
      ) : null}

      {families?.length ? (
        <>
          <div className="home-section__head">
            <h2 className="home-section__title">
              {t('catalog.filterFamiliesTitle')}
            </h2>
          </div>
          <div className="home-chip-row" role="tablist">
            <button
              type="button"
              className={`home-chip${familySlug === '' ? ' home-chip--active' : ''}`}
              onClick={() => setFamilySlug('')}
            >
              {t('catalog.filterAllFamilies')}
            </button>
            {families.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`home-chip${
                  familySlug === f.slug ? ' home-chip--active' : ''
                }`}
                onClick={() =>
                  setFamilySlug((prev) => (prev === f.slug ? '' : f.slug))
                }
              >
                {f.name}
              </button>
            ))}
          </div>
        </>
      ) : null}

      {/* Highlight: bestsellers */}
      <section className="home-section">
        <div className="home-section__head">
          <h2 className="home-section__title">{t('catalog.bestseller')}</h2>
        </div>
        {highlightsLoading && bestseller.length === 0 ? (
          <HighlightCarouselSkeleton />
        ) : bestseller.length ? (
          <div className="home-h-scroll">
            {bestseller.map((p) => (
              <HighlightCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <p className="home-empty-section">{t('catalog.sectionEmpty')}</p>
        )}
      </section>

      {/* Highlight: new arrivals */}
      {(highlightsLoading || newArrivals.length > 0) && (
        <section className="home-section">
          <div className="home-section__head">
            <h2 className="home-section__title">{t('catalog.newArrivals')}</h2>
          </div>
          {highlightsLoading && newArrivals.length === 0 ? (
            <HighlightCarouselSkeleton />
          ) : (
            <div className="home-h-scroll">
              {newArrivals.map((p) => (
                <HighlightCard
                  key={p.id}
                  product={p}
                  extraBadge={t('catalog.badgeNew')}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Highlight: discounted */}
      {(highlightsLoading || discounted.length > 0) && (
        <section className="home-section">
          <div className="home-section__head">
            <h2 className="home-section__title">{t('catalog.discounted')}</h2>
          </div>
          {highlightsLoading && discounted.length === 0 ? (
            <HighlightCarouselSkeleton />
          ) : (
            <div className="home-h-scroll">
              {discounted.map((p) => (
                <HighlightCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Highlight: recently viewed (auth only) */}
      {recent.length > 0 ? (
        <section className="home-section">
          <div className="home-section__head">
            <h2 className="home-section__title">
              {t('catalog.recentlyViewed')}
            </h2>
          </div>
          <div className="home-h-scroll">
            {recent.map((p) => (
              <HighlightCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Active filter pills */}
      {hasAnyFilter ? (
        <div className="home-active-filters">
          {activeCategory ? (
            <button
              type="button"
              className="home-active-filters__pill"
              onClick={() => setCategorySlug('')}
              aria-label={t('catalog.removeFilter')}
            >
              {activeCategory.name}
              <span aria-hidden className="home-active-filters__pill-x">
                ×
              </span>
            </button>
          ) : null}
          {activeBrand ? (
            <button
              type="button"
              className="home-active-filters__pill"
              onClick={() => setBrandSlug('')}
              aria-label={t('catalog.removeFilter')}
            >
              {activeBrand.name}
              <span aria-hidden className="home-active-filters__pill-x">
                ×
              </span>
            </button>
          ) : null}
          {gender ? (
            <button
              type="button"
              className="home-active-filters__pill"
              onClick={() => setGender('')}
              aria-label={t('catalog.removeFilter')}
            >
              {gender === 'MEN'
                ? t('catalog.genderMen')
                : gender === 'WOMEN'
                  ? t('catalog.genderWomen')
                  : t('catalog.genderUnisex')}
              <span aria-hidden className="home-active-filters__pill-x">
                ×
              </span>
            </button>
          ) : null}
          {activeFamily ? (
            <button
              type="button"
              className="home-active-filters__pill"
              onClick={() => setFamilySlug('')}
              aria-label={t('catalog.removeFilter')}
            >
              {activeFamily.name}
              <span aria-hidden className="home-active-filters__pill-x">
                ×
              </span>
            </button>
          ) : null}
          <button
            type="button"
            className="home-active-filters__reset"
            onClick={resetAll}
          >
            {t('catalog.resetFilters')}
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

      <CatalogInfiniteGrid
        key={catalogFilterKey(categorySlug, brandSlug, familySlug, gender, sort)}
        categorySlug={categorySlug}
        brandSlug={brandSlug}
        familySlug={familySlug}
        gender={gender}
        sort={sort}
      />
    </div>
  );
}
function GenderChip({
  current,
  value,
  onSelect,
  children,
}: {
  current: Gender;
  value: Gender;
  onSelect: (g: Gender) => void;
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

