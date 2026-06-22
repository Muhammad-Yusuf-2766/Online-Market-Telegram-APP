import { Center, Loader } from '@mantine/core';
import type { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useCurrentAdmin } from './useCurrentAdmin';

type RequirePermissionProps = {
  perm: string;
};

export function RequirePermission({ perm }: RequirePermissionProps) {
  const { hasPermission, isLoading, profile } = useCurrentAdmin();

  if (isLoading || !profile) {
    return (
      <Center mih={200}>
        <Loader color="parfum" />
      </Center>
    );
  }

  if (!hasPermission(perm)) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
}

type CanProps = {
  perm: string;
  children: ReactNode;
  fallback?: ReactNode;
};

export function Can({ perm, children, fallback = null }: CanProps) {
  const { hasPermission, profile } = useCurrentAdmin();
  if (!profile || !hasPermission(perm)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}
