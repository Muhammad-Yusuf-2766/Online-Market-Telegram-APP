import type { ConfigService } from "@nestjs/config";

/**
 * Product `images` may be full URLs or object keys. Telegram `sendPhoto` must receive an absolute
 * **HTTPS** URL that Telegram’s servers can fetch.
 */
export function resolveTelegramImageUrl(raw: string | null | undefined, config: ConfigService): string | undefined {
  const s = raw?.trim();
  if (!s) {
    return undefined;
  }
  const apiBase =
    config.get<string>("API_PUBLIC_URL")?.trim().replace(/\/$/, "") ??
    config.get<string>("PUBLIC_API_URL")?.trim().replace(/\/$/, "");

  if (/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?\/uploads\//i.test(s)) {
    if (!apiBase) return undefined;
    const url = new URL(s);
    return `${apiBase}${url.pathname}${url.search}${url.hash}`;
  }
  if (/^https:\/\//i.test(s)) {
    return s;
  }
  if (/^http:\/\//i.test(s)) {
    return s;
  }
  if (s.startsWith("/uploads/") || s.startsWith("uploads/")) {
    if (!apiBase) return undefined;
    const path = s.startsWith("/") ? s : `/${s}`;
    return `${apiBase}${path}`;
  }
  const base = config.get<string>("MINIO_PUBLIC_URL")?.trim().replace(/\/$/, "");
  if (!base) {
    return undefined;
  }
  const path = s.startsWith("/") ? s : `/${s}`;
  return `${base}${path}`;
}
