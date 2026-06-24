# Ansor Market TODO

Last updated: 2026-06-24

## Immediate Rule

- [x] At the start of the next session, read:
  - `AGENTS.md`
  - `docs/ANSOR_MARKET_REQUIREMENTS.md`
  - `docs/ANSOR_MARKET_IMPLEMENTATION_PLAN.md`
  - `docs/ANSOR_MARKET_PROJECT_STATE.md`
  - `docs/ANSOR_MARKET_TODO.md`
- [x] Continue from this checkpoint. Do not restart from scratch.

## Phase 1 - Backend Schema and APIs

### Prisma schema

- [x] Refactor `apps/api/prisma/schema.prisma` from Parfumbox to Ansor Market core schema.
- [x] Remove/deprecate user coin/referral/campaign/tier/profile bonus fields.
- [x] Add `UserAddress`.
- [x] Add `MeasurementUnit`.
- [x] Replace product perfume fields with Ansor product fields:
  - title
  - description
  - category
  - measurement unit
  - `priceKrw`
  - `oldPriceKrw`
  - `discountPercent`
  - `isOnSale`
  - `isBestSeller`
  - `stockQuantity`
  - `lowStockThreshold`
  - max 2 images
  - rating fields
  - active status
- [x] Remove/deprecate `Brand`, `FragranceFamily`, `ProductSizePreset`, `ProductGender`, perfume notes, release year, gram stock.
- [x] Add `PREPARING` to order statuses.
- [x] Replace order UZS/coin/promo fields with KRW totals and address snapshot fields.
- [x] Rename/adapt `StockMovement` to `InventoryMovement` using stock quantity.
- [x] Simplify `UserNotificationKind` to Ansor-relevant kinds.
- [x] Simplify `AdminUser` flow to Super Admin only.
- [x] Update Prisma seed files.
- [x] Create/update Prisma migration for the Ansor schema.

### Backend modules

- [x] Add/adapt measurement units module.
- [x] Add addresses module for saved addresses and Kakao search.
- [x] Remove referral/campaign attribution from `AuthService`.
- [x] Remove coins/rewards/referrals/campaigns/segments/promos from active order/user flows.
- [x] Adapt products service/controller/DTOs to KRW, units, sale, bestseller, active status, max 2 images.
- [x] Add product section endpoints:
  - `GET /products/sections/sale`
  - `GET /products/sections/bestseller`
- [x] Adapt cart service for unit-based products and stock quantity.
- [x] Adapt wishlist service only as needed for new product shape.
- [x] Adapt order creation from cart, selected address, KRW totals, inventory decrement, cart clearing.
- [x] Adapt order cancel to restore inventory.
- [x] Adapt admin order status update to create user notifications and Telegram messages.
- [x] Adapt inventory endpoints to stock quantity/manual adjustment/low stock/movements.
- [x] Adapt dashboard stats to Ansor KPIs.
- [x] Adapt finance report to KRW revenue/order metrics only.
- [x] Adapt broadcast to all users without segments.
- [x] Adapt admin users to Super Admin only.
- [x] Remove inactive backend modules from `AppModule` after dependencies are gone.
- [x] Delete/archive inactive Parfumbox backend modules after frontend/admin contracts are migrated.

### Backend env/tests

- [x] Add `KAKAO_REST_API_KEY` to `apps/api/.env.example`.
- [ ] Update API unit tests for products/orders/users/inventory/notifications.
- [ ] Update API e2e tests for auth/products/cart/orders.
- [x] Run `pnpm --filter api build`.
- [ ] Run `pnpm --filter api test` if feasible.
- [ ] Run `pnpm --filter api test:e2e` if database setup is available.

## Phase 2 - Telegram Mini App

### RTK Query/types

- [x] Update `apps/web/src/app/parfumApi.ts` for Ansor API contracts.
- [x] Remove coin/reward/referral endpoints and types.
- [x] Remove brand/fragrance/gender filters.
- [x] Add measurement unit/address/Kakao search types.
- [x] Rename UZS fields to KRW fields.
- [ ] Keep or later rename `parfumApi` internally after functional refactor is stable.

