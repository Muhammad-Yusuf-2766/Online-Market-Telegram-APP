import L from 'leaflet';
import { useEffect, useRef, useState } from 'react';
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

/** Default view: Tashkent */
const DEFAULT_LAT = 41.2995;
const DEFAULT_LNG = 69.2401;
const MAP_ZOOM = 12;

/** Fix default marker icons when bundling with Vite */
function ensureDefaultLeafletIcons(): void {
  const proto = L.Icon.Default.prototype as unknown as {
    _getIconUrl?: string;
  };
  delete proto._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

/** Fly map only when parent bumps nonce (e.g. GPS), not on every marker tweak */
function FlyToExternalPick({
  nonce,
  lat,
  lng,
  enabled,
}: {
  nonce: number;
  lat: number;
  lng: number;
  enabled: boolean;
}) {
  const map = useMap();
  const last = useRef(0);
  useEffect(() => {
    if (!enabled || nonce === 0 || nonce === last.current) return;
    last.current = nonce;
    map.flyTo([lat, lng], 15, { duration: 0.55 });
  }, [nonce, lat, lng, enabled, map]);
  return null;
}

function MapClickLayer({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

type Props = {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
  /** Increment when coordinates come from GPS / Telegram so the map recenters */
  externalViewNonce?: number;
  mapHeight?: string;
  className?: string;
};

/**
 * Interactive OSM map: tap to place / move the pin, or drag the marker.
 */
export function CheckoutShippingMap({
  latitude,
  longitude,
  onChange,
  externalViewNonce = 0,
  mapHeight = 'min(56vw, 260px)',
  className,
}: Props) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    ensureDefaultLeafletIcons();
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const hasPin = latitude != null && longitude != null;

  if (!ready) {
    return (
      <div
        className={`checkout-shipping-map checkout-shipping-map--placeholder ${className ?? ''}`.trim()}
        aria-hidden
      />
    );
  }

  return (
    <div className={`checkout-shipping-map ${className ?? ''}`.trim()}>
      <MapContainer
        center={hasPin ? [latitude, longitude] : [DEFAULT_LAT, DEFAULT_LNG]}
        zoom={MAP_ZOOM}
        scrollWheelZoom={false}
        className="checkout-shipping-map__leaflet"
        style={{ height: mapHeight, width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickLayer onPick={onChange} />
        {hasPin ? (
          <>
            <FlyToExternalPick
              nonce={externalViewNonce}
              lat={latitude}
              lng={longitude}
              enabled={hasPin}
            />
            <Marker
              position={[latitude, longitude]}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const p = e.target.getLatLng();
                  onChange(p.lat, p.lng);
                },
              }}
            />
          </>
        ) : null}
      </MapContainer>
    </div>
  );
}
