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
  if (/^https:\/\//i.test(s)) {
    return s;
  }
  if (/^http:\/\//i.test(s)) {
    return s;
  }
  const base = config.get<string>("MINIO_PUBLIC_URL")?.trim().replace(/\/$/, "");
  if (!base) {
    return undefined;
  }
  const path = s.startsWith("/") ? s : `/${s}`;
  return `${base}${path}`;
}
