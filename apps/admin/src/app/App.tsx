import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAuth } from '../features/auth/RequireAuth';
import { RequirePermission } from '../features/auth/RequirePermission';
import { PERM } from '../features/auth/permissions';
import { AdminLayout } from '../layouts/AdminLayout';
import { DashboardPage } from '../pages/DashboardPage';
import { LoginPage } from '../pages/LoginPage';
import { OrdersPage } from '../pages/OrdersPage';
import { ProductsPage } from '../pages/ProductsPage';
import { SizePresetsPage } from '../pages/SizePresetsPage';
import { UsersPage } from '../pages/UsersPage';
import { RewardSettingsPage } from '../pages/RewardSettingsPage';
import { CoinGiftsPage } from '../pages/CoinGiftsPage';
import { FinancePage } from '../pages/FinancePage';
import { CampaignsPage } from '../pages/CampaignsPage';
import { ProductFeedbackPage } from '../pages/ProductFeedbackPage';
import { InsightsPage } from '../pages/InsightsPage';
import { CoinLedgerPage } from '../pages/CoinLedgerPage';
import { CategoriesPage } from '../pages/CategoriesPage';
import { BrandsPage } from '../pages/BrandsPage';
import { BannersPage } from '../pages/BannersPage';
import { PromotionsPage } from '../pages/PromotionsPage';
import { SegmentsPage } from '../pages/SegmentsPage';
import { BroadcastsPage } from '../pages/BroadcastsPage';
import { AutomationsPage } from '../pages/AutomationsPage';
import { InventoryPage } from '../pages/InventoryPage';
import { UserDetailPage } from '../pages/UserDetailPage';
import { ForbiddenPage } from '../pages/ForbiddenPage';
import { SettingsAdminUsersPage } from '../pages/settings/SettingsAdminUsersPage';
import { SettingsRolesPage } from '../pages/settings/SettingsRolesPage';
import { SettingsRoleDetailPage } from '../pages/settings/SettingsRoleDetailPage';
import { SettingsPermissionsPage } from '../pages/settings/SettingsPermissionsPage';
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
          <Route element={<RequirePermission perm={PERM.dashboard.view} />}>
            <Route path="dashboard" element={<DashboardPage />} />
          </Route>
          <Route element={<RequirePermission perm={PERM.insights.view} />}>
            <Route path="insights" element={<InsightsPage />} />
          </Route>
          <Route element={<RequirePermission perm={PERM.orders.view} />}>
            <Route path="orders" element={<OrdersPage />} />
          </Route>
          <Route element={<RequirePermission perm={PERM.products.view} />}>
            <Route path="products" element={<ProductsPage />} />
          </Route>
          <Route element={<RequirePermission perm={PERM.sizePresets.view} />}>
            <Route path="size-presets" element={<SizePresetsPage />} />
          </Route>
          <Route element={<RequirePermission perm={PERM.users.view} />}>
            <Route path="users" element={<UsersPage />} />
            <Route path="users/:userId" element={<UserDetailPage />} />
          </Route>
          <Route element={<RequirePermission perm={PERM.rewards.view} />}>
            <Route path="rewards" element={<RewardSettingsPage />} />
          </Route>
          <Route element={<RequirePermission perm={PERM.coinGifts.view} />}>
            <Route path="coin-gifts" element={<CoinGiftsPage />} />
          </Route>
          <Route element={<RequirePermission perm={PERM.coinLedger.view} />}>
            <Route path="coin-ledger" element={<CoinLedgerPage />} />
          </Route>
          <Route element={<RequirePermission perm={PERM.finance.view} />}>
            <Route path="finance" element={<FinancePage />} />
          </Route>
          <Route element={<RequirePermission perm={PERM.campaigns.view} />}>
            <Route path="campaigns" element={<CampaignsPage />} />
          </Route>
          <Route element={<RequirePermission perm={PERM.productFeedback.view} />}>
            <Route path="product-feedback" element={<ProductFeedbackPage />} />
          </Route>
          <Route element={<RequirePermission perm={PERM.categories.view} />}>
            <Route path="categories" element={<CategoriesPage />} />
          </Route>
          <Route element={<RequirePermission perm={PERM.brands.view} />}>
            <Route path="brands" element={<BrandsPage />} />
          </Route>
          <Route element={<RequirePermission perm={PERM.banners.view} />}>
            <Route path="banners" element={<BannersPage />} />
          </Route>
          <Route element={<RequirePermission perm={PERM.promotions.view} />}>
            <Route path="promotions" element={<PromotionsPage />} />
          </Route>
          <Route element={<RequirePermission perm={PERM.segments.view} />}>
            <Route path="segments" element={<SegmentsPage />} />
          </Route>
          <Route element={<RequirePermission perm={PERM.broadcasts.view} />}>
            <Route path="broadcasts" element={<BroadcastsPage />} />
          </Route>
          <Route element={<RequirePermission perm={PERM.automations.view} />}>
            <Route path="automations" element={<AutomationsPage />} />
          </Route>
          <Route element={<RequirePermission perm={PERM.inventory.view} />}>
            <Route path="inventory" element={<InventoryPage />} />
          </Route>
          <Route path="settings" element={<SettingsIndexRedirect />} />
          <Route element={<RequirePermission perm={PERM.settings.users.view} />}>
            <Route path="settings/admin-users" element={<SettingsAdminUsersPage />} />
          </Route>
          <Route element={<RequirePermission perm={PERM.settings.roles.view} />}>
            <Route path="settings/roles" element={<SettingsRolesPage />} />
            <Route path="settings/roles/:id" element={<SettingsRoleDetailPage />} />
          </Route>
          <Route element={<RequirePermission perm={PERM.settings.permissions.view} />}>
            <Route path="settings/permissions" element={<SettingsPermissionsPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/welcome" replace />} />
    </Routes>
  );
}
