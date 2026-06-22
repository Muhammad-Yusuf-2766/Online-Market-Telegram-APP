# Ansor Market Requirements

## Project Context

This repository currently contains the original Parfumbox codebase.

The goal is to refactor the existing Parfumbox project into **Ansor Market**.

Ansor Market is a Telegram Mini App online market for halal products in Korea.

Do not rebuild the project from scratch unless a module is impossible to safely refactor.

Preserve the original Parfumbox architecture, coding patterns, UI design, layout, components, admin panel design, Telegram Mini App design, API patterns, RTK Query patterns, Socket.IO notification flow, and upload flow as much as possible.

Only remove or change what is required by Ansor Market business requirements.

## Repository Structure

Expected project structure:

- `apps/api` — NestJS + Prisma + PostgreSQL + Socket.IO backend
- `apps/web` — Telegram Mini App frontend
- `apps/admin` — Admin panel frontend
- `packages/*` — shared packages if they exist
- `docs/*` — project documentation and implementation state

## Main Business Goal

Refactor Parfumbox into a production-ready Telegram Mini App online market for halal products in Korea.

Brand:

- Project name: Ansor Market
- Market type: halal products in Korea
- Main language: Uzbek
- Currency: KRW / Korean won
- Visible Parfumbox branding must be removed
- Visible perfume-specific terminology must be removed

## Critical Workflow for Codex

Before doing major implementation, always read:

1. `AGENTS.md`
2. `docs/ANSOR_MARKET_REQUIREMENTS.md`
3. `docs/ANSOR_MARKET_IMPLEMENTATION_PLAN.md`
4. `docs/ANSOR_MARKET_PROJECT_STATE.md`
5. `docs/ANSOR_MARKET_TODO.md`

At the end of every major task, update:

- `docs/ANSOR_MARKET_IMPLEMENTATION_PLAN.md`
- `docs/ANSOR_MARKET_PROJECT_STATE.md`
- `docs/ANSOR_MARKET_TODO.md`

The documentation must include:

- what was completed
- what files changed
- what remains
- build/test status
- known issues
- next exact steps
- next suggested Codex prompt

If context limit or task limit is reached, stop only after updating the project state documents.

Do not restart from scratch in future sessions. Continue from the latest checkpoint.

## Remove From Parfumbox

Remove or deprecate these Parfumbox-specific features:

- coins
- coin ledger
- coin gifts
- rewards
- referral system
- referral tree
- traffic campaigns
- campaigns
- segments
- automations
- promo systems if they are not required
- brands
- fragrance families
- perfume notes
- top/heart/base perfume notes
- perfume gender filters
- perfume release year
- UZS-specific naming/copy
- visible Parfumbox branding

Be careful when removing features:

- no broken imports
- no broken routes
- no dead navigation links
- no TypeScript errors
- no runtime crashes

## Keep From Parfumbox

Keep and adapt these existing patterns:

- monorepo structure
- NestJS module/service/controller architecture
- Prisma database access pattern
- DTO validation style
- Telegram Mini App auth flow
- admin auth flow
- RTK Query API structure
- Redux store structure
- admin Mantine layout and design
- Telegram Mini App layout and style
- Socket.IO realtime notification pattern
- order management pattern
- cart/wishlist/order flow where useful
- MinIO/S3 presigned upload flow
- pagination and filtering helpers
- admin tables, modals, drawers, forms, badges, cards
- existing build scripts where possible

## User Telegram Mini App Requirements

### 1. Telegram Auth

The user enters through Telegram Mini App like in Parfumbox.

Keep the existing Telegram auth flow:

- Telegram init data is sent to backend
- backend validates Telegram signature
- user is created or updated by Telegram ID
- backend returns JWT
- frontend stores and uses JWT
- user session bootstrap remains similar

Remove referral/campaign/coin attribution from this flow.

### 2. Telegram App Header

The top header must show:

- market logo
- market name: `Ansor Market`
- slogan: `Koreadagi halal mahsulotlar`
- notification bell on the right
- unread notification badge

Remove from header:

- coins
- rewards
- referral badges
- gift badges
- campaign badges

### 3. Banner and Category Filtering

After the header:

- if admin has an active banner, show the banner
- if there is no active banner, show category filtering
- category filtering should still be accessible and useful
- existing Parfumbox banner carousel/card style should be reused

### 4. Product Model

Adapt products for halal market goods.

Product fields should include:

