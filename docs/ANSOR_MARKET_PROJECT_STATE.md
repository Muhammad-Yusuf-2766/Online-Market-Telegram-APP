# Ansor Market Project State

Last updated: 2026-06-22

## 2026-06-22 Phase 2 Telegram Mini App Checkpoint

### Completed

- Continued from the Phase 1 backend checkpoint.
- Updated API seed readiness for the new Ansor Market Prisma schema:
  - removed old RBAC seeder call from active seed
  - seeds one active Super Admin
  - seeds starter measurement units, categories, and sample Ansor Market products
- Added an Ansor Market baseline migration artifact:
  - `apps/api/prisma/migrations/20260622193000_ansor_market_baseline/migration.sql`
  - generated from the current Prisma schema for fresh Ansor Market environments
- Ran `pnpm --filter api build` again successfully.
- Refactored Telegram Mini App API contract in `apps/web/src/app/parfumApi.ts`:
  - KRW fields: `priceKrw`, `oldPriceKrw`, `unitPriceKrw`, `subtotalKrw`, `totalKrw`
  - `MeasurementUnit`
  - `UserAddress`
  - backend Kakao address search
  - sale and bestseller product sections
  - removed active coin/reward/referral/brand/fragrance/promo API endpoints
- Refactored Telegram Mini App route surface:
  - removed coin inbox bridge and `/coins` route
  - added `/notifications` route
  - removed inactive coin feature/page files from web source
- Updated Mini App header to show:
  - Ansor Market
  - `Koreadagi halal mahsulotlar`
  - wishlist and notification actions with unread badge
  - no coin balance
- Updated catalog/home:
  - banner first when active banners exist
  - category filter remains available
  - two independent sale product rows from `/products/sections/sale`
  - two independent bestseller rows from `/products/sections/bestseller`
  - all products vertical paginated grid
  - no brand/fragrance/gender filters
- Updated product card/search/product detail:
  - KRW price display
  - measurement unit labels
  - stock quantity instead of perfume grams/sizes
  - no size presets
- Updated cart:
  - product/quantity lines only
  - KRW totals
  - server sync sends `{ productId, qty }`
  - no promo UI
- Updated checkout/address flow:
  - removed direct frontend Nominatim calls
  - address picker uses backend `GET /addresses/search?q=...`
  - saved address list uses `GET /users/me/addresses`
  - new addresses can be saved through `POST /users/me/addresses`
  - order button is disabled until a valid saved or backend-normalized address is selected
  - order creation posts `addressId` or address snapshot fields expected by backend
  - no coin/promo checkout UI
- Updated order list/detail:
  - KRW totals
  - `PREPARING` status text
  - address snapshots
  - `unitPriceKrw`
  - order-again flow without size fields
- Updated profile to remove reward settings dependency.
- Updated Telegram session bootstrap to stop referral/campaign start-param tracking.
- Updated Mini App locale strings used by the new flow.
- Ran `pnpm --filter web build` successfully.

### Files Changed This Session

Backend:

- `apps/api/prisma/seed.ts`
- `apps/api/prisma/migrations/20260622193000_ansor_market_baseline/migration.sql`

Telegram Mini App:

- `apps/web/src/app/App.tsx`
- `apps/web/src/app/parfumApi.ts`
- `apps/web/src/features/cart/CartSyncBridge.tsx`
- `apps/web/src/features/cart/cartSlice.ts`
- `apps/web/src/features/session/UserSessionBootstrap.tsx`
- `apps/web/src/i18n/locales/ru.json`
- `apps/web/src/i18n/locales/uz.json`
- `apps/web/src/pages/address-picker-page/ui/AddressPickerPage.tsx`
- `apps/web/src/pages/cart-page/ui/CartPage.tsx`
- `apps/web/src/pages/catalog-page/ui/CatalogPage.tsx`
- `apps/web/src/pages/checkout-page/checkoutFlow.types.ts`
- `apps/web/src/pages/checkout-page/ui/CheckoutPage.tsx`
- `apps/web/src/pages/order-detail-page/ui/OrderDetailPage.tsx`
- `apps/web/src/pages/orders-page/ui/OrdersPage.tsx`
- `apps/web/src/pages/product-page/ui/ProductPage.tsx`
- `apps/web/src/pages/profile-page/ui/ProfilePage.tsx`
- `apps/web/src/pages/search-page/ui/SearchPage.tsx`
- `apps/web/src/pages/wishlist-page/ui/WishlistPage.tsx`
- `apps/web/src/shared/lib/money.ts`
- `apps/web/src/shared/lib/productDiscount.ts`
- `apps/web/src/shared/lib/tmaBackNavigation.ts`
- `apps/web/src/shared/ui/ProductGridTile.tsx`
- `apps/web/src/widgets/app-top-bar/ui/AppTopBar.tsx`
- `apps/web/src/widgets/app-top-bar/ui/app-top-bar.css`

