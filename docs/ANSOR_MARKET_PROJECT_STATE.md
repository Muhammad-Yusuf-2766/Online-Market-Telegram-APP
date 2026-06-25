# Ansor Market Project State

Last updated: 2026-06-25

## 2026-06-25 Admin Notifications, Broadcasts, and Uzbek Bot Messages Bugfix Checkpoint

### Completed

- Continued from the 2026-06-24 Phase 6 Migration Fix and Live Runtime Verification checkpoint.
- Fixed admin notification bell live unread updates:
  - preserved existing realtime toast and notification sound behavior
  - `notifications:new` now patches the admin `getNotifications` RTK Query cache immediately with the unread notification payload
  - notification cache invalidation now also uses the general `Notification` tag that the bell query actually provides
- Fixed admin Broadcasts / Xabar tarqatish page crash:
  - backend already returned a successful paginated response
  - admin RTK Query now normalizes `GET /admin/broadcasts` from `{ items, total, page, pageSize }` to `BroadcastRow[]` for the existing page
  - no segment/campaign logic was reintroduced
- Fixed Telegram order status bot messages:
  - backend now always generates Uzbek order-status bot copy regardless of `User.locale`
  - smoke verified Uzbek content even for a test user with `locale = "ru"`
- Confirmed existing order realtime and notification flows still work through focused smoke.

### Files Changed This Session

Admin:

- `apps/admin/src/app/parfumApi.ts`
- `apps/admin/src/features/orders/useAdminOrdersRealtime.ts`

Backend:

- `apps/api/src/telegram/telegram-notify.service.ts`

Docs:

- `docs/ANSOR_MARKET_IMPLEMENTATION_PLAN.md`
- `docs/ANSOR_MARKET_PROJECT_STATE.md`
- `docs/ANSOR_MARKET_TODO.md`

### Build/Test Status

Run and passed:

```bash
pnpm --filter api build
pnpm --filter web build
pnpm --filter admin build
pnpm --filter api test
```

Notes:

- Initial `pnpm --filter api build` failed with a Windows `EPERM` while Prisma tried to replace `query_engine-windows.dll.node`.
- Cause: local API dev/built processes were still holding the Prisma query engine DLL.
- Stopped the API processes and reran `pnpm --filter api build`; it passed.
- Web build passed.
- Admin build passed with the existing large chunk/plugin timing warnings.
- API unit tests passed: 10 suites, 42 tests.

Focused smoke run against built API:

- Passed 11 checks, failed 0.
- Verified:
  - API health
  - admin login
  - `/admin` socket connection
  - user order creation
  - admin `notifications:new` realtime payload
  - admin unread notification backend state increased
  - broadcast list backend shape
  - broadcast create/send
  - order status update to `PREPARING`
  - Uzbek Telegram status-copy generation

Not run:

```bash
pnpm --filter api test:e2e
```

Reason:

- Same existing blocker remains: dedicated e2e Postgres database `ansor_market_test` at `localhost:5433` is unavailable.

### Known Issues

- API e2e tests remain blocked by unavailable `localhost:5433` test database.
- The focused smoke verified the realtime event and backend unread state; final visual confirmation of the admin bell badge should be done in the running browser/admin UI after restarting the API/dev stack if needed.
- Smoke created disposable `bugfix-*` local dev records and a broadcast in the `ansor_market` database.
- Internal compatibility identifiers remain:
  - `parfumApi` RTK Query file/slice names
  - Mantine `parfum` color token

### Next Exact Steps

1. Restart the local API dev process if it was stopped for build verification:
   - `pnpm --filter api start:dev`
2. Manually confirm in the admin browser:
   - user creates order
   - toast appears
   - notification sound plays
   - notification bell unread badge increments immediately without page reload
3. Manually confirm Broadcasts / Xabar tarqatish page opens and can list/create/send broadcasts.
4. Manually confirm an admin order status update sends Uzbek Telegram bot copy.
5. Restore the dedicated e2e database on `localhost:5433` and run:
   - `pnpm --filter api test:e2e`

### Next Exact Prompt

Read `AGENTS.md`, `docs/ANSOR_MARKET_REQUIREMENTS.md`, `docs/ANSOR_MARKET_IMPLEMENTATION_PLAN.md`, `docs/ANSOR_MARKET_PROJECT_STATE.md`, and `docs/ANSOR_MARKET_TODO.md`. Continue from the 2026-06-25 Admin Notifications, Broadcasts, and Uzbek Bot Messages Bugfix checkpoint. Do not restart from scratch. First manually re-check the admin browser with the local API/admin/web/Telegram Mini App stack: create an order from Telegram, confirm the admin toast, notification sound, and bell unread badge update immediately; open Broadcasts/Xabar tarqatish and list/create/send a broadcast; change an order status and confirm the Telegram bot message is Uzbek. Then make the dedicated API e2e database available at `localhost:5433` for `ansor_market_test` or intentionally update the isolated e2e DB configuration, run `pnpm --filter api test:e2e`, and fix any real e2e failures. Update the Ansor docs with files changed, build/test status, known issues, and the next exact prompt.

