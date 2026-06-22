import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

const ROLE_KEYS = ['super_admin', 'marketolog', 'operator', 'content_manager'] as const;

export function useRoleLabel() {
  const { t } = useTranslation();

  return useCallback(
    (role: { key: string; name: string } | null | undefined) => {
      if (!role) {
        return t('welcome.noRole');
      }
      if (ROLE_KEYS.includes(role.key as (typeof ROLE_KEYS)[number])) {
        const key = `roleCatalog.${role.key}`;
        const translated = t(key);
        if (translated !== key) {
          return translated;
        }
      }
      return role.name;
    },
    [t],
  );
}
