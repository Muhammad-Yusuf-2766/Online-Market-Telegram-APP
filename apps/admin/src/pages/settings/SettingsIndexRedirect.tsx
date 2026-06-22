import { Navigate } from 'react-router-dom';
import { useCurrentAdmin } from '../../features/auth/useCurrentAdmin';
import { PERM } from '../../features/auth/permissions';

export function SettingsIndexRedirect() {
  const { hasPermission } = useCurrentAdmin();

  if (hasPermission(PERM.settings.users.view)) {
    return <Navigate to="/settings/admin-users" replace />;
  }
  if (hasPermission(PERM.settings.roles.view)) {
    return <Navigate to="/settings/roles" replace />;
  }
  if (hasPermission(PERM.settings.permissions.view)) {
    return <Navigate to="/settings/permissions" replace />;
  }
  return <Navigate to="/forbidden" replace />;
}