## 2026-06-24 Phase 6 Migration Fix and Live Runtime Verification Checkpoint

### Completed

- Continued from the 2026-06-24 Phase 5 Cleanup checkpoint.
- Confirmed `apps/api/.env` now exists and points to a reachable local PostgreSQL `ansor_market` database on `localhost:5432`.
- Fixed the Prisma migration strategy for a clean local/dev Ansor Market baseline:
  - moved historical Parfumbox migrations out of active `apps/api/prisma/migrations`
  - kept the active migration chain as one fresh Ansor baseline: `20260622193000_ansor_market_baseline`
  - added `apps/api/prisma/migrations_archive/README.md` explaining that production Parfumbox data migration would need a separate plan
- Validated Prisma schema with `pnpm --filter api exec prisma validate`.
- Reset the local `ansor_market` database with `prisma migrate reset --force --skip-seed`.
- Ran the required DB commands successfully:
  - `pnpm --filter api db:migrate`
  - `pnpm --filter api db:seed`
- Fixed two live runtime issues found during smoke testing:
  - `/admin/stats/dashboard` no longer requires `from` and `to`; omitted dates default to the last 14 UTC days.
  - `/admin` and `/user` Socket.IO gateways now verify JWTs with their namespace-specific secrets instead of relying on ambiguous imported `JwtService` configuration.
- Updated the stale cart unit test mock for the current active-product stock check.
- Live-smoked the migrated local API successfully:
  - admin login and `/admin/auth/me`
  - `/admin/stats/dashboard`
  - product CRUD
  - category CRUD
  - measurement-unit CRUD
  - order creation and status update to `PREPARING`
  - admin notification bell read
  - user order/status notification read
  - broadcast create/send
  - inventory adjustment
  - `/admin` Socket.IO `orders:changed` and `notifications:new`
  - `/user` Socket.IO `order:update` and `product:stock`

### Files Changed This Session

Prisma migrations:

- `apps/api/prisma/migrations/20260412120000_init/migration.sql` moved to archive
- `apps/api/prisma/migrations/20260419130000_admin_notifications/migration.sql` moved to archive
- `apps/api/prisma/migrations/20260419140000_product_sizes/migration.sql` moved to archive
- `apps/api/prisma/migrations/20260419180000_presets_price_uzs/migration.sql` moved to archive
- `apps/api/prisma/migrations/20260419193000_order_delivery_coordinates/migration.sql` moved to archive
- `apps/api/prisma/migrations/20260420120000_user_locale/migration.sql` moved to archive
- `apps/api/prisma/migrations/20260501120000_coins_referrals_finance/migration.sql` moved to archive
- `apps/api/prisma/migrations/20260502120000_profile_full_and_coin_notify/migration.sql` moved to archive
- `apps/api/prisma/migrations/20260503120000_product_feedback_ratings/migration.sql` moved to archive
- `apps/api/prisma/migrations/20260507210500_analytics_and_server_cart/migration.sql` moved to archive
- `apps/api/prisma/migrations/20260507220000_phase2_phase3_schema_alignment/migration.sql` moved to archive
- `apps/api/prisma/migrations/20260508000000_inventory_grams_and_movement_grams/migration.sql` moved to archive
- `apps/api/prisma/migrations/20260516120000_add_banners_and_user_notifications/migration.sql` moved to archive
- `apps/api/prisma/migrations/20260516120000_add_rbac/migration.sql` moved to archive
- `apps/api/prisma/migrations_archive/README.md`
- `apps/api/prisma/migrations_archive/20260624_parfumbox_legacy/**`

Backend:

- `apps/api/src/admin-stats/admin-stats.service.ts`
- `apps/api/src/admin-stats/dto/dashboard-stats-query.dto.ts`
- `apps/api/src/realtime/admin-orders.gateway.ts`
- `apps/api/src/realtime/user-orders.gateway.ts`
- `apps/api/src/cart/cart.service.spec.ts`

Docs:

- `docs/ANSOR_MARKET_IMPLEMENTATION_PLAN.md`
- `docs/ANSOR_MARKET_PROJECT_STATE.md`
- `docs/ANSOR_MARKET_TODO.md`

### Build/Test Status

Run and passed:

```bash
pnpm install
pnpm --filter api exec prisma validate
pnpm --filter api db:migrate
pnpm --filter api db:seed
pnpm --filter api build
pnpm --filter web build
pnpm --filter admin build
pnpm --filter api test
```

Database reset run before migrate/seed:

```bash
pnpm --filter api exec prisma migrate reset --force --skip-seed
```

Live smoke result:

- Passed 21 checks, failed 0.
- `/admin` socket received 4 captured events.
- `/user` socket received 6 captured events.

Run and failed:

```bash
pnpm --filter api test:e2e
```

Exact blocker:

