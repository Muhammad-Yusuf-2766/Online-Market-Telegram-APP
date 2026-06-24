import i18n, { intlLocaleForLanguage } from '../../i18n';

/** `amount` is whole KRW (integer, e.g. 20000). */
export function formatPrice(amountKrw: number): string {
  const locale = intlLocaleForLanguage(i18n.language);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'KRW',
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: 0,
  }).format(amountKrw);
}
