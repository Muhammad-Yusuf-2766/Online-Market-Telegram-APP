import { Button, Input, Spinner } from '@telegram-apps/telegram-ui';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  type AddressSearchResult,
  type UserAddress,
  useCreateUserAddressMutation,
  useGetUserAddressesQuery,
  useLazySearchAddressesQuery,
} from '../../../app/parfumApi';
import type {
  CheckoutAddressSelection,
  CheckoutFormDraft,
} from '../../checkout-page/checkoutFlow.types';

type AddressPickerLocationState = {
  checkoutAddressSelection?: CheckoutAddressSelection;
  checkoutFormDraft?: CheckoutFormDraft;
  profileAddressMode?: boolean;
  returnTo?: string;
};

function selectionFromSaved(address: UserAddress): CheckoutAddressSelection {
  return {
    addressId: address.id,
    addressName: address.addressName,
    roadAddressName: address.roadAddressName,
    jibunAddressName: address.jibunAddressName,
    buildingName: address.buildingName,
    zoneNo: address.zoneNo,
    detailAddress: address.detailAddress,
    latitude: address.latitude,
    longitude: address.longitude,
  };
}

function selectionFromSearch(
  result: AddressSearchResult,
  detailAddress: string,
): CheckoutAddressSelection {
  return {
    addressName: result.addressName,
    roadAddressName: result.roadAddressName,
    jibunAddressName: result.jibunAddressName,
    buildingName: result.buildingName,
    zoneNo: result.zoneNo,
    detailAddress,
    latitude: result.latitude,
    longitude: result.longitude,
  };
}

function displayAddress(address: CheckoutAddressSelection | AddressSearchResult): string {
  return (
    address.roadAddressName ||
    address.addressName ||
    address.jibunAddressName ||
    ''
  );
}

