import { Button, Cell, List, Section, Spinner, Title } from '@telegram-apps/telegram-ui';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useGetProductFeedbackQuery,
  useGetProductQuery,
  useGetWishlistQuery,
  useToggleWishlistMutation,
} from '../../../app/parfumApi';
import { useAppDispatch } from '../../../app/hooks';
import { addOrMergeLine } from '../../../features/cart/cartSlice';
import { resolveProductDiscount } from '../../../shared/lib/productDiscount';
import { formatPrice } from '../../../shared/lib/money';
import { ProductRatingInline } from '../../../shared/ui/ProductRatingInline';
import { trackEvent } from '../../../shared/lib/analytics';

function productImageUrl(id: string, images: string[]): string {
  return images[0] ?? `https://picsum.photos/seed/ansor-${id}/800/800`;
}

export function ProductPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading, isError } = useGetProductQuery(id ?? '', {
    skip: !id,
  });
  const { data: feedbackPage, isLoading: feedbackLoading } =
    useGetProductFeedbackQuery(
      { productId: id ?? '', page: 1, pageSize: 50 },
      { skip: !id },
    );
  const { data: wishlist } = useGetWishlistQuery();
  const [toggleWishlist] = useToggleWishlistMutation();

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
        <Button mode="filled" size="m" stretched onClick={() => navigate('/')}>
          {t('product.backExplore')}
        </Button>
      </div>
    );
  }

  const discount = resolveProductDiscount(product);
  const outOfStock = product.stockQuantity <= 0;
  const inWishlist = Boolean(wishlist?.some((item) => item.productId === product.id));
  const unitLabel = product.measurementUnit?.symbol ?? null;

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
        <section className="product-detail-price-card" aria-labelledby="product-price-heading">
          <p id="product-price-heading" className="product-detail-price-card__label">
            {t('product.basePriceTitle')}
          </p>
          <div className="explore-card__price-row" style={{ marginBottom: 4, flexWrap: 'wrap' }}>
            <Title
              level="2"
              weight="2"
              className="product-detail-price-card__amount"
              style={{ color: 'var(--pb-gold-600)', margin: 0 }}
            >
              {formatPrice(product.priceKrw)}
              {unitLabel ? (
                <span style={{ color: 'var(--pb-text-muted)', fontSize: 16, fontWeight: 500 }}>
                  {' '}
                  / {unitLabel}
                </span>
              ) : null}
            </Title>
            {discount ? (
              <span className="explore-card__old-price" style={{ fontSize: 16 }}>
                {formatPrice(discount.oldPrice)}
              </span>
            ) : null}
          </div>
        </section>

        <Section header={t('product.stockSectionTitle')}>
          <List>
            <Cell>
              {outOfStock
                ? t('product.outOfStock')
                : t('product.stockQuantity', {
                    count: product.stockQuantity,
                    unit: unitLabel ?? '',
                  })}
            </Cell>
          </List>
        </Section>

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
          dispatch(
            addOrMergeLine({
              productId: product.id,
              unitId: product.measurementUnitId,
              title: product.title,
              unitLabel,
              unitPriceKrw: product.priceKrw,
              imageUrl: product.images[0] ?? null,
              quantity: 1,
            }),
          );
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
                        {'*'.repeat(fb.stars)}
                        <span className="product-review-item__stars-empty">
                          {'*'.repeat(5 - fb.stars)}
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