Deleted Telegram Mini App legacy files:

- `apps/web/src/features/coins/CoinInboxBridge.tsx`
- `apps/web/src/features/coins/coin-inbox.css`
- `apps/web/src/pages/coin-inbox-page/ui/CoinInboxPage.tsx`
- `apps/web/src/pages/coins-page/ui/CoinsPage.tsx`
- `apps/web/src/pages/coins-page/ui/ReferralTree.tsx`
- `apps/web/src/pages/coins-page/ui/coins-page.css`
- `apps/web/src/shared/lib/productSizes.ts`

Docs:

- `docs/ANSOR_MARKET_PROJECT_STATE.md`
- `docs/ANSOR_MARKET_TODO.md`

### Build/Test Status

Run:

```bash
pnpm --filter api build
pnpm --filter web build
```

Result:

- API build passed.
- Web build passed.

Warnings:

- API build still shows Prisma `package.json#prisma` config deprecation warning for Prisma 7.
- Web Vite build shows plugin timing warning only.

Not run:

```bash
pnpm --filter api test
pnpm --filter api test:e2e
pnpm --filter admin build
```

### Known Issues

- The new baseline migration is suitable for fresh Ansor Market databases, but existing Parfumbox production data still needs a deliberate destructive/transform data migration plan.
- Admin app is not yet refactored and is expected to still reference old Parfumbox contracts.
- API tests/e2e tests still need updates for the Ansor schema and contracts.
- Some old translation keys for inactive coin/perfume concepts remain in locale JSON and can be removed in cleanup.
- Internal names such as `parfumApi`, `pb_cart`, and `/_parfumbox-api` remain for compatibility and should be renamed during final cleanup.
- Address search requires `KAKAO_REST_API_KEY`; build passes, but live Kakao integration was not tested with a real key.

### Next Exact Steps

1. Start Phase 3 admin refactor.
2. Update `apps/admin/src/app/parfumApi.ts` to the Ansor backend contract.
3. Remove admin routes/nav/pages for coins, rewards, campaigns, segments, automations, brands, fragrance families, roles, and permissions.
4. Adapt admin dashboard, orders, product settings, users, finance, broadcast, inventory, and admin users.
5. Run `pnpm --filter admin build`.
6. Update docs again with admin files changed, build status, known issues, and next prompt.

### Next Exact Prompt

Read `AGENTS.md`, `docs/ANSOR_MARKET_REQUIREMENTS.md`, `docs/ANSOR_MARKET_IMPLEMENTATION_PLAN.md`, `docs/ANSOR_MARKET_PROJECT_STATE.md`, and `docs/ANSOR_MARKET_TODO.md`. Continue from the 2026-06-22 Phase 2 Telegram Mini App checkpoint. Start Phase 3 admin refactor only: update `apps/admin/src/app/parfumApi.ts`, admin navigation/routes, dashboard, orders, product settings, users, finance, broadcast, inventory, and admin users to match the Ansor Market backend contracts (`priceKrw`, `MeasurementUnit`, `stockQuantity`, `UserAddress`, Super Admin only, no coins/referrals/rewards/campaigns/segments/brands/fragrance/size presets/RBAC pages). Preserve the existing Mantine admin style. After changes, run `pnpm --filter admin build`, update the Ansor docs with files changed, build/test status, known issues, and the next exact prompt.

## 2026-06-22 Phase 1 Backend Checkpoint

### Completed

- Started Phase 1 backend refactor.
- Replaced active Prisma schema with Ansor Market core models:
  - `User`
  - `UserAddress`
  - `AdminUser`
  - `Product`
  - `Category`
  - `MeasurementUnit`
  - `Cart`
  - `CartItem`
  - `Wishlist`
  - `Order`
  - `OrderItem`
  - `ProductFeedback`
  - `Banner`
  - `UserNotification`
  - `AdminNotification`
  - `Broadcast`
  - `InventoryMovement`
