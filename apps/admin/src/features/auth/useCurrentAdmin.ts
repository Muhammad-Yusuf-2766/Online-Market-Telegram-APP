import { useMemo } from 'react';
import { useAppSelector } from '../../app/hooks';
import { useGetMeQuery } from '../../app/parfumApi';

export function useCurrentAdmin() {
  const token = useAppSelector((s) => s.auth.accessToken);
  const profile = useAppSelector((s) => s.auth.profile);
  const { isError } = useGetMeQuery(undefined, {
    skip: !token,
  });

  const isSuperAdmin = Boolean(profile?.role?.isSuperAdmin);
  const permissions = profile?.permissions ?? [];

  const hasPermission = useMemo(() => {
    const set = new Set(permissions);
    return (key: string) => isSuperAdmin || set.has(key);
  }, [isSuperAdmin, permissions]);

  const isLoading = Boolean(token) && !profile && !isError;

  return {
    profile,
    isLoading,
    isError,
    isSuperAdmin,
    hasPermission,
  };
}
