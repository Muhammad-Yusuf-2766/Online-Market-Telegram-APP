import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import uz from './locales/uz.json';

export const I18N_STORAGE_KEY = 'parfumbox.lang';
export const LANGUAGES = ['uz'] as const;
export type AppLang = (typeof LANGUAGES)[number];

void i18n.use(initReactI18next).init({
  resources: {
    uz: { translation: uz },
  },
  lng: 'uz',
  fallbackLng: 'uz',
  supportedLngs: LANGUAGES,
  interpolation: { escapeValue: false },
  returnNull: false,
});

if (typeof document !== 'undefined') {
  document.documentElement.lang = 'uz';
}

if (typeof window !== 'undefined') {
  try {
    window.localStorage.setItem(I18N_STORAGE_KEY, 'uz');
  } catch {
    /* localStorage may be blocked */
  }
}

/** Locale string for `Intl.NumberFormat` / `Intl.DateTimeFormat`. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function intlLocaleForLanguage(_lng: string): string {
  return 'uz-UZ';
}

export default i18n;
