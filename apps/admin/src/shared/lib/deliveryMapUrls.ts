/**
 * Map deep links for delivery coordinates (WGS84).
 * Yandex uses longitude,latitude order in `pt` / `ll`.
 */

export function buildGoogleMapsSearchUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${latitude},${longitude}`)}`;
}

/** Yandex Maps with a point marker; `pt` is lon,lat */
export function buildYandexMapsPointUrl(latitude: number, longitude: number): string {
  return `https://yandex.com/maps/?pt=${longitude},${latitude}&z=16&l=map`;
}
