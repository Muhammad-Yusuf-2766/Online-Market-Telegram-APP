import i18n, { intlLocaleForLanguage } from '../../i18n';

/** `amount` is whole UZS (integer, e.g. 200000). */
export function formatPrice(amountUzs: number): string {
  const locale = intlLocaleForLanguage(i18n.language);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'UZS',
    currencyDisplay: 'code',
    maximumFractionDigits: 0,
  }).format(amountUzs);
}