- Removed active schema dependency on coins, referrals, rewards, campaigns, segments, brands, fragrance families, perfume notes, perfume gender, UZS fields, and gram-based perfume inventory.
- Added `PREPARING` order status.
- Added saved address model and backend address module:
  - `GET /addresses/search?q=...`
  - `GET /users/me/addresses`
  - `POST /users/me/addresses`
  - `PATCH /users/me/addresses/:id`
  - `DELETE /users/me/addresses/:id`
- Added backend Kakao Local address search proxy and `KAKAO_REST_API_KEY` env example.
- Added measurement units module:
  - public list endpoint
  - admin CRUD endpoints under `/admin/measurement-units`
- Simplified Telegram auth by removing referral/campaign start parameter attribution.
- Simplified admin auth to active Super Admin users only.
- Updated active product API to KRW fields, categories, measurement units, max 2 images, stock quantity, sale and bestseller flags.
- Added product section endpoints:
  - `GET /products/sections/sale`
  - `GET /products/sections/bestseller`
- Updated cart API to stock quantity and KRW product snapshots.
- Updated order API/service for:
  - cart-first checkout
  - optional fallback item payload
  - address snapshots
  - KRW totals
  - transactional stock decrement
  - inventory movement creation
  - cart clearing
  - pending-only cancellation
  - stock restore on cancellation
  - user notifications on status update
  - admin realtime notifications through existing pattern
- Updated realtime product stock payload to `stockQuantity`.
- Updated Telegram order status text to include `PREPARING`.
- Simplified admin dashboard stats, finance, inventory, broadcast, category, banner, storage, notification, and admin-user active controllers away from RBAC permissions.
- Kept old inactive Parfumbox modules on disk but removed them from active `AppModule` import graph.
- Changed API build config to compile from `src/main.ts` import graph so inactive legacy modules do not block the active backend build.

### Files Changed

Backend config/schema:

- `apps/api/.env.example`
- `apps/api/prisma/schema.prisma`
- `apps/api/tsconfig.build.json`
- `apps/api/tsconfig.build.tsbuildinfo` (generated/updated by build)

Backend modules/controllers/services:

- `apps/api/src/app.module.ts`
- `apps/api/src/auth/auth.service.ts`
- `apps/api/src/admin-auth/admin-auth.controller.ts`
- `apps/api/src/admin-auth/admin-auth.service.ts`
- `apps/api/src/admin-auth/strategies/jwt-admin.strategy.ts`
- `apps/api/src/admin-finance/admin-finance.controller.ts`
- `apps/api/src/admin-finance/admin-finance.service.ts`
- `apps/api/src/admin-settings/admin-settings.module.ts`
- `apps/api/src/admin-settings/admin-users-mgmt.controller.ts`
- `apps/api/src/admin-settings/admin-users-mgmt.service.ts`
- `apps/api/src/admin-settings/dto/create-admin-user.dto.ts`
- `apps/api/src/admin-settings/dto/update-admin-user.dto.ts`
- `apps/api/src/admin-stats/admin-stats.controller.ts`
- `apps/api/src/admin-stats/admin-stats.service.ts`
- `apps/api/src/banners/admin-banners.controller.ts`
- `apps/api/src/broadcasts/broadcasts.controller.ts`
- `apps/api/src/broadcasts/broadcasts.module.ts`
- `apps/api/src/broadcasts/broadcasts.service.ts`
- `apps/api/src/cart/cart.service.ts`
- `apps/api/src/cart/dto/upsert-cart-item.dto.ts`
- `apps/api/src/categories/categories.controller.ts`
- `apps/api/src/categories/categories.service.ts`
- `apps/api/src/common/decorators/current-admin.decorator.ts`
- `apps/api/src/inventory/inventory.controller.ts`
- `apps/api/src/inventory/inventory.service.ts`
- `apps/api/src/notifications/admin-notifications.controller.ts`
- `apps/api/src/orders/admin-orders.controller.ts`
- `apps/api/src/orders/dto/create-order.dto.ts`
- `apps/api/src/orders/dto/order-line.dto.ts`
- `apps/api/src/orders/orders.module.ts`
- `apps/api/src/orders/orders.service.ts`
- `apps/api/src/products/admin-product-feedback.controller.ts`
- `apps/api/src/products/admin-products.controller.ts`
- `apps/api/src/products/dto/create-product.dto.ts`
- `apps/api/src/products/dto/product-list-query.dto.ts`
- `apps/api/src/products/dto/update-product.dto.ts`
- `apps/api/src/products/products.controller.ts`
- `apps/api/src/products/products.module.ts`
- `apps/api/src/products/products.service.ts`
- `apps/api/src/realtime/order-events.service.ts`
- `apps/api/src/realtime/user-orders.gateway.ts`
- `apps/api/src/storage/storage.controller.ts`
- `apps/api/src/telegram/order-status-messages.ts`
- `apps/api/src/users/users.controller.ts`
- `apps/api/src/users/users.module.ts`
- `apps/api/src/users/users.service.ts`

