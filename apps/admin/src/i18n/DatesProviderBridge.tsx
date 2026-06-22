import { DatesProvider } from '@mantine/dates';
import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { datesProviderLocale } from './config';

export function DatesProviderBridge({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const locale = datesProviderLocale(i18n.language);

  return (
    <DatesProvider settings={{ locale, firstDayOfWeek: 1 }}>
      {children}
    </DatesProvider>
  );
}