### Branding/navigation

- [x] Update header to show Ansor Market logo/name/slogan and notification bell.
- [x] Remove coin balance from top bar.
- [x] Remove `CoinInboxBridge`, coins page route, and coin feature folder references.
- [x] Update bottom nav to Home, Search, Cart, Wishlist or Orders, Profile.
- [x] Replace visible Parfumbox/Aromus/perfume/UZS copy.
- [x] Update money formatter to KRW.

### Catalog/product flow

- [x] Update catalog to show banner or category filter.
- [x] Add sale products two independent horizontal rows.
- [x] Add bestselling products two independent horizontal rows.
- [x] Keep all products vertical grid/list with pagination.
- [x] Update product card for unit, KRW price, sale/bestseller, stock.
- [x] Update product detail page for Ansor fields.
- [x] Preserve existing Telegram Mini App visual style.

### Cart/wishlist/checkout/orders

- [x] Update cart for stock quantity and KRW totals.
- [x] Keep wishlist toggle with correct invalidation.
- [x] Replace direct Nominatim calls with backend Kakao address search.
- [x] Add saved address list and max 3 UX.
- [x] Require selected backend-normalized address result plus detail address.
- [x] Disable order button until address is valid.
- [x] Remove coins/promo checkout UI unless explicitly reapproved.
- [x] Update order list/detail status display including `PREPARING`.
- [ ] Update notification page if payload shape changes.
- [x] Run `pnpm --filter web build`.

## Phase 3 - Admin Panel

### RTK Query/routes/nav

- [x] Update `apps/admin/src/app/parfumApi.ts` for Ansor API contracts.
- [x] Remove endpoints/types for coins, rewards, campaigns, segments, automations, brands, fragrance families, roles, permissions.
- [x] Add measurement unit endpoints.
- [x] Rename UZS fields to KRW fields.
- [x] Simplify route guards/nav for Super Admin only.
- [x] Remove inactive routes from `apps/admin/src/app/App.tsx`.
- [x] Update sidebar sections in `adminNavSections.ts`.

### Pages

- [x] Dashboard: replace coin/referral/campaign KPIs with Ansor KPIs.
- [x] Orders: show KRW totals, address snapshot, user info, items, status update including `PREPARING`.
- [x] Products: remove perfume fields; add unit, stock, sale/bestseller, active status, max 2 images.
- [x] Measurement Units: replace Size Presets page.
- [x] Categories: keep/adapt existing page.
- [x] Banners: keep/adapt existing page.
- [x] Product Feedback: keep moderation and rating recompute.
- [x] Users: remove coin/referral/campaign/tier; show order stats and saved addresses.
- [x] User Detail: adapt rich profile to Ansor stats.
- [x] Finance: remove coin economy and show KRW revenue/order/top product/category metrics.
- [x] Broadcast: send to all users, no segmentation.
- [x] Inventory: stock quantity, low stock, manual adjustment, movements.
- [x] Admin Users: email/password/fullName/isActive only; no role/permission assignment.
- [x] Run `pnpm --filter admin build`.

## Phase 4 - Realtime Notifications

- [x] Keep `/admin` Socket.IO namespace auth and events.
- [x] Keep `/user` Socket.IO namespace auth and user rooms.
- [x] Verify or add active backend admin customer endpoints for `/admin/users` and `/admin/users/:id/details`.
- [x] Ensure order creation creates and emits admin notification in existing `OrderEventsService` pattern.
- [x] Ensure status change creates user notification and emits user order update in source.
- [x] Ensure admin orders list and notification bell invalidate on realtime events in source.
- [x] Ensure Telegram app unread count updates through existing notification polling/tag invalidation path.
- [x] Remove Telegram coin gift notification code from active notification kinds/flows.
- [ ] Live smoke-test admin login with a reachable Ansor database.
- [ ] Live smoke-test dashboard with `/admin/stats/dashboard`.
- [ ] Live smoke-test product/category/measurement-unit CRUD.
- [ ] Live smoke-test order status update including `PREPARING`.
- [ ] Live smoke-test admin notification bell read/invalidation.
- [ ] Live smoke-test user order/status notifications and `/user` socket event delivery.
- [ ] Live smoke-test broadcast send.
- [ ] Live smoke-test inventory adjustment.
- [ ] Add/adjust tests around `OrderEventsService` and notification services.

