/** App languages (mini app + bot copy). */
export type AppLocale = "ru" | "uz";

/** Maps Telegram `language_code` or client `locale` to `ru` | `uz` (default `uz`). */
export function normalizeUserLocale(languageCode: string | null | undefined): AppLocale {
  const code = languageCode?.trim().toLowerCase() ?? "";
  if (code.startsWith("ru")) {
    return "ru";
  }
  if (code.startsWith("uz")) {
    return "uz";
  }
  return "uz";
}

export function isAppLocale(s: string): s is AppLocale {
  return s === "ru" || s === "uz";
}
