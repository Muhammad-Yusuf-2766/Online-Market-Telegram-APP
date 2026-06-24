# Ansor Market Implementation Plan

Last updated: 2026-06-24

## Current Baseline

The repository is still the original Parfumbox codebase with useful production scaffolding already in place:

- `apps/api`: NestJS modules, Prisma, PostgreSQL, JWT auth, Telegram Mini App auth, Socket.IO gateways, MinIO/S3 presigned uploads, cart, wishlist, orders, product feedback, banners, notifications, finance, inventory, admin settings.
- `apps/web`: Telegram Mini App React app with RTK Query, Telegram SDK bootstrap, bottom navigation, catalog, product, cart, checkout, orders, wishlist, notifications, and profile screens.
- `apps/admin`: Mantine admin app with RTK Query, auth guard, sidebar layout, dashboard, products, orders, users, finance, inventory, broadcasts, product feedback, settings, and realtime admin order notifications.

The main refactor should preserve these patterns and remove only the perfume/reward/referral-specific behavior.

## Progress Checkpoints

- 2026-06-22: Phase 1 backend schema/API compile checkpoint completed.
- 2026-06-22: API seed and fresh baseline migration readiness completed.
- 2026-06-22: Phase 2 Telegram Mini App refactor completed and `pnpm --filter web build` passed.
- 2026-06-22: Phase 3 admin panel refactor completed and `pnpm --filter admin build` passed.
- 2026-06-23: Phase 4 backend/admin runtime verification checkpoint completed:
  - active `/admin/users` and `/admin/users/:userId/details` backend endpoints are now imported into the active API graph
  - stale admin customer endpoints were refactored away from RBAC, tiers, referrals, coins, promos, and UZS fields
  - admin dashboard stats alias `/admin/stats/dashboard` was added to match the refactored admin RTK Query contract
  - admin notification read now supports the frontend `POST /admin/notifications/:id/read` call while retaining the existing PATCH endpoint
  - API build output is now cleaned before build and non-incremental so `dist/main.js` contains all active runtime dependencies
  - route-level runtime smoke confirmed mappings for admin users, dashboard, notification read, order status, broadcast send, and inventory adjustment
  - full live CRUD/status/broadcast smoke testing was blocked by local DB availability: Docker Desktop engine was stopped and the local PostgreSQL process rejected the default `postgres:postgres` credentials
- 2026-06-24: Phase 4 live smoke remained blocked by local database availability, then Phase 5 cleanup completed:
  - `apps/api/.env` was still absent
  - Docker test Postgres could not start because Docker Desktop Linux engine was unavailable at `//./pipe/dockerDesktopLinuxEngine`
  - `pnpm --filter api db:migrate` and `pnpm --filter api db:seed` were not run because no reachable database existed
  - inactive legacy backend modules/files were removed from disk
  - stale visible/source Parfumbox, perfume, UZS, coin, referral, campaign, segment, automation, reward, brand, fragrance, size-preset, and RBAC cleanup was completed for active source/env examples/README
  - active-source grep now only finds removed terminology in historical Prisma migration files
  - `pnpm install`, `pnpm --filter api build`, `pnpm --filter web build`, and `pnpm --filter admin build` passed
- Next: restore a reachable Ansor database and run the full live Phase 4 smoke tests.

## Phase 1 - Backend Schema and APIs

### 1.1 Prisma schema refactor

Target file:

- `apps/api/prisma/schema.prisma`

Replace Parfumbox product/order/user structures with Ansor Market equivalents while keeping Prisma relation style and existing IDs/timestamps.

Required schema changes:

- Remove/deprecate reward/referral/campaign models and fields:
  - `RewardSettings`, `CoinLedgerEntry`, `ReferralReward`, `TrafficCampaign`, `AdminCoinGift`, `UserSegment`, `UserSegmentMembership`, `PromoCode`, `PromoRedemption`, `Bundle`, `BundleProduct`, `ProductCoPurchase` unless a future explicit promotion feature is approved.
  - `User.referralCode`, `User.referredByUserId`, `User.campaignId`, `User.coinBalance`, profile bonus fields, `coinInboxAckAt`, `tier`, `tierComputedAt`.