## Phase 5 - Cleanup

- [x] Search for and remove visible `Parfumbox`, `Aromus`, `parfum`, `perfume` branding/copy from active source/env examples/README. Historical migrations intentionally remain.
- [x] Search for and remove `UZS`, `priceUzs`, `oldPriceUzs`, `unitPriceUzs`, `subtotalUzs`, `totalUzs` after KRW migration from active source/env examples/README. Historical migrations intentionally remain.
- [x] Search for and remove remaining active `coin`, `referral`, `reward`, `campaign`, `segment`, `automation`, `brand`, `fragrance` references unless intentionally retained in archived migration history.
- [x] Update `.env.example` files.
- [x] Update README/docs if needed.
- [x] Remove dead imports/routes/components/styles.
- [x] Run full verification:

```bash
pnpm install
pnpm --filter api build
pnpm --filter web build
pnpm --filter admin build
```

## Phase 6 - Live Runtime Verification

- [ ] Make a reachable Ansor test database available through Docker test Postgres or `apps/api/.env`.
- [ ] Run `pnpm --filter api db:migrate`.
- [ ] Run `pnpm --filter api db:seed`.
- [ ] Live smoke-test admin login.
- [ ] Live smoke-test dashboard via `/admin/stats/dashboard`.
- [ ] Live smoke-test product CRUD.
- [ ] Live smoke-test category CRUD.
- [ ] Live smoke-test measurement-unit CRUD.
- [ ] Live smoke-test order status update to `PREPARING`.
- [ ] Live smoke-test admin notification bell read/invalidation.
- [ ] Live smoke-test user order/status notifications and `/user` socket event delivery.
- [ ] Live smoke-test broadcast send.
- [ ] Live smoke-test inventory adjustment.
- [ ] Live smoke-test `/admin` Socket.IO event delivery.
- [ ] Run `pnpm --filter api test` if feasible.
- [ ] Run `pnpm --filter api test:e2e` if database setup is available.

## Documentation Maintenance

At the end of each major task:

- [x] Update `docs/ANSOR_MARKET_IMPLEMENTATION_PLAN.md` if plan changes.
- [x] Update `docs/ANSOR_MARKET_PROJECT_STATE.md` with:
  - completed work
  - files changed
  - remaining work
  - build/test status
  - known issues
  - next exact steps
- [x] Update `docs/ANSOR_MARKET_TODO.md` checkboxes.
- [x] Write the next exact Codex prompt.

## Next Exact Prompt To Run

Read `AGENTS.md`, `docs/ANSOR_MARKET_REQUIREMENTS.md`, `docs/ANSOR_MARKET_IMPLEMENTATION_PLAN.md`, `docs/ANSOR_MARKET_PROJECT_STATE.md`, and `docs/ANSOR_MARKET_TODO.md`. Continue from the 2026-06-24 Phase 5 Cleanup checkpoint. First make a reachable Ansor test database available by starting Docker Desktop for Docker test Postgres or by creating a valid `apps/api/.env` with `DATABASE_URL`, `JWT_SECRET`, and `ADMIN_JWT_SECRET`. Then run `pnpm --filter api db:migrate` and `pnpm --filter api db:seed`. Start the API/admin/web as needed and live smoke-test admin login, `/admin/stats/dashboard`, product/category/measurement-unit CRUD, order status update to `PREPARING`, admin notification bell read/invalidation, user order/status notifications, broadcast send, inventory adjustment, and `/admin` + `/user` Socket.IO event delivery. If smoke passes, run `pnpm --filter api test` and `pnpm --filter api test:e2e` if feasible. Preserve existing architecture/UI/realtime patterns and update the Ansor docs with files changed, build/test status, known issues, and the next exact prompt.