- The e2e setup uses `postgresql://postgres:postgres@localhost:5433/ansor_market_test?schema=public`.
- No reachable PostgreSQL test database is available on `localhost:5433`, so every e2e spec fails during `npx prisma migrate deploy` with Prisma schema engine failure.
- This is separate from the working local dev database on `localhost:5432/ansor_market`, which migrated, seeded, and passed live smoke.

Warnings:

- Prisma still warns that `package.json#prisma` config is deprecated for Prisma 7.
- Admin Vite build still warns about chunks larger than 500 kB.

### Known Issues

- Dedicated API e2e database on `localhost:5433` is unavailable; `pnpm --filter api test:e2e` remains blocked until Docker test Postgres is running or the e2e DB target is intentionally changed.
- Live smoke created disposable `smoke-*` users, categories, units, products, orders, notifications, broadcasts, and inventory movements in the local `ansor_market` dev database.
- Internal compatibility identifiers remain:
  - `parfumApi` RTK Query file/slice names
  - Mantine `parfum` color token
  These are not visible UI copy and should only be renamed in a separate low-risk cleanup if desired.

### Next Exact Steps

1. Start or create a dedicated test PostgreSQL database at `localhost:5433` for `ansor_market_test`, or deliberately update e2e test configuration to use another isolated test DB.
2. Run:
   - `pnpm --filter api test:e2e`
3. Optionally add a reusable checked-in smoke script for the Phase 6 runtime checks.
4. Optionally clean disposable `smoke-*` records from the local dev database or reset/reseed it again before manual UI QA.
5. Continue manual browser QA for the admin and Telegram Mini App UI using the now-migrated backend.

### Next Exact Prompt

Read `AGENTS.md`, `docs/ANSOR_MARKET_REQUIREMENTS.md`, `docs/ANSOR_MARKET_IMPLEMENTATION_PLAN.md`, `docs/ANSOR_MARKET_PROJECT_STATE.md`, and `docs/ANSOR_MARKET_TODO.md`. Continue from the 2026-06-24 Phase 6 Migration Fix and Live Runtime Verification checkpoint. Do not restart from scratch. First make the dedicated API e2e database available at `localhost:5433` for `ansor_market_test` or intentionally update the isolated e2e DB configuration. Then run `pnpm --filter api test:e2e` and fix any real e2e failures. After that, perform manual browser QA for the admin and Telegram Mini App against the migrated local backend, focusing on checkout/address UX, notification UI badges, product settings forms, and order management. Preserve the existing Parfumbox-derived architecture/UI patterns and update the Ansor docs with files changed, build/test status, known issues, and the next exact prompt.

## 2026-06-24 Phase 4 DB Blocker and Phase 5 Cleanup Checkpoint

### Completed

- Continued from the 2026-06-23 Phase 4 Realtime/Runtime Verification checkpoint.
- Re-read required project docs and confirmed the task was to resume, not restart.
- Checked database availability:
  - `apps/api/.env` does not exist.
  - Docker is installed, but Docker Desktop Linux engine is not reachable.
  - `docker compose -f docker/docker-compose.test.yml up -d` failed before Postgres startup with:
    - `open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified.`
  - Because there was no reachable database, `pnpm --filter api db:migrate` and `pnpm --filter api db:seed` were not run.
- Documented the live-smoke blocker and proceeded with Phase 5 cleanup as requested.
- Removed inactive legacy backend source modules/files for:
  - admin campaigns
  - admin coins
  - analytics
  - brands
  - coins
  - fragrance families
  - lifecycle automations
  - promotions
  - recommendations
  - reward settings
  - segments
  - RBAC guards/constants/decorators
  - roles/permissions controllers/services/DTOs
  - product size presets and product-size helpers
  - stale service specs that targeted removed legacy contracts
- Removed inactive legacy Prisma RBAC seed file.
- Removed stale Telegram coin notification helper methods.
- Cleaned active source/env/README naming:
  - Swagger title/description and API log prefix now use Ansor Market naming.
  - S3 default bucket now uses `ansor-market`.
  - API/admin/web env examples no longer advertise old Parfumbox proxy/referral naming.
  - Vite dev proxy path changed from `/_parfumbox-api` to `/_ansor-api`.
  - Admin auth/local notification storage keys and web language/cart storage keys use Ansor naming.
  - README/package/docker compose naming updated to Ansor Market.
- Trimmed stale admin Uzbek locale keys for removed pages and added current nav/status keys including `PREPARING`.
- Removed stale web locale coin/referral/UZS/profile bonus/order coin strings in Uzbek and Russian locales.
- Updated API e2e fixtures from removed role/product perfume fields to the current Super Admin, category, measurement unit, `priceKrw`, and `stockQuantity` schema.
- Verified JSON locale files parse successfully.
- Verified active-source grep for targeted legacy terms:
  - active source/env examples/README are clean for the targeted stale terms
  - remaining hits are historical Prisma migration files only
- Ran required install/build verification successfully.

### Files Changed This Session

Backend cleanup and naming:

- `apps/api/.env.example`
- `apps/api/jest.config.js`
- `apps/api/prisma/seed-rbac.ts` (deleted)
- `apps/api/src/admin-auth/admin-auth.service.spec.ts` (deleted)
- `apps/api/src/admin-auth/dto/admin-login.dto.ts`
- `apps/api/src/admin-campaigns/**` (deleted)
- `apps/api/src/admin-coins/**` (deleted)
- `apps/api/src/admin-finance/admin-finance.service.spec.ts` (deleted)
- `apps/api/src/admin-settings/dto/create-permission.dto.ts` (deleted)
- `apps/api/src/admin-settings/dto/create-role.dto.ts` (deleted)
- `apps/api/src/admin-settings/dto/set-permissions.dto.ts` (deleted)
- `apps/api/src/admin-settings/dto/update-permission.dto.ts` (deleted)
- `apps/api/src/admin-settings/dto/update-role.dto.ts` (deleted)
- `apps/api/src/admin-settings/permissions.*` (deleted)
- `apps/api/src/admin-settings/roles.*` (deleted)
- `apps/api/src/admin-settings/admin-users-mgmt.service.spec.ts` (deleted)
- `apps/api/src/admin-stats/admin-stats.service.spec.ts` (deleted)
- `apps/api/src/admin-users/admin-users.service.spec.ts` (deleted)
- `apps/api/src/analytics/**` (deleted)
- `apps/api/src/auth/auth.service.spec.ts` (deleted)
- `apps/api/src/brands/**` (deleted)
- `apps/api/src/broadcasts/broadcasts.service.spec.ts` (deleted)
- `apps/api/src/categories/categories.service.spec.ts`
- `apps/api/src/coins/**` (deleted)
- `apps/api/src/common/rbac/**` (deleted)
- `apps/api/src/fragrance-families/**` (deleted)
- `apps/api/src/inventory/inventory.service.spec.ts` (deleted)
- `apps/api/src/lifecycle/**` (deleted)
- `apps/api/src/main.ts`
- `apps/api/src/orders/orders.service.spec.ts` (deleted)
- `apps/api/src/products/admin-size-presets.controller.ts` (deleted)
- `apps/api/src/products/dto/product-size-line.dto.ts` (deleted)
- `apps/api/src/products/product-sizes.util.ts` (deleted)
- `apps/api/src/products/product-sizes.util.spec.ts` (deleted)
- `apps/api/src/products/products.service.spec.ts` (deleted)
- `apps/api/src/products/size-presets.service.ts` (deleted)
- `apps/api/src/products/size-presets.service.spec.ts` (deleted)
- `apps/api/src/promotions/**` (deleted)
- `apps/api/src/realtime/order-events.service.spec.ts` (deleted)
- `apps/api/src/recommendations/**` (deleted)
- `apps/api/src/reward-settings/**` (deleted)
- `apps/api/src/segments/**` (deleted)
- `apps/api/src/storage/storage.service.ts`
- `apps/api/src/telegram/telegram-notify.service.ts`
- `apps/api/src/telegram/telegram-notify.service.spec.ts` (deleted)
- `apps/api/src/users/users.service.spec.ts` (deleted)
- `apps/api/test/e2e/products.e2e-spec.ts`
- `apps/api/test/setup/db.ts`
- `apps/api/test/setup/e2e-env.ts`
- `apps/api/test/setup/e2e-fixtures.ts`

Admin cleanup and naming:

- `apps/admin/.env.example`
- `apps/admin/src/app/apiBase.ts`
- `apps/admin/src/features/auth/authSlice.ts`
- `apps/admin/src/features/navigation/adminNavSections.ts`
- `apps/admin/src/features/notifications/notificationSound.ts`
- `apps/admin/src/i18n/locales/uz.json`
- `apps/admin/vite.config.ts`

Telegram Mini App cleanup and naming:

- `apps/web/.env.example`
- `apps/web/src/app/parfumApi.ts`
- `apps/web/src/features/cart/cartSlice.ts`
- `apps/web/src/i18n/index.ts`
- `apps/web/src/i18n/locales/ru.json`
- `apps/web/src/i18n/locales/uz.json`
- `apps/web/src/shared/styles/tokens.css`
- `apps/web/src/vite-env.d.ts`
- `apps/web/vite.config.ts`

Repo/docs:

- `README.md`
- `docker-compose.yml`
- `package.json`
- `docs/ANSOR_MARKET_IMPLEMENTATION_PLAN.md`
- `docs/ANSOR_MARKET_PROJECT_STATE.md`
- `docs/ANSOR_MARKET_TODO.md`

Generated/updated by build:

- `apps/api/tsconfig.build.tsbuildinfo`

### Build/Test Status

Run:

```bash
pnpm install
pnpm --filter api build
pnpm --filter web build
pnpm --filter admin build
```

Result:

- `pnpm install` passed; lockfile was already up to date.
- API build passed.
- Web build passed.
- Admin build passed.

Warnings:

- API build still shows Prisma `package.json#prisma` config deprecation warning for Prisma 7.
- Admin Vite build still shows the existing large chunk warning and plugin timing warning.

Not run:

```bash
pnpm --filter api db:migrate
pnpm --filter api db:seed
pnpm --filter api test
pnpm --filter api test:e2e
```

Reason:

- Live database setup is blocked because Docker Desktop Linux engine is not running/reachable and `apps/api/.env` is absent.

### Runtime Smoke Status

Still blocked:

- admin login
- dashboard via `/admin/stats/dashboard`
- product/category/measurement-unit CRUD
- order status update to `PREPARING`
- admin notification bell read/invalidation
- user order/status notifications
- broadcast send
- inventory adjustment
- `/admin` Socket.IO event delivery
- `/user` Socket.IO event delivery

Exact blocker:

- `docker compose -f docker/docker-compose.test.yml up -d` cannot start test Postgres because Docker Desktop Linux engine is unavailable at `//./pipe/dockerDesktopLinuxEngine`.
- No valid `apps/api/.env` is present as a fallback source for `DATABASE_URL`, `JWT_SECRET`, and `ADMIN_JWT_SECRET`.

### Known Issues

- A reachable migrated Ansor database is still required for full live Phase 4 runtime smoke testing.
- Historical Prisma migrations still contain old Parfumbox/UZS/coin/referral/campaign/segment/brand terms by design; active source/env examples/README are clean for the targeted stale terms.
- Internal compatibility identifiers remain:
  - `parfumApi` RTK Query file/slice names
  - Mantine `parfum` color token
  These are not visible UI copy and should only be renamed in a separate low-risk cleanup if desired.
- `BroadcastsService.sendNow` still treats Telegram send failures as notification failures because user notification creation happens after `telegram.sendPlainText` inside the same try block; this preserves the existing pattern but may be worth revisiting so in-app broadcasts are delivered even if Telegram bot send fails.

### Next Exact Steps

1. Start Docker Desktop or provide `apps/api/.env` with a reachable Ansor database and valid JWT secrets.
2. Run:
   - `pnpm --filter api db:migrate`
   - `pnpm --filter api db:seed`
3. Start API/admin/web as needed.
4. Run live smoke tests for:
   - admin login
   - `/admin/stats/dashboard`
   - product CRUD
   - category CRUD
   - measurement-unit CRUD
   - order status update to `PREPARING`
   - admin notification bell read/invalidation
   - user order/status notifications
   - broadcast send
   - inventory adjustment
   - `/admin` Socket.IO event delivery
   - `/user` Socket.IO event delivery
5. After smoke passes, consider targeted tests:
   - `pnpm --filter api test`
   - `pnpm --filter api test:e2e`

### Next Exact Prompt

Read `AGENTS.md`, `docs/ANSOR_MARKET_REQUIREMENTS.md`, `docs/ANSOR_MARKET_IMPLEMENTATION_PLAN.md`, `docs/ANSOR_MARKET_PROJECT_STATE.md`, and `docs/ANSOR_MARKET_TODO.md`. Continue from the 2026-06-24 Phase 5 Cleanup checkpoint. First make a reachable Ansor test database available by starting Docker Desktop for Docker test Postgres or by creating a valid `apps/api/.env` with `DATABASE_URL`, `JWT_SECRET`, and `ADMIN_JWT_SECRET`. Then run `pnpm --filter api db:migrate` and `pnpm --filter api db:seed`. Start the API/admin/web as needed and live smoke-test admin login, `/admin/stats/dashboard`, product/category/measurement-unit CRUD, order status update to `PREPARING`, admin notification bell read/invalidation, user order/status notifications, broadcast send, inventory adjustment, and `/admin` + `/user` Socket.IO event delivery. If smoke passes, run `pnpm --filter api test` and `pnpm --filter api test:e2e` if feasible. Preserve existing architecture/UI/realtime patterns and update the Ansor docs with files changed, build/test status, known issues, and the next exact prompt.

## 2026-06-23 Phase 4 Realtime/Runtime Verification Checkpoint

### Completed

- Continued from the 2026-06-22 Phase 3 Admin Refactor checkpoint.
- Verified that the backend had an `admin-users` module on disk but it was stale and inactive:
  - not imported by `AppModule`
  - still depended on RBAC permissions, referrals, tiers, coin ledger, promo, campaign, and UZS fields removed from the active Ansor schema
- Refactored and activated backend customer admin endpoints:
  - `GET /admin/users`
  - `GET /admin/users/:userId/details`
- Added Ansor customer list/detail payloads for the refactored admin Users screens:
  - Telegram profile fields
  - saved addresses
  - order counts
  - recent order history
  - total spent KRW and average order value
  - pending/delivered/cancelled order counts
  - wishlist, cart, address, and review counts