- Remove perfume-specific product fields:
  - `ProductSizePreset`, `Brand`, `FragranceFamily`, `ProductGender`, `Product.brandId`, `Product.familyId`, `Product.gender`, `Product.notesTop`, `Product.notesHeart`, `Product.notesBase`, `Product.releaseYear`, `stockGrams`, `lowStockGramsThreshold`.
- Add/adapt halal market product fields:
  - `MeasurementUnit` with `slug`, `name`, `symbol`, `sortOrder`, `allowDecimal`.
  - `Product.priceKrw`, `oldPriceKrw`, `isOnSale`, `isBestSeller`, `stockQuantity`, `lowStockThreshold`, `isActive`, `measurementUnitId`, max 2 `images`.
  - Keep `ratingAvg`, `ratingCount`, `categoryId`.
- Add saved addresses:
  - `UserAddress` with user relation, Kakao-normalized address fields, detail address, phone/name optional fields if useful, `isDefault`, timestamps.
  - Enforce max 3 addresses in service logic, not only UI.
- Adapt orders:
  - Add `PREPARING` to `OrderStatus`.
  - Rename UZS fields to KRW equivalents: `subtotalKrw`, `totalKrw`, `discountKrw` if retained.
  - Remove `coinsAppliedUzs`, `cashPaidUzs`, promo relation.
  - Add address snapshot fields from selected `UserAddress`/Kakao result.
  - `OrderItem.unitPriceKrw`, product title/image/unit snapshots.
- Rename inventory model:
  - `StockMovement` -> `InventoryMovement` or keep table with Ansor naming in code if migration risk is high.
  - Use `delta` against `Product.stockQuantity`, with `ORDER_CREATE`, `ORDER_CANCEL`, `ADMIN_ADJUSTMENT` reasons.
- Simplify admin users:
  - Remove RBAC relations from active flows or keep tables temporarily unused.
  - `AdminUser` should behave as Super Admin only; all active authenticated admins get full access.
- Simplify notifications:
  - `UserNotificationKind`: keep `BROADCAST`, `ORDER_STATUS`, `SYSTEM`; remove `COIN_GIFT`, `PROMO`.
  - `AdminNotificationKind`: keep order-related kinds.

Migration approach:

- Prefer a fresh migration from current Parfumbox schema to Ansor Market schema.
- Keep old columns only temporarily if needed to avoid a high-risk big-bang deletion.
- After Prisma changes, update `apps/api/prisma/seed.ts` and remove/replace `seed-rbac.ts` dependency if RBAC is fully deprecated.

### 1.2 Backend modules to remove or deprecate

Remove from `apps/api/src/app.module.ts` after dependent code is refactored:

- `AdminCampaignsModule`
- `AdminCoinsModule`
- `BrandsModule`
- `FragranceFamiliesModule`
- `RewardSettingsModule`
- `PromotionsModule`
- `RecommendationsModule` if it depends on perfume/co-purchase logic
- `SegmentsModule`
- RBAC module/guards only after admin auth is simplified

Keep and adapt:

- `AuthModule`
- `AdminAuthModule`
- `ProductsModule`
- `CategoriesModule`
- `BannersModule`
- `CartModule`
- `WishlistModule`
- `OrdersModule`
- `NotificationsModule`
- `RealtimeModule`
- `TelegramNotifyModule`
- `StorageModule`
- `UsersModule`
- `AdminStatsModule`
- `AdminFinanceModule`
- `InventoryModule`
- `BroadcastsModule`
- `AdminSettingsModule` for Super Admin user management only

### 1.3 Telegram auth

Target files:

- `apps/api/src/auth/auth.service.ts`
- `apps/web/src/features/session/UserSessionBootstrap.tsx`

Changes:

- Keep Telegram init data signature validation and JWT issuance.
- Remove `start_param` referral/campaign attribution from backend.
- Remove frontend `CAMPAIGN_LANDED` tracking for `ref_` and `c_`.
- Keep locale normalization.
- Ensure returned user payload has no coin/referral fields.

### 1.4 Products/categories/measurement units

Target modules:

- `apps/api/src/products/*`
- `apps/api/src/categories/*`
- new or adapted `apps/api/src/measurement-units/*`

Changes:

