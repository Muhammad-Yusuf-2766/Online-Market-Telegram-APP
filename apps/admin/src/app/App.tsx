import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAuth } from '../features/auth/RequireAuth';
import { AdminLayout } from '../layouts/AdminLayout';
import { DashboardPage } from '../pages/DashboardPage';
import { LoginPage } from '../pages/LoginPage';
import { OrdersPage } from '../pages/OrdersPage';
import { ProductsPage } from '../pages/ProductsPage';
import { MeasurementUnitsPage } from '../pages/MeasurementUnitsPage';
import { UsersPage } from '../pages/UsersPage';
import { FinancePage } from '../pages/FinancePage';
import { ProductFeedbackPage } from '../pages/ProductFeedbackPage';
import { CategoriesPage } from '../pages/CategoriesPage';
import { BannersPage } from '../pages/BannersPage';
import { BroadcastsPage } from '../pages/BroadcastsPage';
import { InventoryPage } from '../pages/InventoryPage';
import { UserDetailPage } from '../pages/UserDetailPage';
import { ForbiddenPage } from '../pages/ForbiddenPage';
import { SettingsAdminUsersPage } from '../pages/settings/SettingsAdminUsersPage';
import { SettingsIndexRedirect } from '../pages/settings/SettingsIndexRedirect';
import { WelcomePage } from '../pages/WelcomePage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forbidden" element={<ForbiddenPage />} />
      <Route element={<RequireAuth />}>
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<Navigate to="/welcome" replace />} />
          <Route path="welcome" element={<WelcomePage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="measurement-units" element={<MeasurementUnitsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="users/:userId" element={<UserDetailPage />} />
          <Route path="finance" element={<FinancePage />} />
          <Route path="product-feedback" element={<ProductFeedbackPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="banners" element={<BannersPage />} />
          <Route path="broadcasts" element={<BroadcastsPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="settings" element={<SettingsIndexRedirect />} />
          <Route path="settings/admin-users" element={<SettingsAdminUsersPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/welcome" replace />} />
    </Routes>
  );
}
