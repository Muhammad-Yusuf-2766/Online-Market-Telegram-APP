import {
  Button,
  Cell,
  List,
  Section,
  Spinner,
  Title,
} from '@telegram-apps/telegram-ui';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  useGetFrequentlyBoughtTogetherQuery,
  useGetProductFeedbackQuery,
  useGetProductQuery,
  useGetSimilarProductsQuery,
  useGetWishlistQuery,
  useToggleWishlistMutation,
} from '../../../app/parfumApi';
import { useAppDispatch } from '../../../app/hooks';
import { addOrMergeLine } from '../../../features/cart/cartSlice';
import {
  DEFAULT_CART_SIZE_ID,
  type ProductSizeOption,
  sizeSavingsVsSmallest,
} from '../../../shared/lib/productSizes';
import { resolveProductDiscount } from '../../../shared/lib/productDiscount';
import { formatPrice } from '../../../shared/lib/money';
import { ProductRatingInline } from '../../../shared/ui/ProductRatingInline';
import { trackEvent } from '../../../shared/lib/analytics';

function productImageUrl(id: string, images: string[]): string {
  if (images.length > 0) {
    return images[0];
  }
  return `https://picsum.photos/seed/pb-${id}/800/800`;
}

function sortSizes(sizes: ProductSizeOption[]): ProductSizeOption[] {
  return [...sizes].sort((a, b) => a.grams - b.grams);
}