- title
- description
- category
- measurement unit
- price in KRW
- old price or sale price
- discount percent if useful
- `isOnSale`
- `isBestSeller`
- stock quantity
- low stock threshold
- max 2 images
- rating average
- rating count
- active/inactive status
- createdAt
- updatedAt

Remove product fields related to perfumes:

- brand
- fragrance family
- top notes
- heart notes
- base notes
- gender
- release year

### 5. Wishlist

Users can add products to wishlist.

Requirements:

- product card has heart button
- wishlist is stored server-side
- wishlist page or wishlist section exists
- RTK Query tag invalidation works
- wishlist state updates correctly after toggle

### 6. Cart

Users can add products to cart.

Requirements:

- server-side cart
- add item
- update quantity
- remove item
- clear cart
- cart totals
- product snapshot where needed
- out-of-stock handling
- checkout uses cart items

### 7. Address and Checkout

During checkout, user must select an existing address or add a new address.

Address requirements:

- user can save max 3 addresses
- user can select a saved address
- user can add a new address
- user enters address query
- user clicks Search
- frontend must not call Kakao API directly
- backend calls Kakao Local Address Search API
- backend returns normalized search results
- user selects one result
- user can enter detail address
- order button must be disabled if no valid address result is selected
- address snapshot is saved into order

Kakao backend requirements:

- add `KAKAO_REST_API_KEY` to backend env
- API key is used only in backend
- endpoint: `GET /addresses/search?q=...`
- validate query length
- return empty array if no results
- return controlled error if Kakao API fails
- normalize response to:
  - addressName
  - roadAddressName
  - jibunAddressName
  - buildingName
  - zoneNo
  - latitude
  - longitude
  - raw optional

Address CRUD endpoints:

- `GET /users/me/addresses`
- `POST /users/me/addresses`
- `PATCH /users/me/addresses/:id`
- `DELETE /users/me/addresses/:id`

Backend must enforce max 3 addresses per user.

### 8. Order Flow

Order requirements:

- user creates order from cart
- inventory decreases transactionally
- order item snapshots are saved
- address snapshot is saved
- order total is saved in KRW
- user can view orders
- user can view order details
- optional cancellation is allowed only while order is pending

Order statuses:

- `PENDING`
- `CONFIRMED`
- `PREPARING`
- `SHIPPED`
- `DELIVERED`
- `CANCELLED`

### 9. Notifications

Keep and adapt Parfumbox notification pattern.

When user creates order:

- admin notification is created
- admin web panel receives realtime notification
- admin notification bell updates
- admin orders list refreshes or invalidates

When admin changes order status:

- user notification is created
- Telegram app notification bell unread count updates
- user can open notification
- order list/detail updates or invalidates

Broadcast notifications:

- admin can send message to all users
- every user receives a `UserNotification`
- unread notification remains until user opens or marks it read

### 10. Home Page Product Sections

Telegram app home page structure:

1. Header
2. Banner or category filter
3. Sale products
4. Bestselling products
5. All products

Sale products section:

- title: `Chegirmadagi mahsulotlar`
- right link: `Barchasi →`
- 2 rows
- each row scrolls horizontally
- each row is independent
- row 1 uses page 1, pageSize 10
- row 2 uses page 2, pageSize 10
- product card design follows Parfumbox style

Bestselling products section:

- title: `Eng ko‘p sotilgan mahsulotlar`
- right link: `Barchasi →`
- same behavior as sale section
- 2 independent horizontal rows
- each row pageSize 10

All products section:

- title: `Barcha mahsulotlar`
- vertical grid/list
- no horizontal scroll
- bottom pagination
- server-side pagination
- category filter/search/sort should work

### 11. Bottom Navigation

Keep Parfumbox bottom navigation design.

Required items:

- Home
- Search
- Cart
- Wishlist or Orders
- Profile

Remove navigation to:

- coins
- referrals
- rewards
- campaigns
- gifts

### 12. User Notifications Page

User can view notifications.

Requirements:

- list notifications
- unread/read status
- mark one as read
- mark all as read
- broadcast and order status notifications appear here

## Admin Panel Requirements

Admin panel rule:

Preserve Parfumbox admin UI design, Mantine layout, table style, form style, drawer/modal style, sidebar, header, cards, charts, badges, spacing, and colors as much as possible.

Only adapt data and remove unnecessary features.

### 1. Admin Dashboard