- Added `/admin/stats/dashboard` alias for the admin dashboard RTK Query contract while preserving `GET /admin/stats`.
- Added explicit `POST /admin/notifications/:id/read` support for the admin notification bell while preserving the existing PATCH endpoint.
- Fixed admin order item quantity display to use backend `quantity` instead of stale `qty`.
- Fixed admin saved address display to use Kakao-normalized `addressName`, `roadAddressName`, and `jibunAddressName` fields.
- Fixed admin measurement-unit CRUD to match the backend Ansor contract:
  - `slug`
  - `name`
  - `symbol`
  - `sortOrder`
  - `allowDecimal`
  - removed unsupported `isActive` payload from the admin form
- Fixed API runtime packaging:
  - `apps/api/nest-cli.json` now deletes `dist` before build
  - `apps/api/tsconfig.build.json` disables incremental build for the runtime package
  - verified no declaration-only active runtime files remain in `apps/api/dist`
- Verified route-level API runtime mapping before Prisma DB connection:
  - `/admin/users`
  - `/admin/users/:userId/details`
  - `/admin/stats/dashboard`
  - `/admin/notifications/:id/read` with POST
  - `/admin/orders/:id/status`
  - `/admin/inventory/:productId/adjust`
  - `/admin/broadcasts/:id/send`
- Confirmed existing realtime source pattern remains intact:
  - `/admin` namespace emits `orders:changed` and `notifications:new`
  - `/user` namespace joins `user:{userId}` and emits `order:update`
  - admin realtime hook invalidates `Order`, `Stats`, and `Notification` tags
  - order status updates create user notifications and support `PREPARING`
  - broadcasts create user notifications for active users
- Ran required install/build verification successfully.

### Files Changed This Session

Backend:

- `apps/api/nest-cli.json`
- `apps/api/tsconfig.build.json`
- `apps/api/src/admin-stats/admin-stats.controller.ts`
- `apps/api/src/admin-users/admin-users.controller.ts`
- `apps/api/src/admin-users/admin-users.module.ts`
- `apps/api/src/admin-users/admin-users.service.ts`
- `apps/api/src/app.module.ts`
- `apps/api/src/notifications/admin-notifications.controller.ts`

Admin:

- `apps/admin/src/app/parfumApi.ts`
- `apps/admin/src/pages/MeasurementUnitsPage.tsx`
- `apps/admin/src/pages/OrdersPage.tsx`
- `apps/admin/src/pages/UserDetailPage.tsx`

Docs:

- `docs/ANSOR_MARKET_IMPLEMENTATION_PLAN.md`
- `docs/ANSOR_MARKET_PROJECT_STATE.md`
- `docs/ANSOR_MARKET_TODO.md`

Generated/updated by build:

- `apps/api/tsconfig.build.tsbuildinfo`

### Build/Test Status

Run:

```bash
pnpm install
pnpm --filter api build
pnpm --filter web build
pnpm --filter admin build
```

Result:

- `pnpm install` passed; lockfile was already up to date.
- API build passed.
- Web build passed.
- Admin build passed.

Warnings:

- API build still shows Prisma `package.json#prisma` config deprecation warning for Prisma 7.
- Admin Vite build still shows the existing large chunk warning.
- Web/admin Vite builds may show plugin timing warnings.

Runtime smoke status:

- API route mapping smoke passed up to Prisma initialization.
- Full live endpoint smoke testing was blocked by local database availability:
  - Docker Desktop engine was not running, so `docker compose -f docker/docker-compose.test.yml up -d` could not start test Postgres.
  - A local Postgres process was listening on port 5432, but `postgres:postgres` was rejected with Prisma `P1000`.
  - `apps/api/.env` does not exist and no `DATABASE_URL`, `JWT_SECRET`, or `ADMIN_JWT_SECRET` variables were set in the shell.

Not fully run because of DB blocker:

- Admin login live request
- Dashboard data request
- Product/category/measurement-unit CRUD live requests
- Order status update live request including `PREPARING`
- Admin notification bell live invalidation
- User order/status notification live delivery
- Broadcast send live request
- Inventory adjustment live request
- Socket.IO client event smoke with persisted orders/notifications

### Known Issues

- A reachable migrated Ansor database is required for full Phase 4 runtime smoke testing.
- Docker Desktop needs to be started, or `apps/api/.env` needs a valid `DATABASE_URL` and JWT secrets for the local Postgres instance.
- `BroadcastsService.sendNow` still treats Telegram send failures as notification failures because user notification creation happens after `telegram.sendPlainText` inside the same try block; this preserves the existing pattern but may be worth revisiting so in-app broadcasts are delivered even if Telegram bot send fails.
- Some inactive old Uzbek locale keys for removed admin features remain and should be cleaned in Phase 5.
- Internal compatibility names such as `parfumApi`, `parfum` color token, and old package/docker labels remain.

### Next Exact Steps

1. Start Phase 5 cleanup only after confirming whether to use Docker test Postgres or a real local Ansor database.
2. Provide a reachable database by either:
   - starting Docker Desktop and using `docker compose -f docker/docker-compose.test.yml up -d`, or
   - creating `apps/api/.env` with valid `DATABASE_URL`, `JWT_SECRET`, `ADMIN_JWT_SECRET`, and optional Telegram/MinIO/Kakao values.