export function AddressPickerPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const navState = useMemo(
    () => (location.state ?? {}) as AddressPickerLocationState,
    [location.state],
  );
  const profileAddressMode = navState.profileAddressMode === true;
  const returnTo = navState.returnTo || '/profile';
  const { data: savedAddresses, isLoading: savedLoading } =
    useGetUserAddressesQuery();
  const [searchAddresses, { data: results = [], isFetching, error }] =
    useLazySearchAddressesQuery();
  const [createAddress, { isLoading: saving }] = useCreateUserAddressMutation();
  const [query, setQuery] = useState('');
  const [detailAddress, setDetailAddress] = useState(
    navState.checkoutAddressSelection?.detailAddress ?? '',
  );
  const [selected, setSelected] = useState<AddressSearchResult | null>(null);
  const [saveAddress, setSaveAddress] = useState(true);
  const [makeDefault, setMakeDefault] = useState(false);
  const [uiError, setUiError] = useState<string | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const timer = window.setTimeout(() => {
      void searchAddresses(q);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [query, searchAddresses]);

  useEffect(() => {
    if ((savedAddresses?.length ?? 0) >= 3 && !profileAddressMode) {
      setSaveAddress(false);
    }
  }, [profileAddressMode, savedAddresses?.length]);

  function confirm(selection: CheckoutAddressSelection) {
    if (profileAddressMode) {
      navigate(returnTo, { replace: true });
      return;
    }
    navigate('/checkout', {
      replace: true,
      state: {
        checkoutAddressSelection: selection,
        ...(navState.checkoutFormDraft
          ? { checkoutFormDraft: navState.checkoutFormDraft }
          : {}),
      },
    });
  }

  async function confirmSearchResult() {
    if (!selected || !detailAddress.trim()) return;
    setUiError(null);
    const payload = selectionFromSearch(selected, detailAddress.trim());
    try {
      if (saveAddress || profileAddressMode) {
        const saved = await createAddress({
          label: null,
          recipientName: null,
          phone: null,
          addressName: payload.addressName,
          roadAddressName: payload.roadAddressName ?? null,
          jibunAddressName: payload.jibunAddressName ?? null,
          buildingName: payload.buildingName ?? null,
          zoneNo: payload.zoneNo ?? null,
          detailAddress: payload.detailAddress,
          latitude: payload.latitude ?? null,
          longitude: payload.longitude ?? null,
          isDefault: profileAddressMode ? makeDefault : false,
        }).unwrap();
        confirm(selectionFromSaved(saved));
        return;
      }
      confirm(payload);
    } catch {
      setUiError(t('addressPicker.saveError'));
    }
  }

  return (
    <div className="address-picker-page">
      <div className="tma-page address-picker-page__head">
        <h1 className="page-title">{t('addressPicker.title')}</h1>
        <p className="page-placeholder" style={{ marginBottom: 10 }}>
          {t('addressPicker.hint')}
        </p>

        {savedLoading && !profileAddressMode ? (
          <div className="tma-page--centered" style={{ padding: 12 }}>
            <Spinner size="m" />
          </div>
        ) : !profileAddressMode && (savedAddresses?.length ?? 0) > 0 ? (
          <div className="checkout-location-search-results" style={{ marginBottom: 14 }}>
            {savedAddresses?.map((address) => (
              <button
                key={address.id}
                type="button"
                className="checkout-location-search-results__item"
                onClick={() => confirm(selectionFromSaved(address))}
              >
                <strong>{address.label || displayAddress(address)}</strong>
                <span>
                  {displayAddress(address)}
                  {address.detailAddress ? `, ${address.detailAddress}` : ''}
                </span>
              </button>
            ))}
          </div>
        ) : null}

        <Input
          id="co-address-search"
          className="tma-form-control"
          header={t('addressPicker.search')}
          placeholder={t('addressPicker.searchPlaceholder')}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(null);
            setUiError(null);
          }}
          autoComplete="off"
        />
        <p className="form-helper address-picker-page__helper">
          {t('addressPicker.searchHelper')}
        </p>
        {isFetching ? (
          <p className="page-placeholder address-picker-page__status">
            {t('addressPicker.searching')}
          </p>
        ) : null}
        {error || uiError ? (
          <p className="page-placeholder address-picker-page__status address-picker-page__status--error">
            {uiError ?? t('addressPicker.searchError')}
          </p>
        ) : null}
        {results.length > 0 ? (
          <div className="checkout-location-search-results">
            {results.map((item, idx) => (
              <button
                key={`${item.addressName}:${idx}`}
                type="button"
                className="checkout-location-search-results__item"
                onClick={() => {
                  setSelected(item);
                  setQuery(displayAddress(item));
                }}
              >
                <strong>{displayAddress(item)}</strong>
                {item.jibunAddressName ? <span>{item.jibunAddressName}</span> : null}
                {item.zoneNo ? <span>{item.zoneNo}</span> : null}
              </button>
            ))}
          </div>
        ) : null}

        {selected ? (
          <div className="form-stack" style={{ marginTop: 14 }}>
            <Input
              id="co-address-detail"
              className="tma-form-control"
              header={t('addressPicker.detailAddress')}
              placeholder={t('addressPicker.detailPlaceholder')}
              value={detailAddress}
              onChange={(e) => setDetailAddress(e.target.value)}
              autoComplete="street-address"
            />
            {profileAddressMode ? (
              <label className="page-placeholder" style={{ display: 'flex', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={makeDefault}
                  onChange={(e) => setMakeDefault(e.target.checked)}
                />
                <span>{t('addressPicker.makeDefault')}</span>
              </label>
            ) : (
              <label className="page-placeholder" style={{ display: 'flex', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={saveAddress}
                  disabled={(savedAddresses?.length ?? 0) >= 3}
                  onChange={(e) => setSaveAddress(e.target.checked)}
                />
                <span>{t('addressPicker.saveAddress')}</span>
              </label>
            )}
          </div>
        ) : null}
      </div>

      <div className="address-picker-page__confirm">
        <Button
          mode="filled"
          size="l"
          stretched
          loading={saving}
          disabled={!selected || !detailAddress.trim()}
          onClick={() => void confirmSearchResult()}
        >
          {profileAddressMode ? t('addressPicker.saveToProfile') : t('addressPicker.confirm')}
        </Button>
      </div>
    </div>
  );
}
