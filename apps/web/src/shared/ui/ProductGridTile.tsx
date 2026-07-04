import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { Product } from '../../app/parfumApi';
import { WishlistHeartButton } from '../../features/wishlist/WishlistHeartButton';
import { resolveProductDiscount } from '../lib/productDiscount';
import { formatPrice } from '../lib/money';
import { resolveMediaUrlOrFallback } from '../lib/media';
import { ProductRatingInline } from './ProductRatingInline';

function productImageUrl(id: string, images: string[] | undefined): string {
  return resolveMediaUrlOrFallback(
    images?.[0],
    `https://picsum.photos/seed/ansor-${id}/400/400`,
  );
}

export function ProductGridTile({ product }: { product: Product }) {
  const { t } = useTranslation();
  const discount = resolveProductDiscount(product);
  const unitLabel = product.measurementUnit?.symbol;

  return (
    <Link to={`/product/${product.id}`} className="explore-card">
      <div className="explore-card__media">
        {discount ? (
          <span className="explore-card__badge">
            {t('catalog.discountBadge', { percent: discount.percent })}
          </span>
        ) : null}
        <WishlistHeartButton productId={product.id} className="explore-card__wish" />
        <img
          src={productImageUrl(product.id, product.images)}
          alt=""
          loading="lazy"
        />
      </div>
      <div className="explore-card__meta">
        <span className="explore-card__title">{product.title}</span>
        <span className="explore-card__price-row">
          <span className="explore-card__price">
            {formatPrice(product.priceKrw)}
            {unitLabel ? (
              <span style={{ color: 'var(--pb-text-muted)', fontWeight: 500 }}>
                {' '}
                / {unitLabel}
              </span>
            ) : null}
          </span>
          {discount ? (
            <span className="explore-card__old-price">
              {formatPrice(discount.oldPrice)}
            </span>
          ) : null}
        </span>
        <ProductRatingInline
          ratingAvg={product.ratingAvg ?? null}
          ratingCount={product.ratingCount ?? 0}
          className="explore-card__rating"
        />
      </div>
    </Link>
  );
}
