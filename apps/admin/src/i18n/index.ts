import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import dayjs from 'dayjs';
import 'dayjs/locale/uz-latn';
import uz from './locales/uz.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      uz: { translation: uz },
    },
    lng: 'uz',
    fallbackLng: 'uz',
    interpolation: { escapeValue: false },
  })
  .then(() => {
    dayjs.locale('uz-latn');
    document.documentElement.lang = 'uz';
  });

export function intlLocaleForLanguage(_lng: string): string {
  return 'uz-UZ';
}

export default i18n;