3. Run:
   - `pnpm --filter api db:migrate`
   - `pnpm --filter api db:seed`
4. Start the API and smoke-test the live flows:
   - admin login
   - dashboard
   - product/category/measurement-unit CRUD
   - order status update to `PREPARING`
   - admin notification bell read/invalidation
   - user order/status notifications
   - broadcast send
   - inventory adjustment
   - admin and user Socket.IO event delivery
5. Then begin cleanup:
   - remove inactive backend modules from disk
   - remove stale locale keys
   - search for remaining visible Parfumbox/perfume/UZS/coin/referral/campaign terminology
   - rename internal compatibility names only if low-risk

### Next Exact Prompt

Read `AGENTS.md`, `docs/ANSOR_MARKET_REQUIREMENTS.md`, `docs/ANSOR_MARKET_IMPLEMENTATION_PLAN.md`, `docs/ANSOR_MARKET_PROJECT_STATE.md`, and `docs/ANSOR_MARKET_TODO.md`. Continue from the 2026-06-23 Phase 4 Realtime/Runtime Verification checkpoint. First make a reachable Ansor test database available using Docker test Postgres or a valid `apps/api/.env`, then run `pnpm --filter api db:migrate` and `pnpm --filter api db:seed`. Start the API/admin/web as needed and live smoke-test admin login, dashboard, product/category/measurement-unit CRUD, order status update to `PREPARING`, admin notification bell read/invalidation, user order/status notifications, broadcast send, inventory adjustment, and `/admin` + `/user` Socket.IO event delivery. After live smoke passes or any blocker is documented, start Phase 5 cleanup only: remove inactive legacy modules/files and stale visible Parfumbox/perfume/UZS/coin/referral/campaign terminology without redesigning. Run `pnpm install`, `pnpm --filter api build`, `pnpm --filter web build`, and `pnpm --filter admin build`; update the Ansor docs with files changed, build/test status, known issues, and the next exact prompt.

## 2026-06-22 Phase 3 Admin Refactor Checkpoint

### Completed

- Continued from the Phase 2 Telegram Mini App checkpoint.
- Replaced the admin RTK Query slice with Ansor Market contracts:
  - KRW money fields (`priceKrw`, `unitPriceKrw`, `subtotalKrw`, `totalKrw`)
  - `MeasurementUnit`
  - `UserAddress`
  - `stockQuantity`
  - sale/bestseller product flags
  - Super Admin-only admin users
  - no active coin/referral/reward/campaign/segment/brand/fragrance/size preset/RBAC endpoints
- Simplified admin auth and navigation for active Super Admin access.
- Removed admin routes/pages for removed Parfumbox surfaces:
  - insights
  - size presets
  - rewards
  - coin gifts
  - coin ledger
  - campaigns
  - promotions
  - segments
  - automations
  - brands
  - roles
  - permissions
- Added `MeasurementUnitsPage` and routed Product Settings to Products, Measurement Units, Categories, and Banners.
- Refactored dashboard to Ansor KPIs: revenue KRW, orders, products, inventory, engagement, and 14-day stats.
- Refactored orders to KRW totals, address snapshots, unit snapshots, and `PREPARING` status.
- Refactored products to category, measurement unit, KRW pricing, `stockQuantity`, low stock, sale/bestseller, active status, and max 2 image URLs.
- Refactored users and user detail views to remove coins/referrals/campaigns/tiers and show Telegram profile, addresses, orders, wishlist, and cart fields.
- Refactored finance to KRW report KPIs, status totals, daily revenue, top products, and top categories.
- Refactored broadcasts to title/body/image/targetUrl with send-now flow and no segment targeting.
- Refactored inventory to stock quantity summary, low-stock list, movements, and generic delta adjustment.
- Refactored admin users to email/password/fullName/isActive with Super Admin badge only.
- Updated admin money formatting to KRW.
- Updated visible admin brand text to `Ansor Market Admin`.
- Ran `pnpm --filter admin build` successfully.

### Files Changed This Session

Admin:

- `apps/admin/src/app/App.tsx`
- `apps/admin/src/app/parfumApi.ts`
- `apps/admin/src/features/auth/authSlice.ts`
- `apps/admin/src/features/auth/useCurrentAdmin.ts`
- `apps/admin/src/features/navigation/adminNavSections.ts`
- `apps/admin/src/i18n/locales/uz.json`
- `apps/admin/src/layouts/AdminLayout.tsx`
- `apps/admin/src/pages/BroadcastsPage.tsx`
- `apps/admin/src/pages/DashboardPage.tsx`
- `apps/admin/src/pages/FinancePage.tsx`
- `apps/admin/src/pages/InventoryPage.tsx`
- `apps/admin/src/pages/MeasurementUnitsPage.tsx`
- `apps/admin/src/pages/OrdersPage.tsx`
- `apps/admin/src/pages/ProductsPage.tsx`
- `apps/admin/src/pages/UserDetailPage.tsx`
- `apps/admin/src/pages/UsersPage.tsx`
- `apps/admin/src/pages/WelcomePage.tsx`
- `apps/admin/src/pages/settings/SettingsAdminUsersPage.tsx`
- `apps/admin/src/pages/settings/SettingsIndexRedirect.tsx`
- `apps/admin/src/shared/lib/money.ts`
- `apps/admin/src/shared/lib/orderStatusMantine.ts`

