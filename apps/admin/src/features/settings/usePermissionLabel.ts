import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

/** Maps API permission key to i18n key segment (dots and hyphens → underscores). */
export function permissionKeyToI18nId(key: string): string {
  return key.replace(/[.-]/g, '_');
}

type PermissionLike = { key: string; name: string; isSystem?: boolean };

export function usePermissionLabel() {
  const { t } = useTranslation();

  return useCallback(
    (permission: PermissionLike) => {
      const i18nKey = `permissionCatalog.${permissionKeyToI18nId(permission.key)}`;
      const translated = t(i18nKey);
      if (translated !== i18nKey) {
        return translated;
      }
      return permission.name;
    },
    [t],
  );
}
