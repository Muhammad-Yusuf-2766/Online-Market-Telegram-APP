import { Navigate } from 'react-router-dom';

export function SettingsIndexRedirect() {
  return <Navigate to="/settings/admin-users" replace />;
}
