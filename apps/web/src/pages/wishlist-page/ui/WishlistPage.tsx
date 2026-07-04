import { Spinner } from '@telegram-apps/telegram-ui';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  useGetWishlistQuery,
  useUpdateWishlistPrefsMutation,
} from '../../../app/parfumApi';
import { Switch } from '../../../shared/ui/Switch';
import { formatPrice } from '../../../shared/lib/money';
import { resolveMediaUrlOrFallback } from '../../../shared/lib/media';

export function WishlistPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useGetWishlistQuery();
  const [updatePrefs] = useUpdateWishlistPrefsMutation();

  if (isLoading) {
    return (
      <div className="tma-page tma-page--centered">
        <Spinner size="l" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="tma-page">
        <h1 className="page-title">{t('wishlist.title')}</h1>
        <p className="page-placeholder">{t('wishlist.empty')}</p>
      </div>
    );
  }

  return (
    <div className="tma-page">
      <h1 className="page-title">{t('wishlist.title')}</h1>
      <ul className="cart-list">
        {data.map((item) => (
          <li key={item.id} className="cart-line">
            <Link to={`/product/${item.product.id}`} className="cart-line__media">
              <img
                src={resolveMediaUrlOrFallback(
                  item.product.images?.[0],
                  `https://picsum.photos/seed/ansor-${item.product.id}/400/400`,
                )}
                alt=""
              />
            </Link>
            <div className="cart-line__body">
              <Link to={`/product/${item.product.id}`} className="cart-line__title">
                {item.product.title}
              </Link>
              <span className="cart-line__price">
                {formatPrice(item.product.priceKrw)}
              </span>
              <div className="wishlist-prefs">
                <label>
                  <span>{t('wishlist.notifyBackInStock')}</span>
                  <Switch
                    checked={item.notifyBackInStock}
                    onCheckedChange={(checked) =>
                      void updatePrefs({
                        productId: item.productId,
                        notifyBackInStock: checked,
                      })
                    }
                  />
                </label>
                <label>
                  <span>{t('wishlist.notifyPriceDrop')}</span>
                  <Switch
                    checked={item.notifyPriceDrop}
                    onCheckedChange={(checked) =>
                      void updatePrefs({
                        productId: item.productId,
                        notifyPriceDrop: checked,
                      })
                    }
                  />
                </label>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
