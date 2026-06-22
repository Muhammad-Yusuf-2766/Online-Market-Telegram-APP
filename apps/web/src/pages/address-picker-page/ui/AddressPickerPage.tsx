import { Button, Input } from '@telegram-apps/telegram-ui';
import { isCancelledError, locationManager } from '@telegram-apps/sdk';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckoutShippingMap } from '../../checkout-page/ui/CheckoutShippingMap';
import type { CheckoutFormDraft } from '../../checkout-page/checkoutFlow.types';

type NominatimSearchItem = {
  lat: string;
  lon: string;
  display_name: string;
};

type AddressDraft = {
  lat: number | null;
  lng: number | null;
  label: string;
};

type AddressPickerLocationState = {
  checkoutAddressDraft?: AddressDraft;
  checkoutFormDraft?: CheckoutFormDraft;
};

const ADDRESS_DRAFT_KEY = 'pb.checkout.addressDraft';

function parseDraft(raw: string | null): AddressDraft | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as AddressDraft;
    if (
      typeof value !== 'object' ||
      value === null ||
      typeof value.label !== 'string'
    ) {
      return null;
    }
    const lat = value.lat;
    const lng = value.lng;
    if (
      lat !== null &&
      (typeof lat !== 'number' || !Number.isFinite(lat) || lat < -90 || lat > 90)
    ) {
      return null;
    }
    if (
      lng !== null &&
      (typeof lng !== 'number' || !Number.isFinite(lng) || lng < -180 || lng > 180)
    ) {
      return null;
    }
    return { lat, lng, label: value.label };
  } catch {
    return null;
  }
}

