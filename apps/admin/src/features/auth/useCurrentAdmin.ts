import { useMemo } from 'react';
import { useAppSelector } from '../../app/hooks';
import { useGetMeQuery } from '../../app/parfumApi';

export function useCurrentAdmin() {
  const token = useAppSelector((s) => s.auth.accessToken);
  const profile = useAppSelector((s) => s.auth.profile);
  const { isError } = useGetMeQuery(undefined, {
    skip: !token,
  });

  const isSuperAdmin = Boolean(profile?.isSuperAdmin || profile?.role?.isSuperAdmin);

  const hasPermission = useMemo(() => {
    return (_key: string) => Boolean(profile?.isActive && isSuperAdmin);
  }, [isSuperAdmin, profile?.isActive]);

  const isLoading = Boolean(token) && !profile && !isError;

  return {
    profile,
    isLoading,
    isError,
    isSuperAdmin,
    hasPermission,
  };
}
