import i18n, { intlLocaleForLanguage } from '../../i18n';

/** `amount` is whole KRW (integer Korean won). */
export function formatPrice(amountKrw: number): string {
  const locale = intlLocaleForLanguage(i18n.language);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'KRW',
    currencyDisplay: 'code',
    maximumFractionDigits: 0,
  }).format(amountKrw);
}
