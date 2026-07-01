# Ansor Market TODO

Last updated: 2026-07-01

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
- [x] Run `pnpm --filter api test` if feasible.
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
- [x] Live smoke-test admin login with a reachable Ansor database.
- [x] Live smoke-test dashboard with `/admin/stats/dashboard`.
- [x] Live smoke-test product/category/measurement-unit CRUD.
- [x] Live smoke-test order status update including `PREPARING`.
- [x] Live smoke-test admin notification bell read/invalidation.
- [x] Live smoke-test user order/status notifications and `/user` socket event delivery.
- [x] Live smoke-test broadcast send.
- [x] Live smoke-test inventory adjustment.
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

- [x] Make a reachable Ansor test database available through Docker test Postgres or `apps/api/.env`.
- [x] Run `pnpm --filter api db:migrate`.
- [x] Run `pnpm --filter api db:seed`.
- [x] Live smoke-test admin login.
- [x] Live smoke-test dashboard via `/admin/stats/dashboard`.
- [x] Live smoke-test product CRUD.
- [x] Live smoke-test category CRUD.
- [x] Live smoke-test measurement-unit CRUD.
- [x] Live smoke-test order status update to `PREPARING`.
- [x] Live smoke-test admin notification bell read/invalidation.
- [x] Live smoke-test user order/status notifications and `/user` socket event delivery.
- [x] Live smoke-test broadcast send.
- [x] Live smoke-test inventory adjustment.
- [x] Live smoke-test `/admin` Socket.IO event delivery.
- [x] Run `pnpm --filter api test` if feasible.
- [ ] Run `pnpm --filter api test:e2e` if database setup is available.

## 2026-06-25 Runtime Bugfixes

- [x] Fix admin notification bell unread badge live update on `notifications:new`.
- [x] Preserve admin notification toast and sound behavior.
- [x] Fix admin Broadcasts / Xabar tarqatish page crash with current paginated backend response.
- [x] Keep broadcasts as all-user messages only; do not reintroduce segment/campaign logic.
- [x] Force Telegram order status bot messages to Uzbek regardless of user locale.
- [x] Run `pnpm --filter api build`.
- [x] Run `pnpm --filter web build`.
- [x] Run `pnpm --filter admin build`.
- [x] Run `pnpm --filter api test`.
- [x] Smoke verify admin notification realtime payload and unread backend state.
- [x] Smoke verify broadcast list/create/send.
- [x] Smoke verify order status update still works.
- [x] Smoke verify generated Telegram order status copy is Uzbek.
- [ ] Manually confirm admin bell visual badge increments in the browser without reload after restarting/running the local stack.

## 2026-07-01 Branding and Local Upload Improvements

- [x] Add database-backed market branding settings.
- [x] Add public branding endpoint for Telegram Mini App.
- [x] Add admin branding get/update endpoints.
- [x] Add Settings → Market brendi admin page with Uzbek labels.
- [x] Admin can edit market name and slogan.
- [x] Admin can set logo URL.
- [x] Admin can upload logo file.
- [x] Admin header uses saved logo/name/slogan with logo beside stacked text.
- [x] Telegram Mini App header uses saved logo/name/slogan with fallback defaults.
- [x] Serve backend local uploads from `/uploads`.
- [x] Add product image local upload endpoint under `uploads/product-images`.
- [x] Add banner image local upload endpoint under `uploads/banner-images`.
- [x] Product create/edit supports URL entry and local image upload.
- [x] Product max 2 image behavior remains enforced.
- [x] Banner create supports URL entry and local image upload.
- [x] Banner edit modal supports URL entry and local image upload.
- [x] Change Telegram sale title to `Chegirmada`.
- [x] Change Telegram bestseller title to `Eng ko‘p sotilgan`.
- [x] Remove sale/bestseller “Barchasi” links.
- [x] Add Telegram banner image preview modal with `X` close button.
- [x] Add `API_PUBLIC_URL` env example for local upload URL generation.
- [x] Run `corepack pnpm install --frozen-lockfile --config.confirmModulesPurge=false`.
- [x] Run `corepack pnpm --filter api build`.
- [x] Run `corepack pnpm --filter web build`.
- [x] Run `corepack pnpm --filter admin build`.
- [x] Run `corepack pnpm --filter api test`.
- [ ] Apply the new Prisma migration to the active dev database.
- [ ] Manually verify admin branding settings and header layout in browser.
- [ ] Manually verify Telegram Mini App dynamic header branding.
- [ ] Manually verify product image URL/upload display in admin.
- [ ] Manually verify banner image URL/upload/edit display in admin.
- [ ] Manually verify Telegram banner preview modal on mobile viewport.
- [ ] Run `corepack pnpm --filter api test:e2e` if the dedicated test database is available.

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

Read `AGENTS.md`, `docs/ANSOR_MARKET_REQUIREMENTS.md`, `docs/ANSOR_MARKET_IMPLEMENTATION_PLAN.md`, `docs/ANSOR_MARKET_PROJECT_STATE.md`, and `docs/ANSOR_MARKET_TODO.md`. Continue from the 2026-07-01 Admin Branding, Local Image Uploads, and Banner Preview checkpoint. Do not restart from scratch. First apply the new Prisma migration to the active dev database, restart the local API/admin/web stack, and manually verify the admin branding settings, admin header branding layout, Telegram header branding, product image URL/upload flow with max 2 images, banner URL/upload/edit flow, Telegram sale/bestseller section titles without “Barchasi” links, and banner image preview modal. If the dedicated e2e database is available, run `corepack pnpm --filter api test:e2e`; otherwise document the blocker. Update the Ansor docs with files changed, build/test/manual QA status, known issues, and the next exact prompt.
