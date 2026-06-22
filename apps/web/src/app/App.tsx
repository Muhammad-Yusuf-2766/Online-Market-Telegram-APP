import { Navigate, Route, Routes } from 'react-router-dom';
import { TelegramBackButtonBridge } from '../features/navigation/TelegramBackButtonBridge';
import { AppBottomNav } from '../widgets/app-bottom-nav/ui/AppBottomNav';
import { AppTopBar } from '../widgets/app-top-bar/ui/AppTopBar';
import { CartPage } from '../pages/cart-page/ui/CartPage';
import { CatalogPage } from '../pages/catalog-page/ui/CatalogPage';
import { CheckoutPage } from '../pages/checkout-page/ui/CheckoutPage';
import { AddressPickerPage } from '../pages/address-picker-page/ui/AddressPickerPage';
import { OrderDetailPage } from '../pages/order-detail-page/ui/OrderDetailPage';
import { OrdersPage } from '../pages/orders-page/ui/OrdersPage';
import { ProductPage } from '../pages/product-page/ui/ProductPage';
import { ProfilePage } from '../pages/profile-page/ui/ProfilePage';
import { SearchPage } from '../pages/search-page/ui/SearchPage';
import { CartSyncBridge } from '../features/cart/CartSyncBridge';
import { WishlistPage } from '../pages/wishlist-page/ui/WishlistPage';
import { NotificationsPage } from '../pages/notifications-page/ui/NotificationsPage';

export default function App() {
  return (
      <div className="tma-shell">
      <TelegramBackButtonBridge />
      <CartSyncBridge />
      <AppTopBar />
      <main className="tma-main">
        <Routes>
          <Route path="/" element={<CatalogPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/checkout/address" element={<AddressPickerPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <AppBottomNav />
    </div>
  );
}