- Replace size preset and perfume size logic with measurement unit relation.
- Rename `priceUzs` APIs to `priceKrw`.
- Remove brand/family/gender/note filters from `ProductListQueryDto`.
- Add sale/bestseller section endpoints:
  - `GET /products/sections/sale?page=&pageSize=`
  - `GET /products/sections/bestseller?page=&pageSize=`
- Keep existing pagination helpers and DTO validation style.
- Enforce max 2 product images in DTO/service.
- Add active/inactive filtering for public catalog.

### 1.5 Address and Kakao backend

Create module:

- `apps/api/src/addresses/*`

Endpoints:

- `GET /addresses/search?q=...`
- `GET /users/me/addresses`
- `POST /users/me/addresses`
- `PATCH /users/me/addresses/:id`
- `DELETE /users/me/addresses/:id`

Changes:

- Add `KAKAO_REST_API_KEY` to `apps/api/.env.example`.
- Backend calls Kakao Local Address Search API.
- Normalize response to `addressName`, `roadAddressName`, `jibunAddressName`, `buildingName`, `zoneNo`, `latitude`, `longitude`, optional `raw`.
- Validate query length.
- Return empty array on no results.
- Return controlled error on Kakao failure.
- Enforce max 3 saved addresses per user in service.

### 1.6 Cart/wishlist/orders

Target modules:

- `apps/api/src/cart/*`
- `apps/api/src/wishlist/*`
- `apps/api/src/orders/*`

Changes:

- Keep server-side cart and wishlist API shape where possible.
- Remove `sizeSlug`/size-specific logic from cart unless needed for unit variants.
- Order creation should use cart items, selected address, and product snapshots.
- Decrement `stockQuantity` transactionally.
- Clear cart after successful order creation.
- Create admin notification on order creation.
- Order cancellation allowed only from `PENDING`; restore inventory transactionally.
- Status update creates user notification and Telegram bot message.
- Remove coins, promo, referral payout, UZS fields from `OrdersService`.

### 1.7 Admin APIs

Target modules:

- `apps/api/src/admin-stats/*`
- `apps/api/src/admin-finance/*`
- `apps/api/src/inventory/*`
- `apps/api/src/broadcasts/*`
- `apps/api/src/admin-settings/*`
- `apps/api/src/admin-users/*`

Changes:

- Dashboard stats should use KRW revenue/order/inventory/user KPIs.
- Finance report should remove coin/referral/campaign/promo cost sections.
- Inventory endpoints should manage `stockQuantity`.
- Broadcast should send to all users; no segment required.
- Admin users: one type only, Super Admin.
- Remove roles/permissions endpoints from active admin app when auth simplification is complete.

## Phase 2 - Telegram Mini App Changes

Target app:

- `apps/web`

### 2.1 RTK Query contract

Target file:

- `apps/web/src/app/parfumApi.ts`

Changes:

- Rename API slice eventually to `ansorApi` only after the backend contracts are stable. If this creates too much churn, keep `parfumApi` internally for one phase and remove visible branding first.
- Replace `priceUzs`, `oldPriceUzs`, `unitPriceUzs`, `subtotalUzs`, `totalUzs` with KRW names.
- Remove reward/referral/coin endpoints and types.
- Remove brands/fragrance families/gender filters.
- Add measurement units, addresses, Kakao search endpoints.
- Add sale/bestseller section queries.
- Keep tag invalidation patterns for `Product`, `Order`, `Wishlist`, `Cart`, `Notification`, `Banner`, `UserProfile`.

### 2.2 Branding and layout

Target files:

- `apps/web/src/widgets/app-top-bar/ui/AppTopBar.tsx`
- `apps/web/src/widgets/app-bottom-nav/ui/AppBottomNav.tsx`
- `apps/web/src/i18n/locales/uz.json`
- `apps/web/src/i18n/locales/ru.json`
- `apps/web/public/favicon.svg`
- `apps/web/public/icons.svg`

Changes:

- Header should show logo, `Ansor Market`, `Koreadagi halal mahsulotlar`, notification bell with unread badge.
- Remove coin balance/header link.
- Bottom nav should be Home, Search, Cart, Wishlist or Orders, Profile.
- Remove `/coins` and `/coin-inbox` routes/features.
- Replace visible Parfumbox/Aromus/perfume copy.
- Currency formatting should use KRW/Korean won.

