import { Button, Input, Spinner } from '@telegram-apps/telegram-ui';
import { Switch } from '../../../shared/ui/Switch';
import '../../coins-page/ui/coins-page.css';
import {
  initDataUser,
  isTMA,
  openLink,
  type User as TelegramInitUser,
} from '@telegram-apps/sdk';
import { useSignal } from '@telegram-apps/sdk-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  useClearCartRemoteMutation,
  useCreateOrderMutation,
  useValidatePromoCodeMutation,
  type UserProfile,
} from '../../../app/parfumApi';
import { useParfumMeQuery } from '../../../app/useParfumMeQuery';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import type { TelegramAuthUser } from '../../../features/auth/authSlice';
import type { CartLine } from '../../../features/cart/cartSlice';
import { clearCart } from '../../../features/cart/cartSlice';
import { useTelegramSession } from '../../../features/session/telegramSessionContext';
import { DEFAULT_CART_SIZE_ID } from '../../../shared/lib/productSizes';
import { formatPrice } from '../../../shared/lib/money';
import {
  formatUzPhoneDisplay,
  parseNationalDigits,
  uzPhoneKeyDownGuard,
  uzPhoneToE164,
} from '../../../shared/lib/uzPhoneMask';
import {
  CHECKOUT_FORM_DRAFT_STORAGE_KEY,
  type CheckoutAddressSelection,
  type CheckoutFormDraft,
} from '../checkoutFlow.types';
import { trackEvent } from '../../../shared/lib/analytics';

type CheckoutLocationState = {
  checkoutAddressSelection?: CheckoutAddressSelection;
  checkoutFormDraft?: CheckoutFormDraft;
};

const FORM_DRAFT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

type StoredFormDraft = CheckoutFormDraft & { userId: string; savedAt: number };

