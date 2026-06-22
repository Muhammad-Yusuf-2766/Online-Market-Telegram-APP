import { Center, Loader } from '@mantine/core';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { useGetMeQuery } from '../../app/parfumApi';
import { performLogout } from './logout';

export function RequireAuth() {
  const token = useAppSelector((s) => s.auth.accessToken);
  const profile = useAppSelector((s) => s.auth.profile);
  const location = useLocation();
  const dispatch = useAppDispatch();

  const { isError } = useGetMeQuery(undefined, {
    skip: !token,
    refetchOnMountOrArgChange: true,
  });

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!profile) {
    if (isError) {
      performLogout(dispatch);
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    return (
      <Center mih="100vh">
        <Loader color="parfum" />
      </Center>
    );
  }

  return <Outlet />;
}