Dashboard must be adapted to Ansor Market.

KPI examples:

- total products
- total orders
- pending orders
- today orders
- revenue KRW
- low stock products
- new users
- delivered orders
- cancelled orders

Remove:

- coin metrics
- referral metrics
- campaign metrics
- reward metrics

### 2. Orders

Keep Parfumbox orders page design.

Adapt to Ansor Market order model.

Requirements:

- order list
- order detail drawer/modal/page
- status filters
- status update
- address snapshot display
- user info display
- order items display
- total KRW display
- realtime order notification
- status change creates user notification

### 3. Product Reviews

Keep or adapt existing product feedback/reviews page.

Requirements:

- list reviews
- approve/reject reviews
- show product/user info
- update product rating average/count when review status changes

### 4. Product Settings

Admin product settings section should include:

1. Products
2. Measurement Units
3. Categories
4. Banners

Remove:

- Brands
- Fragrance Families
- perfume-specific settings

Measurement units:

- create before creating products
- fields:
  - slug
  - name
  - symbol
  - sortOrder
  - allowDecimal optional

- examples:
  - dona
  - kg
  - g
  - litr
  - pack

Products:

- create/edit product
- max 2 images
- category required
- measurement unit required
- price KRW required
- stock quantity required
- sale and bestseller flags
- active/inactive status
- low stock threshold

Product table columns:

- image
- title
- category
- unit
- price
- stock
- sale badge
- bestseller badge
- rating
- createdAt
- actions

### 5. Users

Users section should be simplified.

Remove:

- referrals
- coins
- gifts
- reward history
- campaign attribution

User table should show:

- Telegram ID
- username
- first name
- last name
- phone
- orders count
- total spent
- createdAt
- status if useful

User detail page should preserve rich Parfumbox profile layout but adapt content.

User detail stats:

- profile info
- saved addresses
- orders count
- pending orders count
- delivered orders count
- cancelled orders count
- total spent
- average order value
- wishlist count
- reviews count
- last order date
- order history table

### 6. Finance

Finance section should exist but be simpler than Parfumbox.

Finance metrics:

- gross revenue KRW
- delivered revenue
- pending order amount
- cancelled order amount
- total orders
- average order value
- top products
- top categories
- revenue by day
- orders by status

Remove:

- coins
- referral cost
- campaign cost
- reward cost

### 7. Broadcast Messages

The “Taklif tizimi” section only needs message broadcasting.

Admin can send announcements to all users.

Broadcast fields:

- title
- body
- image optional
- targetUrl optional
- send now

Requirements:

- creates notification for all users
- sends Telegram bot message if existing bot integration supports it
- unread bell remains until user opens message
- no segmentation required
- no campaign automation required

### 8. Inventory

Inventory section should be adapted to Ansor Market.

Requirements:

- stock quantity per product
- low stock products
- inventory movements
- manual stock adjustment
- order create decreases stock
- order cancel restores stock

Inventory movement fields:

- product
- delta
- reason
- order optional
- createdAt

### 9. Admin Users

Admin users should be simple.

Requirements:

- only one admin type: Super Admin
- no roles page
- no permissions page
- all authenticated active admins have full access
- admin users can be added/edited/disabled

Admin user fields:

- email
- password
- fullName
- isActive
- isSuperAdmin default true

## Backend Data Model Target

Use Prisma models adapted to Ansor Market.

Core models:

- User
- UserAddress
- AdminUser
- Product
- Category
- MeasurementUnit
- Cart
- CartItem
- Wishlist
- Order
- OrderItem
- ProductFeedback
- Banner
- UserNotification
- AdminNotification
- Broadcast
- InventoryMovement

Remove or deprecate:

- Brand
- FragranceFamily
- Coin
- CoinLedger
- CoinGift
- RewardSettings
- ReferralReward
- Referral tree models
- TrafficCampaign
- Campaign
- Segment
- Automation
- perfume-specific product fields

## API Target

User API:

- `POST /auth/telegram`
- `GET /products`
- `GET /products/:id`
- `GET /products/sections/sale?page=&pageSize=`
- `GET /products/sections/bestseller?page=&pageSize=`
- `GET /categories`
- `GET /banners`
- `GET /cart`
- `POST /cart/items`
- `PATCH /cart/items/:itemId`
- `DELETE /cart/items/:itemId`
- `POST /cart/clear`
- `GET /wishlist`
- `POST /wishlist/toggle`
- `GET /users/me`
- `PATCH /users/me`
- `GET /users/me/addresses`
- `POST /users/me/addresses`
- `PATCH /users/me/addresses/:id`
- `DELETE /users/me/addresses/:id`
- `GET /addresses/search?q=...`
- `POST /orders`
- `GET /orders`
- `GET /orders/:id`
- `POST /orders/:id/cancel`
- `GET /users/me/notifications`
- `POST /users/me/notifications/:id/read`
- `POST /users/me/notifications/read-all`

Admin API:

- `POST /admin/auth/login`
- `GET /admin/auth/me`
- `GET /admin/stats`
- `GET /admin/products`
- `POST /admin/products`
- `PATCH /admin/products/:id`
- `DELETE /admin/products/:id`
- `GET /admin/measurement-units`
- `POST /admin/measurement-units`
- `PATCH /admin/measurement-units/:id`
- `DELETE /admin/measurement-units/:id`
- `GET /admin/categories`
- `POST /admin/categories`
- `PATCH /admin/categories/:id`
- `DELETE /admin/categories/:id`
- `GET /admin/banners`
- `POST /admin/banners`
- `PATCH /admin/banners/:id`
- `DELETE /admin/banners/:id`
- `GET /admin/orders`
- `GET /admin/orders/:id`
- `PATCH /admin/orders/:id/status`
- `GET /admin/product-feedback`
- `PATCH /admin/product-feedback/:id`
- `GET /admin/users`
- `GET /admin/users/:userId/details`
- `GET /admin/finance/report`
- `GET /admin/inventory/summary`
- `GET /admin/inventory/low-stock`
- `GET /admin/inventory/movements`
- `POST /admin/inventory/:productId/adjust`
- `GET /admin/broadcasts`
- `POST /admin/broadcasts`
- `POST /admin/broadcasts/:id/send`
- `GET /admin/settings/admin-users`
- `POST /admin/settings/admin-users`
- `PATCH /admin/settings/admin-users/:id`
- `DELETE /admin/settings/admin-users/:id`

## Storage and Uploads

Keep existing MinIO/S3-compatible upload flow.

Requirements:

- product images use presigned upload flow
- product max 2 images
- frontend validates max 2 images
- backend validates max 2 images
- banner image upload or URL should work
- no hardcoded local-only image URLs in production logic

## Environment Variables

Update `.env.example` files.

Backend should include:

- `DATABASE_URL`
- `JWT_SECRET`
- `ADMIN_JWT_SECRET`
- `TELEGRAM_BOT_TOKEN`
- `KAKAO_REST_API_KEY`
- MinIO/S3 settings
- CORS settings
- app URLs

Frontend/admin should include:

- `VITE_API_BASE_URL`
- Telegram app config if needed
- admin app config if needed

## Build and Verification

Before considering the implementation complete, run:

```bash
pnpm install
pnpm --filter api build
pnpm --filter web build
pnpm --filter admin build
```

Fix:

- TypeScript errors
- broken imports
- broken routes
- dead navigation links
- invalid Prisma schema
- failing DTO validation
- runtime crashes

## Acceptance Criteria

Backend:

- Prisma schema matches Ansor Market
- Telegram auth works
- admin auth works
- product/category/unit/banner APIs work
- cart/wishlist/order APIs work
- max 3 user addresses enforced
- Kakao address search works through backend
- order creation decrements stock transactionally
- order cancellation restores stock
- admin order status update creates user notification
- broadcast creates notifications for all users

Telegram Mini App:

- Ansor Market header with logo, name, slogan, notification bell
- banner/category filter works
- sale products show in 2 independent horizontal rows
- bestselling products show in 2 independent horizontal rows
- all products show vertical grid with pagination
- wishlist works
- cart works
- checkout works
- Kakao address search works
- order button disabled without valid selected address
- notification unread badge works

Admin:

- admin design remains close to Parfumbox
- dashboard adapted to Ansor Market KPIs
- orders page works
- product review moderation works
- product settings include products, measurement units, categories, banners
- brands are removed
- users page simplified
- user detail page has rich statistics
- finance is simplified
- broadcast sends messages to all users
- inventory manages stock
- admin users only have Super Admin type
- roles/permissions pages removed

Final goal:

A production-ready Ansor Market Telegram Mini App, admin panel, and backend built by refactoring Parfumbox while preserving its architecture, UI design, and implementation patterns.