### 2.3 Home/catalog

Target files:

- `apps/web/src/pages/catalog-page/ui/CatalogPage.tsx`
- `apps/web/src/widgets/banner-carousel/*`
- product card components in `apps/web/src/shared/ui`

Changes:

- Keep Parfumbox visual card style.
- Show active banner after header; if no active banner, show category filtering.
- Add sale products section with 2 independent horizontal rows:
  - page 1, pageSize 10
  - page 2, pageSize 10
- Add bestselling products section with same two-row behavior.
- All products should be vertical grid/list with server-side pagination.
- Search/category/sort should work without perfume filters.

### 2.4 Product/cart/wishlist/order pages

Target files:

- `apps/web/src/pages/product-page/*`
- `apps/web/src/pages/cart-page/*`
- `apps/web/src/pages/wishlist-page/*`
- `apps/web/src/pages/orders-page/*`
- `apps/web/src/pages/order-detail-page/*`

Changes:

- Remove size/grams perfume logic.
- Use measurement unit, stock quantity, sale/bestseller flags.
- Keep wishlist heart button and server-side wishlist.
- Cart quantity should respect available stock.
- Product feedback remains tied to delivered orders.

### 2.5 Checkout and addresses

Target files:

- `apps/web/src/pages/checkout-page/*`
- `apps/web/src/pages/address-picker-page/*`

Changes:

- Replace direct Nominatim frontend calls with backend `GET /addresses/search?q=...`.
- Add saved address list and max 3 handling.
- User selects a normalized Kakao result, then enters detail address.
- Disable order button until a valid selected address exists.
- Save address snapshot into order.
- Remove coins and promo UI from checkout unless a future promotion requirement is added.

## Phase 3 - Admin Panel Changes

Target app:

- `apps/admin`

### 3.1 Admin RTK Query

Target file:

- `apps/admin/src/app/parfumApi.ts`

Changes:

- Remove coin/referral/campaign/segment/automation/brand/fragrance/RBAC endpoint types after backend contracts are removed.
- Add measurement unit endpoints.
- Rename KRW money fields.
- Keep RTK Query invalidation style and pagination normalization.

### 3.2 Navigation/routes

Target files:

- `apps/admin/src/app/App.tsx`
- `apps/admin/src/features/navigation/adminNavSections.ts`
- `apps/admin/src/features/auth/permissions.ts`
- `apps/admin/src/features/auth/RequirePermission.tsx`

Changes:

- Remove routes/pages for rewards, coin gifts, coin ledger, campaigns, promotions if not required, segments, automations, brands, roles, permissions.
- Product settings should contain Products, Measurement Units, Categories, Banners.
- Broadcast remains, but no segmentation.
- Admin users remains, but Super Admin only.
- Simplify permissions guard to active-authenticated admin access once backend auth is simplified.

### 3.3 Product settings

Target files:

- `apps/admin/src/pages/ProductsPage.tsx`
- `apps/admin/src/pages/SizePresetsPage.tsx`
- `apps/admin/src/pages/CategoriesPage.tsx`
- `apps/admin/src/pages/BannersPage.tsx`

Changes:

- Replace Size Presets page with Measurement Units page.
- Product form/table should use category, unit, KRW price, stock quantity, low stock threshold, sale/bestseller, active status, max 2 images.
- Remove brand/family/gender/notes/release year/grams fields.

### 3.4 Dashboard/orders/users/finance/inventory

Target files:

- `apps/admin/src/pages/DashboardPage.tsx`
- `apps/admin/src/pages/OrdersPage.tsx`
- `apps/admin/src/pages/UsersPage.tsx`
- `apps/admin/src/pages/UserDetailPage.tsx`
- `apps/admin/src/pages/FinancePage.tsx`
- `apps/admin/src/pages/InventoryPage.tsx`

Changes:

- Dashboard: total products, total orders, pending orders, today orders, revenue KRW, low stock, new users, delivered/cancelled orders.
- Orders: add `PREPARING`, show address snapshot and KRW totals.
- Users: remove coin/referral/campaign/tier columns and details; show order stats, total spent, saved addresses, wishlist/reviews.
- Finance: remove coin/referral/campaign/promo economics; show revenue by day, order status, top products/categories.
- Inventory: use `stockQuantity` and `InventoryMovement`.

