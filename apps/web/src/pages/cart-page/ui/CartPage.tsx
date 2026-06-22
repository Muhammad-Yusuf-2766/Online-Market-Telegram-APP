import { Button, Input, Placeholder } from '@telegram-apps/telegram-ui';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { useValidatePromoCodeMutation } from '../../../app/parfumApi';
import {
  removeLine,
  setAppliedPromo,
  setLineQuantity,
} from '../../../features/cart/cartSlice';
import { formatPrice } from '../../../shared/lib/money';

export function CartPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const items = useAppSelector((s) => s.cart.items);
  const appliedPromo = useAppSelector((s) => s.cart.appliedPromo);
  const [promoInput, setPromoInput] = useState(appliedPromo?.code ?? '');
  const [validatePromo, { isLoading: validatingPromo }] = useValidatePromoCodeMutation();

  const subtotal = items.reduce(
    (sum, line) => sum + line.unitPriceUzs * line.quantity,
    0,
  );
  const promoDiscount = appliedPromo?.discountUzs ?? 0;
  const totalAfterPromo = Math.max(0, subtotal - promoDiscount);

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
                <img src={line.imageUrl} alt="" />
              ) : (
                <div className="cart-line__placeholder" aria-hidden />
              )}
            </div>
            <div className="cart-line__body">
              <span className="cart-line__title">
                {line.title}
                {line.sizeLabel ? ` · ${line.sizeLabel}` : ''}
              </span>
              <span className="cart-line__price">
                {formatPrice(line.unitPriceUzs * line.quantity)}
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
                  −
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
      <div className="form-field" style={{ marginBottom: 12 }}>
        <Input
          id="cart-promo"
          value={promoInput}
          onChange={(e) => setPromoInput(e.target.value)}
          placeholder={t('checkout.promoPlaceholder')}
          header={t('checkout.promoCode')}
        />
        <Button
          mode="bezeled"
          size="s"
          disabled={validatingPromo || !promoInput.trim()}
          onClick={() => {
            void validatePromo({ code: promoInput.trim(), subtotalUzs: subtotal })
              .unwrap()
              .then((res) =>
                dispatch(
                  setAppliedPromo({
                    code: promoInput.trim(),
                    discountUzs: res.discountUzs,
                  }),
                ),
              )
              .catch(() => dispatch(setAppliedPromo(null)));
          }}
        >
          {t('checkout.applyPromo')}
        </Button>
        {appliedPromo ? (
          <p className="page-placeholder" style={{ margin: '6px 0 0', fontSize: 13 }}>
            {t('checkout.promoDiscount')}: {formatPrice(appliedPromo.discountUzs)}
          </p>
        ) : null}
      </div>
      <div className="cart-subtotal">
        <span>{t('cart.subtotal')}</span>
        <strong>{formatPrice(totalAfterPromo)}</strong>
      </div>
      <Button
        mode="filled"
        size="l"
        stretched
        onClick={() => navigate('/checkout')}
      >
        {t('cart.checkout')}
      </Button>
    </div>
  );
}