New backend modules:

- `apps/api/src/addresses/addresses.controller.ts`
- `apps/api/src/addresses/addresses.module.ts`
- `apps/api/src/addresses/addresses.service.ts`
- `apps/api/src/addresses/dto/create-user-address.dto.ts`
- `apps/api/src/addresses/dto/update-user-address.dto.ts`
- `apps/api/src/measurement-units/measurement-units.controller.ts`
- `apps/api/src/measurement-units/measurement-units.module.ts`
- `apps/api/src/measurement-units/measurement-units.service.ts`
- `apps/api/src/measurement-units/dto/create-measurement-unit.dto.ts`
- `apps/api/src/measurement-units/dto/update-measurement-unit.dto.ts`

Docs:

- `docs/ANSOR_MARKET_PROJECT_STATE.md`
- `docs/ANSOR_MARKET_TODO.md`

### Build/Test Status

Run:

```bash
pnpm --filter api build
```

Result:

- Passed.
- Prisma Client generation succeeded.
- Nest build succeeded.
- Warning remains: `package.json#prisma` configuration is deprecated and should move to Prisma config before Prisma 7.

Not run:

```bash
pnpm --filter api test
pnpm --filter api test:e2e
pnpm --filter web build
pnpm --filter admin build
```

Reason:

- This checkpoint focused on active backend compile after Phase 1 schema/API refactor.
- Frontend/admin are not yet adapted to the new backend contracts, so their builds are expected to fail until Phase 2/3.

### Known Issues

- No Prisma migration file was created yet for the new Ansor schema. The schema compiles and Prisma Client generates, but database migration planning remains.
- Old Parfumbox modules still exist on disk but are inactive in the active backend build graph.
- `tsconfig.build.json` now includes `src/main.ts` instead of all `src/**/*`; this keeps inactive legacy modules from blocking build, but old modules still need real cleanup later.
- Existing API tests/e2e tests still target old Parfumbox fields and were not updated.
- Frontend and admin RTK Query contracts still use old Parfumbox names such as `priceUzs`, coins, brands, fragrance families, size presets, etc.
- Seed files still need updating for Ansor Market schema and Super Admin-only admin users.
- Kakao search depends on `KAKAO_REST_API_KEY`; behavior was not integration-tested with a real key.
- Product/order/admin API response contracts changed; admin and web UI must be updated next.

### Next Exact Steps

1. Update seed files for the new Prisma schema.
2. Add/create a Prisma migration strategy for the Ansor schema.
3. Update API tests/e2e tests for new backend contracts.
4. Start Phase 2 web RTK Query and Telegram Mini App changes.
5. Then start Phase 3 admin RTK Query and admin page changes.

### Next Exact Prompt

Read `AGENTS.md`, `docs/ANSOR_MARKET_REQUIREMENTS.md`, `docs/ANSOR_MARKET_IMPLEMENTATION_PLAN.md`, `docs/ANSOR_MARKET_PROJECT_STATE.md`, and `docs/ANSOR_MARKET_TODO.md`. Continue from the 2026-06-22 Phase 1 backend checkpoint. First update API seed/migration readiness for the new Ansor Market Prisma schema and run `pnpm --filter api build` again. Then start Phase 2 web refactor only: update `apps/web/src/app/parfumApi.ts` and the Telegram Mini App routes/components to match the new backend contracts (`priceKrw`, `MeasurementUnit`, `UserAddress`, Kakao backend search, stockQuantity, sale/bestseller sections, no coins/referrals/brands/fragrance/size presets). Preserve the existing UI style. After changes, run `pnpm --filter web build`, update `docs/ANSOR_MARKET_PROJECT_STATE.md` and `docs/ANSOR_MARKET_TODO.md`, list changed files, build/test status, known issues, and write the next exact prompt.