function readStoredCheckoutFormDraft(userId: string): CheckoutFormDraft | null {
  try {
    const raw = sessionStorage.getItem(CHECKOUT_FORM_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const row = JSON.parse(raw) as Partial<StoredFormDraft>;
    if (
      row.userId !== userId ||
      typeof row.nationalDigits !== 'string' ||
      typeof row.firstName !== 'string' ||
      typeof row.useCoins !== 'boolean' ||
      typeof row.savedAt !== 'number'
    ) {
      return null;
    }
    if (Date.now() - row.savedAt > FORM_DRAFT_MAX_AGE_MS) {
      sessionStorage.removeItem(CHECKOUT_FORM_DRAFT_STORAGE_KEY);
      return null;
    }
    return {
      nationalDigits: row.nationalDigits,
      firstName: row.firstName,
      useCoins: row.useCoins,
    };
  } catch {
    return null;
  }
}

function writeStoredCheckoutFormDraft(userId: string, draft: CheckoutFormDraft): void {
  const payload: StoredFormDraft = {
    userId,
    savedAt: Date.now(),
    nationalDigits: draft.nationalDigits,
    firstName: draft.firstName,
    useCoins: draft.useCoins,
  };
  sessionStorage.setItem(CHECKOUT_FORM_DRAFT_STORAGE_KEY, JSON.stringify(payload));
}

function clearStoredCheckoutFormDraft(): void {
  sessionStorage.removeItem(CHECKOUT_FORM_DRAFT_STORAGE_KEY);
}

function getInitialCheckoutFields(
  me: UserProfile,
): { nationalDigits: string; firstName: string; useCoins: boolean } {
  const stored = readStoredCheckoutFormDraft(me.id);
  if (stored) {
    return {
      nationalDigits: parseNationalDigits(stored.nationalDigits),
      firstName: stored.firstName,
      useCoins: stored.useCoins,
    };
  }
  return {
    nationalDigits: parseNationalDigits(me.phone ?? ''),
    firstName: me.firstName ?? '',
    useCoins: true,
  };
}

function openMapsExternal(lat: number, lng: number): void {
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`;
  if (openLink.isAvailable()) {
    openLink(url);
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

/** Prefer saved profile; fill gaps from Telegram Web App initData / auth exchange payload. */
function mergeCheckoutProfile(
  me: UserProfile | undefined,
  authUser: TelegramAuthUser | null,
  tgUser: TelegramInitUser | undefined,
): UserProfile | null {
  const tgFirst =
    tgUser?.first_name?.trim() ||
    authUser?.firstName?.trim() ||
    null;
  const tgLast =
    tgUser?.last_name?.trim() ||
    authUser?.lastName?.trim() ||
    null;
  const tgUsername =
    tgUser?.username?.trim() ||
    authUser?.telegramUsername?.trim() ||
    null;
  const telegramId =
    authUser?.telegramId ??
    (tgUser?.id != null ? String(tgUser.id) : null);

  if (me) {
    return {
      ...me,
      firstName: me.firstName?.trim() ? me.firstName : tgFirst,
      lastName: me.lastName?.trim() ? me.lastName : tgLast,
      telegramUsername: me.telegramUsername ?? tgUsername,
    };
  }

  if (!authUser?.id || !telegramId) return null;

  return {
    id: authUser.id,
    telegramId,
    telegramUsername: tgUsername,
    firstName: tgFirst,
    lastName: tgLast,
    locale: authUser.locale ?? 'uz',
    phone: null,
    birthDate: null,
    gender: 'UNSPECIFIED',
    referralCode: '',
    coinBalance: 0,
    createdAt: '',
    updatedAt: '',
  };
}

function errorMessage(
  err: unknown,
  t: (key: string) => string,
): string {
  if (err && typeof err === 'object' && 'data' in err) {
    const data = err.data;
    if (data && typeof data === 'object' && 'message' in data) {
      const m = (data as { message: unknown }).message;
      if (typeof m === 'string') return m;
      if (Array.isArray(m)) return m.map(String).join(', ');
    }
  }
  if (
    err &&
    typeof err === 'object' &&
    'status' in err &&
    err.status === 'FETCH_ERROR'
  ) {
    return t('checkout.networkError');
  }
  return t('checkout.genericError');
}

function CheckoutForm({
  me,
  cartItems,
}: {
  me: UserProfile;
  cartItems: CartLine[];
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const [nationalDigits, setNationalDigits] = useState(() =>
    getInitialCheckoutFields(me).nationalDigits,
  );
  const [phoneUiError, setPhoneUiError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState(() => getInitialCheckoutFields(me).firstName);
  const [shipLat, setShipLat] = useState<number | null>(null);
  const [shipLng, setShipLng] = useState<number | null>(null);
  const [shipLabel, setShipLabel] = useState('');
  const [shippingUiError, setShippingUiError] = useState<string | null>(null);
  const [useCoins, setUseCoins] = useState(() => getInitialCheckoutFields(me).useCoins);
  const appliedPromoFromCart = useAppSelector((s) => s.cart.appliedPromo);
  const [promoCode, setPromoCode] = useState(appliedPromoFromCart?.code ?? '');
  const [promoDiscount, setPromoDiscount] = useState(
    appliedPromoFromCart?.discountUzs ?? 0,
  );

  useEffect(() => {
    if (!appliedPromoFromCart) return;
    setPromoCode(appliedPromoFromCart.code);
    setPromoDiscount(appliedPromoFromCart.discountUzs);
  }, [appliedPromoFromCart]);

  const mustPickShippingPoint = isTMA();
  const [createOrder, { isLoading: submitting, error }] =
    useCreateOrderMutation();
  const [clearCartRemote] = useClearCartRemoteMutation();
  const [validatePromoCode, { isLoading: validatingPromo }] = useValidatePromoCodeMutation();

  useEffect(() => {
    trackEvent('CHECKOUT_START');
  }, []);

  useEffect(() => {
    const state = (location.state ?? {}) as CheckoutLocationState;
    const selected = state.checkoutAddressSelection;
    const formDraft = state.checkoutFormDraft;
    if (formDraft) {
      if (typeof formDraft.nationalDigits === 'string') {
        setNationalDigits(parseNationalDigits(formDraft.nationalDigits));
      }
      if (typeof formDraft.firstName === 'string') {
        setFirstName(formDraft.firstName);
      }
      if (typeof formDraft.useCoins === 'boolean') {
        setUseCoins(formDraft.useCoins);
      }
      clearStoredCheckoutFormDraft();
    }
    if (selected) {
      setShipLat(selected.lat);
      setShipLng(selected.lng);
      setShipLabel(selected.label);
      setShippingUiError(null);
    }
    if (selected || formDraft) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

  const subtotal = cartItems.reduce(
    (sum, line) => sum + line.unitPriceUzs * line.quantity,
    0,
  );

  const maxCoins = Math.min(me.coinBalance ?? 0, subtotal);
  const coinsToSpend = useCoins && maxCoins > 0 ? maxCoins : 0;
  const cashToPay = Math.max(0, subtotal - coinsToSpend - promoDiscount);

  const placeOrderDisabled =
    submitting || (mustPickShippingPoint && (shipLat === null || shipLng === null));

  return (
    <div className="checkout-page">
      <div className="tma-page checkout-page__body">
        <h1 className="page-title">{t('checkout.title')}</h1>
        <p className="page-placeholder" style={{ marginBottom: 16 }}>
          {t('checkout.hint')}
        </p>
        <div className="form-stack">
          <Input
            id="co-phone"
            type="tel"
            inputMode="numeric"
            header={t('checkout.phone')}
            placeholder={t('checkout.phonePlaceholder')}
            status={phoneUiError ? 'error' : 'default'}
            value={formatUzPhoneDisplay(nationalDigits)}
            onChange={(e) => {
              setPhoneUiError(null);
              setNationalDigits(parseNationalDigits(e.target.value));
            }}
            onKeyDown={uzPhoneKeyDownGuard}
            autoComplete="tel"
          />
          {phoneUiError ? (
            <p className="page-placeholder" style={{ margin: '-8px 0 0', color: 'var(--tg-theme-destructive-text-color, #b42318)' }}>
              {phoneUiError}
            </p>
          ) : null}
          <Input
            id="co-first"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder={t('checkout.firstName')}
            autoComplete="given-name"
            required
            header={t('checkout.firstName')}
          />
          {mustPickShippingPoint ? (
            <div className="form-field">
              <p
                className="page-placeholder"
                style={{ margin: '0 0 8px', fontWeight: 600 }}
              >
                {t('checkout.shippingTitle')}
              </p>
              <p className="page-placeholder" style={{ margin: '0 0 8px' }}>
                {t('checkout.shippingHint')}
              </p>
              <Button
                mode={shipLat != null && shipLng != null ? 'bezeled' : 'filled'}
                size="m"
                stretched
                disabled={submitting}
                onClick={() => {
                  const draft: CheckoutFormDraft = {
                    nationalDigits,
                    firstName,
                    useCoins,
                  };
                  writeStoredCheckoutFormDraft(me.id, draft);
                  navigate('/checkout/address', {
                    state: {
                      checkoutAddressDraft: {
                        lat: shipLat,
                        lng: shipLng,
                        label: shipLabel,
                      },
                      checkoutFormDraft: draft,
                    },
                  });
                }}
              >
                {shipLat != null && shipLng != null
                  ? t('checkout.changeAddress')
                  : t('checkout.chooseAddress')}
              </Button>
              {shipLat != null && shipLng != null ? (
                <div className="checkout-address-preview">
                  {shipLabel ? (
                    <p className="checkout-address-preview__label">{shipLabel}</p>
                  ) : null}
                  <p className="checkout-address-preview__coords">
                    {shipLat.toFixed(5)}, {shipLng.toFixed(5)}
                  </p>
                  <div className="checkout-address-preview__actions">
                    <Button
                      mode="bezeled"
                      size="s"
                      onClick={() => openMapsExternal(shipLat, shipLng)}
                    >
                      {t('checkout.openInMaps')}
                    </Button>
                    <Button
                      mode="plain"
                      size="s"
                      disabled={submitting}
                      onClick={() => {
                        setShipLat(null);
                        setShipLng(null);
                        setShipLabel('');
                        setShippingUiError(null);
                      }}
                    >
                      {t('checkout.clearShipping')}
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
        {shippingUiError ? (
          <p
            className="page-placeholder"
            style={{ color: 'var(--pb-danger, #b42318)', marginBottom: 8 }}
          >
            {shippingUiError}
          </p>
        ) : null}
        {error ? (
          <p className="page-placeholder" style={{ color: 'var(--pb-danger, #b42318)' }}>
            {errorMessage(error, t)}
          </p>
        ) : null}
        {maxCoins > 0 ? (
          <div className="checkout-coins">
            <div className="checkout-coins__row">
              <label className="checkout-coins__label" htmlFor="checkout-use-coins">
                {t('checkout.useCoins')}
              </label>
              <Switch
                id="checkout-use-coins"
                checked={useCoins}
                onCheckedChange={setUseCoins}
                disabled={submitting}
              />
            </div>
            <p className="page-placeholder" style={{ margin: '8px 0 0', fontSize: 13 }}>
              {t('checkout.useCoinsHint', { max: maxCoins })} · {t('checkout.balance')}:{' '}
              {formatPrice(me.coinBalance)}
            </p>
            <p className="page-placeholder" style={{ margin: '6px 0 0', fontSize: 13 }}>
              {t('checkout.coinsApplied')}: {formatPrice(coinsToSpend)} · {t('checkout.payCash')}:{' '}
              {formatPrice(cashToPay)}
            </p>
          </div>
        ) : null}
        <div className="form-field">
          <Input
            id="co-promo"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            placeholder={t('checkout.promoPlaceholder')}
            header={t('checkout.promoCode')}
          />
          <Button
            mode="bezeled"
            size="s"
            disabled={validatingPromo || !promoCode.trim()}
            onClick={() => {
              void validatePromoCode({ code: promoCode.trim(), subtotalUzs: subtotal })
                .unwrap()
                .then((res) => setPromoDiscount(res.discountUzs))
                .catch(() => setPromoDiscount(0));
            }}
          >
            {t('checkout.applyPromo')}
          </Button>
          {promoDiscount > 0 ? (
            <p className="page-placeholder" style={{ margin: '6px 0 0', fontSize: 13 }}>
              {t('checkout.promoDiscount')}: {formatPrice(promoDiscount)}
            </p>
          ) : null}
        </div>
      </div>
      <div className="checkout-page__sticky-cta">
        <Button
          mode="filled"
          size="l"
          stretched
          loading={submitting}
          disabled={placeOrderDisabled}
          onClick={() => {
            void (async () => {
              try {
                setShippingUiError(null);
                setPhoneUiError(null);
                const e164 = uzPhoneToE164(nationalDigits);
                if (!e164) {
                  setPhoneUiError(t('checkout.phoneInvalid'));
                  return;
                }
                if (
                  mustPickShippingPoint &&
                  (shipLat === null || shipLng === null)
                ) {
                  setShippingUiError(t('checkout.shippingRequired'));
                  return;
                }
                trackEvent('CHECKOUT_SUBMIT', {
                  properties: { subtotal, coinsToSpend, cashToPay },
                });
                const res = await createOrder({
                  items: cartItems.map((l) => ({
                    productId: l.productId,
                    quantity: l.quantity,
                    ...(l.sizeId !== DEFAULT_CART_SIZE_ID
                      ? { sizeId: l.sizeId }
                      : {}),
                  })),
                  deliveryPhone: e164,
                  deliveryFirstName: firstName.trim() || undefined,
                  ...(coinsToSpend > 0 ? { coinsToSpendUzs: coinsToSpend } : {}),
                  ...(promoCode.trim() ? { promoCode: promoCode.trim() } : {}),
                  ...(shipLat != null && shipLng != null
                    ? {
                        deliveryLatitude: shipLat,
                        deliveryLongitude: shipLng,
                      }
                    : {}),
                }).unwrap();
                trackEvent('ORDER_CREATED', { orderId: res.id });
                clearStoredCheckoutFormDraft();
                await clearCartRemote().unwrap();
                dispatch(clearCart());
                navigate(`/orders/${res.id}`);
              } catch {
                /* mutation error surface via `error` */
              }
            })();
          }}
        >
          {t('checkout.placeOrder')} · {formatPrice(cashToPay)}
        </Button>
      </div>
    </div>
  );
}

export function CheckoutPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const token = useAppSelector((s) => s.auth.accessToken);
  const authUser = useAppSelector((s) => s.auth.user);
  const cartItems = useAppSelector((s) => s.cart.items);
  const { isTelegramAuthPending, telegramSignInError } = useTelegramSession();
  const tgSdkUser = useSignal(initDataUser);

  const { data: me, isLoading: meLoading } = useParfumMeQuery({
    skip: !token,
  });

  const checkoutProfile = useMemo(
    () => mergeCheckoutProfile(me, authUser, tgSdkUser ?? undefined),
    [me, authUser, tgSdkUser],
  );

  if (!token) {
    if (isTelegramAuthPending) {
      return (
        <div className="tma-page tma-page--centered">
          <Spinner size="l" />
        </div>
      );
    }
    return (
      <div className="tma-page">
        <h1 className="page-title">{t('checkout.title')}</h1>
        {telegramSignInError ? (
          <p
            className="page-placeholder"
            style={{ color: 'var(--pb-danger, #b42318)', marginBottom: 12 }}
          >
            {telegramSignInError}
          </p>
        ) : null}
        <p className="page-placeholder">{t('checkout.needTelegram')}</p>
        <p className="page-placeholder">{t('checkout.devHint')}</p>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="tma-page">
        <h1 className="page-title">{t('checkout.title')}</h1>
        <p className="page-placeholder">{t('checkout.cartEmpty')}</p>
        <Button
          mode="filled"
          size="m"
          stretched
          style={{ marginTop: 16 }}
          onClick={() => navigate('/')}
        >
          {t('checkout.browseCatalog')}
        </Button>
      </div>
    );
  }

  if (meLoading && !checkoutProfile) {
    return (
      <div className="tma-page tma-page--centered">
        <Spinner size="l" />
      </div>
    );
  }

  if (!checkoutProfile) {
    return (
      <div className="tma-page">
        <h1 className="page-title">{t('checkout.title')}</h1>
        <p className="page-placeholder">{t('checkout.profileLoadError')}</p>
      </div>
    );
  }

  return (
    <CheckoutForm key={checkoutProfile.id} me={checkoutProfile} cartItems={cartItems} />
  );
}
