/** Map deep links for delivery coordinates (WGS84). */

export function buildKakaoMapsSearchUrl(addressText: string): string {
  return `https://m.map.kakao.com/scheme/search?q=${encodeURIComponent(addressText)}`;
}

/** Yandex Maps with a point marker; `pt` is lon,lat */
export function buildYandexMapsPointUrl(latitude: number, longitude: number): string {
  return `https://yandex.com/maps/?pt=${longitude},${latitude}&z=16&l=map`;
}