## Session Summary

This session was inspection and planning only. No application code was changed.

User request:

- Read `AGENTS.md` and `docs/ANSOR_MARKET_REQUIREMENTS.md`.
- Inspect `apps/api`, `apps/web`, `apps/admin`, Prisma schema, RTK Query setup, Telegram auth, Socket.IO notifications, admin layout, and product/order/user/finance/inventory areas.
- Do not implement code yet.
- Create/update:
  - `docs/ANSOR_MARKET_IMPLEMENTATION_PLAN.md`
  - `docs/ANSOR_MARKET_PROJECT_STATE.md`
  - `docs/ANSOR_MARKET_TODO.md`

## Completed

- Read `AGENTS.md`.
- Read `docs/ANSOR_MARKET_REQUIREMENTS.md`.
- Confirmed `docs/ANSOR_MARKET_IMPLEMENTATION_PLAN.md`, `docs/ANSOR_MARKET_PROJECT_STATE.md`, and `docs/ANSOR_MARKET_TODO.md` existed but were empty.
- Inspected repository structure and key files in all three apps.
- Created a phased practical refactor plan in `docs/ANSOR_MARKET_IMPLEMENTATION_PLAN.md`.
- Recorded this checkpoint in `docs/ANSOR_MARKET_PROJECT_STATE.md`.
- Created actionable task list in `docs/ANSOR_MARKET_TODO.md`.

## Files Inspected

Repository/docs:

- `AGENTS.md`
- `docs/ANSOR_MARKET_REQUIREMENTS.md`
- `package.json`
- `apps/api/package.json`
- `apps/web/package.json`
- `apps/admin/package.json`

Backend:

- `apps/api/prisma/schema.prisma`
- `apps/api/src/app.module.ts`
- `apps/api/src/auth/auth.service.ts`
- `apps/api/src/orders/orders.service.ts`
- `apps/api/src/realtime/order-events.service.ts`
- `apps/api/src/realtime/admin-orders.gateway.ts`
- `apps/api/src/realtime/user-orders.gateway.ts`

Telegram Mini App:

- `apps/web/src/app/parfumApi.ts`
- `apps/web/src/app/App.tsx`
- `apps/web/src/features/session/UserSessionBootstrap.tsx`
- `apps/web/src/widgets/app-top-bar/ui/AppTopBar.tsx`
- `apps/web/src/pages/checkout-page/ui/CheckoutPage.tsx`
- `apps/web/src/pages/address-picker-page/ui/AddressPickerPage.tsx`

Admin:

- `apps/admin/src/app/parfumApi.ts`
- `apps/admin/src/app/App.tsx`
- `apps/admin/src/features/navigation/adminNavSections.ts`
- `apps/admin/src/features/orders/useAdminOrdersRealtime.ts`

## Current Architecture Observations

### Backend

- `apps/api` is a NestJS backend with Prisma, JWT auth, Socket.IO, Swagger DTOs, and modular services.
- `AppModule` currently imports many Parfumbox-specific modules:
  - campaigns, coins, brands, fragrance families, reward settings, promotions, recommendations, segments, RBAC.
- Useful modules already exist and should be adapted:
  - auth, admin auth, products, categories, banners, cart, wishlist, orders, notifications, realtime, telegram notify, storage, users, finance, inventory, broadcasts.
- Prisma schema still contains Parfumbox/reward/referral/perfume structures:
  - coin balance and ledger
  - referral tree and referral rewards
  - traffic campaigns
  - reward settings
  - brands and fragrance families
  - perfume notes, gender, release year
  - size presets and gram-based stock
  - UZS fields
  - segments, promos, bundles, co-purchase recommendations
- Current order flow is deeply tied to:
  - `priceUzs`
  - `ProductSizePreset`
  - `stockGrams`
  - coins checkout spend/refund
  - promo validation/redemption
  - referral payout on qualifying order