### 3.5 Broadcast/admin users

Target files:

- `apps/admin/src/pages/BroadcastsPage.tsx`
- `apps/admin/src/pages/settings/SettingsAdminUsersPage.tsx`

Changes:

- Broadcast form: title, body, image optional, targetUrl optional, send now; no segment selector.
- Admin users: email, password, fullName, isActive; no role/permission assignment.

## Phase 4 - Realtime Notifications

Target files:

- `apps/api/src/realtime/*`
- `apps/api/src/notifications/*`
- `apps/admin/src/features/orders/useAdminOrdersRealtime.ts`
- `apps/admin/src/features/notifications/*`
- user-side socket bridge if added in `apps/web/src/features/*`

Changes:

- Keep namespaces `/admin` and `/user`.
- On order creation:
  - create `AdminNotification`
  - emit `orders:changed`
  - emit `notifications:new`
  - invalidate admin orders/stats/notification tags.
- On admin status change:
  - create `UserNotification`
  - emit `order:update` to `user:{userId}`
  - update mini app notification badge/list via invalidation or polling.
- On broadcast:
  - create `UserNotification` rows for all users
  - optionally send Telegram bot message if existing bot integration supports it.
- Remove coin gift notification branches from Telegram notify service.

2026-06-23 verification notes:

- `/admin` and `/user` gateway code still follows the existing Socket.IO pattern.
- `OrderEventsService` still emits admin `orders:changed`, admin `notifications:new`, user `order:update`, and user `product:stock`.
- Refactored admin `useAdminOrdersRealtime` still invalidates `Order`, `Stats`, and `Notification` tags from socket events.
- `OrdersService.updateStatus` supports `PREPARING`, creates `ORDER_STATUS` user notifications, sends Telegram status messages, emits user order events, and invalidates admin realtime consumers through the existing order event service.
- `BroadcastsService.sendNow` creates `BROADCAST` user notifications for active users and keeps the existing Telegram send attempt path.
- Full live socket/event verification still requires a reachable database with migrated Ansor schema and seeded users/orders/admin.

## Phase 5 - Cleanup

Cleanup should happen after functional replacements compile.

Remove:

- API modules and tests for coins, referrals, rewards, campaigns, segments, automations, brands, fragrance families, perfume recommendations, size presets if replaced. Completed for inactive backend source on 2026-06-24.
- Web routes/components/styles for coins and coin inbox. Completed in Phase 2; remaining stale locale/cart fallback cleanup completed on 2026-06-24.
- Admin pages/routes/nav/i18n for removed modules. Routed pages were removed in Phase 3; stale admin locale keys were trimmed on 2026-06-24.
- `parfumbox`, `parfum`, `Aromus`, `UZS`, `priceUzs`, `stockGrams`, perfume copy from visible UI and API contracts. Active source/env examples/README were cleaned on 2026-06-24; historical Prisma migrations intentionally retain old terms.

Rename carefully:

- Internal `parfumApi` remains as a compatibility implementation name to reduce churn; it is not visible UI copy.
- The Mantine `parfum` color token remains as an internal theme token unless a low-risk rename is explicitly scheduled.
- Money helpers format KRW.
- Env examples and README use Ansor Market naming.

## Phase 6 - Build and Typecheck Verification

Run after each major phase:

```bash
pnpm install
pnpm --filter api build
pnpm --filter web build
pnpm --filter admin build
```

Recommended extra checks after backend schema work:

```bash
pnpm --filter api test
pnpm --filter api test:e2e
```

Fix before moving on:

- Prisma schema/generate errors
- Nest module import errors
- TypeScript errors from renamed DTO fields
- RTK Query type errors
- dead routes and navigation links
- broken Socket.IO invalidations

## Suggested Phase Order

1. Backend schema and API contracts first.
2. Backend services/controllers/tests for products, units, addresses, cart, orders, notifications.
3. Web RTK Query and Mini App flow.
4. Admin RTK Query and pages.
5. Realtime verification.
6. Branding/cleanup sweep.
7. Full build/test verification.
