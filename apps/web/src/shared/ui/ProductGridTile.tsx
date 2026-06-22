import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { Product } from '../../app/parfumApi';
import { WishlistHeartButton } from '../../features/wishlist/WishlistHeartButton';
import { resolveProductDiscount } from '../lib/productDiscount';
import { catalogListingDisplay } from '../lib/productSizes';
import { formatPrice } from '../lib/money';
import { ProductRatingInline } from './ProductRatingInline';

function productImageUrl(id: string, images: string[] | undefined): string {
  if (images?.length) {
    return images[0];
  }
  return `https://picsum.photos/seed/pb-${id}/400/400`;
}

export function ProductGridTile({ product }: { product: Product }) {
  const { t } = useTranslation();
  const list = catalogListingDisplay(product.priceUzs, product.sizes);
  const discount = resolveProductDiscount(product);

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