- Socket.IO notification pattern is good and should be preserved:
  - `/admin` namespace emits `orders:changed` and `notifications:new`.
  - `/user` namespace emits `order:update` to `user:{userId}` and `product:stock`.

### Telegram Auth

- Existing Telegram Mini App auth validates init data signature correctly in backend.
- Current backend applies `start_param` attribution for referrals and campaigns.
- Current frontend tracks `ref_` and `c_` start params as campaign events.
- For Ansor Market, Telegram auth should remain, but referral/campaign attribution should be removed.

### Telegram Mini App

- `apps/web` uses React, Telegram SDK, RTK Query, Redux, and Telegram UI components.
- API slice is still named `parfumApi`.
- Visible and typed Parfumbox concepts remain:
  - coins page and coin inbox bridge
  - `priceUzs`, `coinBalance`, reward settings, referral tree
  - brands, fragrance families, gender filters
  - perfume size/grams logic
- Current top bar shows coin balance and wishlist/notification actions.
- Checkout currently uses:
  - direct frontend Nominatim calls
  - coordinate selection
  - coins and promo code UI
  - no saved address limit flow
- Required Ansor behavior is Kakao address search through backend only, saved addresses, and disabled order button until a valid address result is selected.

### Admin Panel

- `apps/admin` uses Mantine layout, RTK Query, Redux auth, routes, and sidebar nav.
- Admin route/nav still includes removed sections:
  - rewards, coin gifts, coin ledger, campaigns, promotions, segments, automations, brands, roles, permissions.
- Admin RTK Query includes Parfumbox-specific types and endpoints for:
  - UZS money fields
  - coins/finance coin economy
  - referral/campaign/segment/broadcast targeting
  - brands/fragrance families/size presets
  - RBAC roles/permissions
- Existing admin layout, tables, cards, forms, notifications, and realtime order hook should be preserved visually.

## Files Changed This Session

- `docs/ANSOR_MARKET_IMPLEMENTATION_PLAN.md`
- `docs/ANSOR_MARKET_PROJECT_STATE.md`
- `docs/ANSOR_MARKET_TODO.md`

No source code was modified.

## Build/Test Status

Not run in this session because the user explicitly requested inspection and planning only, with no code implementation.

Required verification after implementation phases:

```bash
pnpm install
pnpm --filter api build
pnpm --filter web build
pnpm --filter admin build
```

Recommended once backend logic changes begin:

```bash
pnpm --filter api test
pnpm --filter api test:e2e
```

## Known Risks

- Renaming all UZS fields to KRW will affect Prisma schema, DTOs, services, tests, RTK Query types, UI pages, and money helpers at once.
- Removing coins/referrals/campaigns touches auth, users, orders, finance, dashboard, broadcasts, notifications, Telegram bot messages, admin nav, and user detail pages.
- Simplifying RBAC to Super Admin only affects backend guards, seeded permissions, admin routes, nav filtering, and settings pages.
- Checkout/address refactor is not just UI; it requires new Prisma model, backend Kakao service, user address CRUD, and order address snapshots.
- Product model change from perfume size/grams to market unit/stock affects products, cart, order creation, inventory, admin product form, product cards, and tests.

## Next Exact Steps

1. Start backend schema/API refactor first.
2. Update Prisma schema for Ansor core models.
3. Adapt/remove backend modules around products, units, users, addresses, orders, notifications, and inventory.
4. Run API build/tests before changing frontend contracts.
5. Then update web and admin RTK Query contracts and UI pages.

## Next Suggested Codex Prompt

Read `AGENTS.md`, `docs/ANSOR_MARKET_REQUIREMENTS.md`, `docs/ANSOR_MARKET_IMPLEMENTATION_PLAN.md`, `docs/ANSOR_MARKET_PROJECT_STATE.md`, and `docs/ANSOR_MARKET_TODO.md`. Start Phase 1 backend refactor only. Update Prisma schema and backend APIs for Ansor Market core models: User cleanup, UserAddress, MeasurementUnit, Product KRW fields, Order KRW/address snapshots, InventoryMovement, and notification kinds. Remove/deprecate backend coins/referrals/rewards/campaigns/segments/brands/fragrance modules from active imports only after dependent code is adjusted. Do not redesign architecture. After changes, run `pnpm --filter api build` and update the Ansor docs with files changed, build status, remaining work, and the next exact prompt.