Deleted admin legacy files:

- `apps/admin/src/features/referral-tree/AdminReferralTree.tsx`
- `apps/admin/src/features/auth/permissions.ts`
- `apps/admin/src/features/auth/RequirePermission.tsx`
- `apps/admin/src/features/settings/groupPermissions.ts`
- `apps/admin/src/features/settings/usePermissionLabel.ts`
- `apps/admin/src/pages/AutomationsPage.tsx`
- `apps/admin/src/pages/BrandsPage.tsx`
- `apps/admin/src/pages/CampaignsPage.tsx`
- `apps/admin/src/pages/CoinGiftsPage.tsx`
- `apps/admin/src/pages/CoinLedgerPage.tsx`
- `apps/admin/src/pages/InsightsPage.tsx`
- `apps/admin/src/pages/PromotionsPage.tsx`
- `apps/admin/src/pages/RewardSettingsPage.tsx`
- `apps/admin/src/pages/SegmentsPage.tsx`
- `apps/admin/src/pages/SizePresetsPage.tsx`
- `apps/admin/src/pages/settings/SettingsPermissionsPage.tsx`
- `apps/admin/src/pages/settings/SettingsRoleDetailPage.tsx`
- `apps/admin/src/pages/settings/SettingsRolesPage.tsx`
- `apps/admin/src/shared/ui/UserTierBadge.tsx`

Docs:

- `docs/ANSOR_MARKET_IMPLEMENTATION_PLAN.md`
- `docs/ANSOR_MARKET_PROJECT_STATE.md`
- `docs/ANSOR_MARKET_TODO.md`

### Build/Test Status

Run:

```bash
pnpm --filter admin build
```

Result:

- Admin build passed.
- Vite emitted the existing large chunk warning for the admin bundle.

Not run in this checkpoint:

```bash
pnpm --filter api build
pnpm --filter web build
pnpm --filter api test
pnpm --filter api test:e2e
```

### Known Issues

- Admin customer Users and User Detail screens are refactored against the intended Ansor contracts, but live runtime still needs a backend smoke test because `apps/api/src/users/users.controller.ts` currently exposes `/users/me` and address/profile flows, not confirmed `/admin/users` list/detail endpoints.
- Some inactive old Uzbek locale keys for coins, campaigns, brands, segments, roles, permissions, and size presets remain in `apps/admin/src/i18n/locales/uz.json`; they are no longer referenced by routed admin pages and should be removed in cleanup.
- Internal names such as `parfumApi`, the `parfum` Mantine color token, and auth storage key remain for compatibility and should be renamed during final cleanup if desired.
- Full end-to-end realtime behavior was not smoke-tested with running API/admin/web servers in this checkpoint.
- API tests/e2e tests still need updates for the Ansor schema and contracts.

### Next Exact Steps

1. Start Phase 4 realtime/runtime verification.
2. Verify or add active backend admin customer endpoints for `/admin/users` and `/admin/users/:id/details` if required by the admin Users screens.
3. Start local API/admin/web servers and smoke-test:
   - admin login
   - admin dashboard
   - product/category/measurement unit CRUD
   - order status updates including `PREPARING`
   - admin notification bell invalidation
   - user order/status notifications
   - broadcast creation/send
   - inventory adjustment
4. Run full build verification:
   - `pnpm --filter api build`
   - `pnpm --filter web build`
   - `pnpm --filter admin build`
5. Begin Phase 5 cleanup after runtime verification passes.

### Next Exact Prompt

Read `AGENTS.md`, `docs/ANSOR_MARKET_REQUIREMENTS.md`, `docs/ANSOR_MARKET_IMPLEMENTATION_PLAN.md`, `docs/ANSOR_MARKET_PROJECT_STATE.md`, and `docs/ANSOR_MARKET_TODO.md`. Continue from the 2026-06-22 Phase 3 Admin Refactor checkpoint. Start Phase 4 realtime/runtime verification only: verify or add active backend admin customer endpoints needed by the refactored admin Users screens (`/admin/users`, `/admin/users/:id/details`), then smoke-test admin login, dashboard, product/category/measurement-unit CRUD, order status updates including `PREPARING`, admin notification bell invalidation, user order/status notifications, broadcast send, and inventory adjustment while preserving existing realtime patterns. Run `pnpm --filter api build`, `pnpm --filter web build`, and `pnpm --filter admin build`; update the Ansor docs with files changed, build/test status, known issues, and the next exact prompt.

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