export function AddressPickerPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const initialDraft = useMemo(() => {
    const state = (location.state ?? {}) as AddressPickerLocationState;
    const fromState = state.checkoutAddressDraft;
    if (fromState) return fromState;
    const fromStorage = parseDraft(sessionStorage.getItem(ADDRESS_DRAFT_KEY));
    return fromStorage ?? { lat: null, lng: null, label: '' };
  }, [location.state]);

  const [shipLat, setShipLat] = useState<number | null>(initialDraft.lat);
  const [shipLng, setShipLng] = useState<number | null>(initialDraft.lng);
  const [query, setQuery] = useState(initialDraft.label);
  const [results, setResults] = useState<NominatimSearchItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchTouched, setSearchTouched] = useState(false);
  const [pickingLocation, setPickingLocation] = useState(false);
  const [externalMapNonce, setExternalMapNonce] = useState(0);
  const skipSearchOnceRef = useRef(false);
  const canUseTelegramLocation =
    locationManager.mount.isAvailable() &&
    locationManager.requestLocation.isAvailable();

  useEffect(() => {
    const draft: AddressDraft = {
      lat: shipLat,
      lng: shipLng,
      label: query,
    };
    sessionStorage.setItem(ADDRESS_DRAFT_KEY, JSON.stringify(draft));
  }, [shipLat, shipLng, query]);

  useEffect(() => {
    if (skipSearchOnceRef.current) {
      skipSearchOnceRef.current = false;
      return;
    }
    const q = query.trim();
    if (q.length < 3) {
      setResults([]);
      setSearchError(null);
      setSearching(false);
      return;
    }
    const ctrl = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearching(true);
      setSearchError(null);
      try {
        const url =
          `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=0&limit=5` +
          `&accept-language=uz&q=${encodeURIComponent(q)}`;
        const res = await fetch(url, {
          signal: ctrl.signal,
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) {
          throw new Error(`Nominatim status ${res.status}`);
        }
        const data = (await res.json()) as unknown;
        const items = Array.isArray(data)
          ? (data as NominatimSearchItem[]).filter(
              (x) => !!x?.lat && !!x?.lon && !!x?.display_name,
            )
          : [];
        setResults(items);
        setSearchTouched(true);
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        setSearchError(t('addressPicker.searchError'));
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => {
      window.clearTimeout(timer);
      ctrl.abort();
    };
  }, [query, t]);

  async function syncLabelFromCoordinates(lat: number, lng: number) {
    try {
      const url =
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2` +
        `&accept-language=uz` +
        `&lat=${encodeURIComponent(String(lat))}` +
        `&lon=${encodeURIComponent(String(lng))}`;
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) return;
      const data = (await res.json()) as unknown;
      const displayName =
        data && typeof data === 'object' && 'display_name' in data
          ? (data as { display_name?: unknown }).display_name
          : null;
      if (typeof displayName !== 'string' || !displayName.trim()) return;
      skipSearchOnceRef.current = true;
      setQuery(displayName);
      setResults([]);
      setSearchTouched(false);
    } catch {
      // Keep coordinates even if reverse geocoding fails.
    }
  }

  function setCoordinates(lat: number, lng: number, recenterMap: boolean) {
    setShipLat(lat);
    setShipLng(lng);
    setSearchError(null);
    if (recenterMap) {
      setExternalMapNonce((n) => n + 1);
    }
    void syncLabelFromCoordinates(lat, lng);
  }

  async function pickOnTelegramMap() {
    setPickingLocation(true);
    try {
      await locationManager.mount();
      const raw = await locationManager.requestLocation();
      if (!raw || typeof raw !== 'object') {
        setSearchError(t('checkout.shippingFailed'));
        return;
      }
      const o = raw as Record<string, unknown>;
      const lat =
        typeof o.latitude === 'number'
          ? o.latitude
          : typeof o.lat === 'number'
            ? o.lat
            : null;
      const lng =
        typeof o.longitude === 'number'
          ? o.longitude
          : typeof o.lng === 'number'
            ? o.lng
            : null;
      if (lat == null || lng == null) {
        setSearchError(t('checkout.shippingFailed'));
        return;
      }
      setCoordinates(lat, lng, true);
    } catch (e) {
      if (isCancelledError(e)) {
        setSearchError(t('checkout.shippingCancelled'));
      } else {
        setSearchError(t('checkout.shippingFailed'));
      }
    } finally {
      setPickingLocation(false);
    }
  }

  function pickViaGps() {
    if (!navigator.geolocation) {
      setSearchError(t('checkout.gpsUnavailable'));
      return;
    }
    setPickingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoordinates(pos.coords.latitude, pos.coords.longitude, true);
        setPickingLocation(false);
      },
      () => {
        setSearchError(t('checkout.gpsDenied'));
        setPickingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 60_000 },
    );
  }

  function confirmAddress() {
    if (shipLat == null || shipLng == null) return;
    const label = query.trim();
    sessionStorage.removeItem(ADDRESS_DRAFT_KEY);
    const navState = (location.state ?? {}) as AddressPickerLocationState;
    navigate('/checkout', {
      replace: true,
      state: {
        checkoutAddressSelection: {
          lat: shipLat,
          lng: shipLng,
          label,
        },
        ...(navState.checkoutFormDraft
          ? { checkoutFormDraft: navState.checkoutFormDraft }
          : {}),
      },
    });
  }

  return (
    <div className="address-picker-page">
      <div className="tma-page address-picker-page__head">
        <h1 className="page-title">{t('addressPicker.title')}</h1>
        <p className="page-placeholder" style={{ marginBottom: 10 }}>
          {t('addressPicker.hint')}
        </p>
        <Input
          id="co-address-search"
          header={t('addressPicker.search')}
          placeholder={t('addressPicker.searchPlaceholder')}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSearchTouched(false);
          }}
          autoComplete="off"
        />
        {searching ? (
          <p className="page-placeholder address-picker-page__status">
            {t('addressPicker.searching')}
          </p>
        ) : null}
        {searchError ? (
          <p className="page-placeholder address-picker-page__status address-picker-page__status--error">
            {searchError}
          </p>
        ) : null}
        {results.length > 0 ? (
          <div className="checkout-location-search-results">
            {results.map((item, idx) => (
              <button
                key={`${item.lat}:${item.lon}:${idx}`}
                type="button"
                className="checkout-location-search-results__item"
                onClick={() => {
                  const lat = Number(item.lat);
                  const lng = Number(item.lon);
                  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
                  setShipLat(lat);
                  setShipLng(lng);
                  skipSearchOnceRef.current = true;
                  setQuery(item.display_name);
                  setResults([]);
                  setSearchTouched(true);
                  setExternalMapNonce((n) => n + 1);
                }}
              >
                {item.display_name}
              </button>
            ))}
          </div>
        ) : null}
        {!searching &&
        !searchError &&
        searchTouched &&
        query.trim().length >= 3 &&
        results.length === 0 ? (
          <p className="page-placeholder address-picker-page__status">
            {t('addressPicker.noResults')}
          </p>
        ) : null}
        <div className="address-picker-page__quick-actions">
          {canUseTelegramLocation ? (
            <Button
              mode="outline"
              size="m"
              stretched
              loading={pickingLocation}
              disabled={pickingLocation}
              onClick={() => void pickOnTelegramMap()}
            >
              {t('checkout.pickViaTelegram')}
            </Button>
          ) : null}
          {'geolocation' in navigator ? (
            <Button
              mode="white"
              size="m"
              stretched
              loading={pickingLocation}
              disabled={pickingLocation}
              onClick={() => pickViaGps()}
            >
              {t('checkout.useDeviceGps')}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="address-picker-page__map-wrap">
        <CheckoutShippingMap
          latitude={shipLat}
          longitude={shipLng}
          externalViewNonce={externalMapNonce}
          mapHeight="100%"
          className="address-picker-page__map"
          onChange={(lat, lng) => {
            setCoordinates(lat, lng, false);
          }}
        />
      </div>

      <div className="address-picker-page__confirm">
        <Button
          mode="filled"
          size="l"
          stretched
          disabled={shipLat == null || shipLng == null}
          onClick={() => confirmAddress()}
        >
          {t('addressPicker.confirm')}
        </Button>
      </div>
    </div>
  );
}
