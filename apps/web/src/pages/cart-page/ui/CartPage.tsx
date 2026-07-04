import { Button, Placeholder } from '@telegram-apps/telegram-ui';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { useGetMarketBrandingQuery } from '../../../app/parfumApi';
import { removeLine, setLineQuantity } from '../../../features/cart/cartSlice';
import { formatPrice } from '../../../shared/lib/money';
import { resolveMediaUrl } from '../../../shared/lib/media';

export function CartPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const items = useAppSelector((s) => s.cart.items);
  const { data: settings } = useGetMarketBrandingQuery();
  const subtotal = items.reduce(
    (sum, line) => sum + line.unitPriceKrw * line.quantity,
    0,
  );
  const deliveryPrice = settings?.deliveryPriceKrw ?? 0;
  const freeThreshold = settings?.freeDeliveryThresholdKrw ?? 0;
  const deliveryFee =
    freeThreshold > 0 && subtotal >= freeThreshold ? 0 : deliveryPrice;
  const total = subtotal + deliveryFee;
  const freeDeliveryRemaining =
    freeThreshold > 0 && subtotal < freeThreshold ? freeThreshold - subtotal : 0;

  if (items.length === 0) {
    return (
      <div className="tma-page">
        <h1 className="page-title">{t('cart.title')}</h1>
        <Placeholder
          header={t('cart.emptyHeader')}
          description={t('cart.emptyDescription')}
        />
      </div>
    );
  }

  return (
    <div className="tma-page">
      <h1 className="page-title">{t('cart.title')}</h1>
      <ul className="cart-list">
        {items.map((line) => (
          <li key={line.lineKey} className="cart-line">
            <div className="cart-line__media">
              {line.imageUrl ? (
                <img src={resolveMediaUrl(line.imageUrl) ?? line.imageUrl} alt="" />
              ) : (
                <div className="cart-line__placeholder" aria-hidden />
              )}
            </div>
            <div className="cart-line__body">
              <span className="cart-line__title">
                {line.title}
                {line.unitLabel ? ` / ${line.unitLabel}` : ''}
              </span>
              <span className="cart-line__price">
                {formatPrice(line.unitPriceKrw * line.quantity)}
              </span>
              <div className="cart-line__qty">
                <button
                  type="button"
                  className="cart-qty-btn"
                  onClick={() =>
                    dispatch(
                      setLineQuantity({
                        lineKey: line.lineKey,
                        quantity: line.quantity - 1,
                      }),
                    )
                  }
                  aria-label={t('cart.ariaDecrease')}
                >
                  -
                </button>
                <span className="cart-qty-value">{line.quantity}</span>
                <button
                  type="button"
                  className="cart-qty-btn"
                  onClick={() =>
                    dispatch(
                      setLineQuantity({
                        lineKey: line.lineKey,
                        quantity: line.quantity + 1,
                      }),
                    )
                  }
                  aria-label={t('cart.ariaIncrease')}
                >
                  +
                </button>
                <button
                  type="button"
                  className="cart-line__remove"
                  onClick={() => dispatch(removeLine(line.lineKey))}
                >
                  {t('cart.remove')}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="cart-subtotal">
        <span>{t('cart.productsTotal')}</span>
        <strong>{formatPrice(subtotal)}</strong>
      </div>
      <div className="cart-subtotal">
        <span>{t('cart.delivery')}</span>
        <strong>{deliveryFee === 0 ? t('cart.freeDelivery') : formatPrice(deliveryFee)}</strong>
      </div>
      {freeDeliveryRemaining > 0 ? (
        <p className="page-placeholder" style={{ margin: '0 0 12px' }}>
          {t('cart.freeDeliveryRemaining', {
            amount: formatPrice(freeDeliveryRemaining),
          })}
        </p>
      ) : null}
      <div className="cart-subtotal">
        <span>{t('cart.total')}</span>
        <strong>{formatPrice(total)}</strong>
      </div>
      <Button mode="filled" size="l" stretched onClick={() => navigate('/checkout')}>
        {t('cart.checkout')}
      </Button>
    </div>
  );
}