export function ProductPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading, isError } = useGetProductQuery(id ?? '', {
    skip: !id,
  });

  const { data: feedbackPage, isLoading: feedbackLoading } = useGetProductFeedbackQuery(
    { productId: id ?? '', page: 1, pageSize: 50 },
    { skip: !id },
  );
  const { data: similar } = useGetSimilarProductsQuery(id ?? '', { skip: !id });
  const { data: together } = useGetFrequentlyBoughtTogetherQuery(id ?? '', { skip: !id });
  const { data: wishlist } = useGetWishlistQuery();
  const [toggleWishlist] = useToggleWishlistMutation();
  const sizeOptions = useMemo(
    () => (product?.sizes?.length ? sortSizes(product.sizes) : []),
    [product?.sizes],
  );

  const [selectedSizeId, setSelectedSizeId] = useState<string>('');

  useEffect(() => {
    if (sizeOptions.length > 0) {
      setSelectedSizeId(sizeOptions[0]!.id);
    } else {
      setSelectedSizeId('');
    }
  }, [product?.id, sizeOptions]);

  useEffect(() => {
    if (!product?.id) return;
    trackEvent('PRODUCT_VIEW', { productId: product.id });
  }, [product?.id]);

  if (isLoading) {
    return (
      <div className="tma-page tma-page--centered">
        <Spinner size="l" />
      </div>
    );
  }

  if (isError || !product || !id) {
    return (
      <div className="tma-page">
        <h1 className="page-title">{t('product.notFoundTitle')}</h1>
        <p className="page-placeholder">{t('product.notFoundBody')}</p>
        <Button
          mode="filled"
          size="m"
          stretched
          onClick={() => navigate('/')}
          style={{ marginTop: 16 }}
        >
          {t('product.backExplore')}
        </Button>
      </div>
    );
  }

  const hasSizes = sizeOptions.length > 0;
  const selected = hasSizes
    ? sizeOptions.find((s) => s.id === selectedSizeId) ?? sizeOptions[0]!
    : null;

  const displayPriceUzs = hasSizes
    ? selected!.priceUzs
    : product.priceUzs;

  const discount = resolveProductDiscount(product, displayPriceUzs);

  const savings =
    hasSizes && selected
      ? sizeSavingsVsSmallest(selected, sizeOptions)
      : null;

  const trackedGrams =
    product.stockGrams !== null && product.stockGrams !== undefined;
  const maxForSelected =
    hasSizes && selected && product.maxUnitsBySizeId
      ? product.maxUnitsBySizeId[selected.id] ?? 0
      : null;
  const outOfStock =
    trackedGrams &&
    (product.stockGrams! <= 0 ||
      (hasSizes && maxForSelected !== null && maxForSelected <= 0));
  const inWishlist = Boolean(wishlist?.some((item) => item.productId === product.id));

  const stockLabel = !trackedGrams
    ? null
    : outOfStock
      ? t('product.outOfStock')
      : hasSizes && selected && maxForSelected !== null
        ? t('product.stockGramsAndApprox', {
            grams: product.stockGrams,
            count: maxForSelected,
            sizeGrams: selected.grams,
          })
        : t('product.stockGramsTotal', { grams: product.stockGrams });

  return (
    <div className="tma-page">
      <div
        className="explore-card__media product-detail-hero"
        style={{
          borderRadius: 'var(--pb-radius-md)',
          overflow: 'hidden',
          marginBottom: 16,
          border: '1px solid var(--pb-border)',
        }}
      >
        {discount ? (
          <span className="explore-card__badge">
            {t('catalog.discountBadge', { percent: discount.percent })}
          </span>
        ) : null}
        <img
          src={productImageUrl(product.id, product.images)}
          alt=""
          style={{ width: '100%', display: 'block', aspectRatio: '1' }}
        />
      </div>
      <Title weight="1" style={{ marginBottom: 4 }}>
        {product.title}
      </Title>
      <div style={{ marginBottom: 12 }}>
        <ProductRatingInline
          ratingAvg={product.ratingAvg ?? null}
          ratingCount={product.ratingCount ?? 0}
        />
      </div>

      <div className="product-detail-stack">
        {hasSizes ? (
          <Section header={t('product.sizeLabel')}>
            <List>
              {sizeOptions.map((s) => {
                const active = s.id === selectedSizeId;
                return (
                  <Cell
                    key={s.id}
                    interactiveAnimation="background"
                    onClick={() => setSelectedSizeId(s.id)}
                    subtitle={t('product.sizeRowMeta', {
                      price: formatPrice(s.priceUzs),
                      grams: s.grams,
                    })}
                    after={
                      active ? (
                        <span style={{ fontWeight: 700, color: 'var(--tgui--link_color, #2481cc)' }}>
                          ✓
                        </span>
                      ) : null
                    }
                  >
                    {s.label}
                  </Cell>
                );
              })}
            </List>
          </Section>
        ) : null}

        <section className="product-detail-price-card" aria-labelledby="product-price-heading">
          <p id="product-price-heading" className="product-detail-price-card__label">
            {hasSizes ? t('product.selectedPriceTitle') : t('product.basePriceTitle')}
          </p>
          <div className="explore-card__price-row" style={{ marginBottom: 4, flexWrap: 'wrap' }}>
            <Title
              level="2"
              weight="2"
              className="product-detail-price-card__amount"
              style={{ color: 'var(--pb-gold-600)', margin: 0 }}
            >
              {formatPrice(displayPriceUzs)}
            </Title>
            {discount ? (
              <span className="explore-card__old-price" style={{ fontSize: 16 }}>
                {formatPrice(discount.oldPrice)}
              </span>
            ) : null}
          </div>

          {savings ? (
            <div className="product-detail-savings">
              <p className="product-detail-savings__eyebrow">{t('product.savingsLabel')}</p>
              <ul className="product-detail-savings__list">
                <li>{t('product.savingsPerGram', { amount: formatPrice(savings.perGramUzs) })}</li>
                <li>{t('product.savingsTotal', { amount: formatPrice(savings.totalUzs) })}</li>
              </ul>
            </div>
          ) : null}
        </section>

        {stockLabel ? (
          <Section header={t('product.stockSectionTitle')}>
            <List>
              <Cell>{stockLabel}</Cell>
            </List>
          </Section>
        ) : null}

        {product.description ? (
          <Section header={t('product.descriptionTitle')}>
            <div className="product-detail-desc">{product.description}</div>
          </Section>
        ) : null}
      </div>

      <Button
        mode="filled"
        size="l"
        stretched
        disabled={outOfStock}
        style={{ marginTop: 18 }}
        onClick={() => {
          if (outOfStock) return;
          if (hasSizes && !selected) return;
          const sizeId = hasSizes && selected ? selected.id : DEFAULT_CART_SIZE_ID;
          const sizeLabel = hasSizes && selected ? selected.label : null;
          dispatch(
            addOrMergeLine({
              productId: product.id,
              sizeId,
              title: product.title,
              sizeLabel,
              unitPriceUzs: displayPriceUzs,
              imageUrl: product.images[0] ?? null,
              quantity: 1,
            }),
          );
          trackEvent('ADD_TO_CART', { productId: product.id, properties: { sizeId } });
          navigate('/cart');
        }}
      >
        {outOfStock ? t('product.unavailable') : t('product.addToCart')}
      </Button>
      <Button
        mode="bezeled"
        size="m"
        stretched
        style={{ marginTop: 10 }}
        onClick={() => void toggleWishlist({ productId: product.id })}
      >
        {inWishlist ? t('product.inWishlist') : t('product.addWishlist')}
      </Button>

      {(similar?.length ?? 0) > 0 ? (
        <div style={{ marginTop: 20 }}>
          <h3 className="page-title" style={{ fontSize: 18 }}>{t('product.similar')}</h3>
          <div className="explore-grid">
            {(similar ?? []).slice(0, 4).map((sp) => (
              <Link key={sp.id} to={`/product/${sp.id}`} className="explore-card">
                <div className="explore-card__media"><img src={sp.images?.[0] ?? `https://picsum.photos/seed/pb-${sp.id}/400/400`} alt="" /></div>
                <div className="explore-card__meta"><span className="explore-card__title">{sp.title}</span><span className="explore-card__price">{formatPrice(sp.priceUzs)}</span></div>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
      {(together?.length ?? 0) > 0 ? (
        <div style={{ marginTop: 20 }}>
          <h3 className="page-title" style={{ fontSize: 18 }}>{t('product.together')}</h3>
          <div className="explore-grid">
            {(together ?? []).slice(0, 4).map((sp) => (
              <Link key={sp.id} to={`/product/${sp.id}`} className="explore-card">
                <div className="explore-card__media"><img src={sp.images?.[0] ?? `https://picsum.photos/seed/pb-${sp.id}/400/400`} alt="" /></div>
                <div className="explore-card__meta"><span className="explore-card__title">{sp.title}</span><span className="explore-card__price">{formatPrice(sp.priceUzs)}</span></div>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <div style={{ marginTop: 24 }}>
        <Section header={t('product.reviewsTitle')}>
        {feedbackLoading ? (
          <div className="tma-page--centered" style={{ padding: 16 }}>
            <Spinner size="m" />
          </div>
        ) : (feedbackPage?.items?.length ?? 0) === 0 ? (
          <p className="page-placeholder" style={{ padding: '0 16px 12px' }}>
            {t('product.reviewsEmpty')}
          </p>
        ) : (
          <List>
            {(feedbackPage?.items ?? []).map((fb) => (
              <Cell key={fb.id}>
                <div className="product-review-item">
                  <div className="product-review-item__head">
                    <span className="product-review-item__author">{fb.authorDisplay}</span>
                    <span className="product-review-item__stars" aria-hidden>
                      {'★'.repeat(fb.stars)}
                      <span className="product-review-item__stars-empty">
                        {'☆'.repeat(5 - fb.stars)}
                      </span>
                    </span>
                  </div>
                  <p className="product-review-item__text">
                    {fb.comment?.trim()
                      ? fb.comment
                      : t('product.reviewNoText', { stars: fb.stars })}
                  </p>
                </div>
              </Cell>
            ))}
          </List>
        )}
        <p className="page-placeholder" style={{ padding: '8px 16px 12px', fontSize: 13 }}>
          {t('product.reviewsLeaveFromOrder')}
        </p>
        </Section>
      </div>
    </div>
  );
}
