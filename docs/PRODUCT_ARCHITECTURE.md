# Product architecture — Parfumbox

Parfumbox is a **single-brand** commerce experience delivered as a **Telegram Mini App**, with an **admin panel** for operations. This document describes personas, core user journeys, and the feature set aligned with the planned pages.

## Product scope

- **Catalog**: Browse products (“Explore” style grid), open product detail, add to cart.
- **Cart**: Client-side cart with product snapshots; persists for the session (and optionally longer via local storage if implemented).
- **Checkout**: Collect or confirm contact fields (phone, name, surname, birthday); create order without a separate “register” step.
- **Orders**: List orders and view status (timeline on detail where the API provides steps).
- **Profile**: Edit saved profile fields after the first meaningful data capture (often at checkout).
- **Admin**: Authenticated operators manage products, orders, and users; dashboard with analytics over a date range.

**Payments**: Not assumed in the base scope — orders may represent “placed” intent for offline or manual settlement until a payment provider is integrated.

**Notifications**: Push via Telegram Bot API is optional future scope (requires bot messaging and user opt-in patterns).

**Language**: Single locale unless i18n is added later (e.g. English or Russian — choose one for copy and validation messages).

---

## Personas

| Persona | Goal |
|---------|------|
| **Customer (Telegram)** | Discover fragrances, order quickly, track order status. |
| **Operator (Admin)** | Maintain catalog, update order status, review users and basic KPIs. |

---

## Identity model

- **Implicit identity**: Opening the mini app inside Telegram provides validated `initData`; the backend creates or links a **User** by `telegramId`.
- **No standalone login screen** for customers: the first meaningful write (checkout or profile save) relies on the JWT obtained after Telegram auth bootstrap.
- **Profile fields** can default from Telegram where available; remaining fields are collected on checkout or profile.

---

## User journeys

### 1. Open mini app → theme and JWT bootstrap

1. User opens the Web App from Telegram.
2. Client reads theme and safe area from the Telegram SDK; applies brand CSS tokens in harmony with `themeParams`.
3. Client sends `initData` to the API and stores the returned JWT for subsequent requests.

### 2. Browse Explore → product detail → add to cart

1. User scrolls the catalog grid (dense, image-forward cards).
2. User taps a product → detail page (description, price, images, add to cart).
3. Cart state updates in the client; optional indicator in the shell (e.g. header).

### 3. Checkout → order created → Orders list

1. User opens cart → proceeds to checkout.
2. User confirms or enters phone, name, surname, birthday (minimal friction, single screen where possible).
3. API creates the order (and upserts user contact info transactionally as designed).
4. Confirmation shown; order appears under **Orders** with initial status.

### 4. Profile

1. User opens **Profile** to edit saved fields or review Telegram-synced username (read-only if so specified).
2. Changes persist via `PATCH /users/me` (or equivalent).

### 5. Admin: login → dashboard → manage

1. Operator logs in with admin credentials → receives admin JWT.
2. **Dashboard**: pick a date range; view orders volume, new users, product counts (and later low-stock alerts).
3. **Orders**: filter, open detail, update status.
4. **Products**: CRUD, image upload via MinIO flow.
5. **Users**: list/detail for support (scope according to privacy policy).

---

## Feature list (page alignment)

| Page / area | Features |
|-------------|----------|
| **Catalog (Explore)** | Grid layout, pagination or infinite scroll, navigation to product |
| **Product** | Media, description, price, add to cart |
| **Cart** | Line items, quantities, totals, proceed to checkout |
| **Checkout** | Contact fields, submit order, error handling |
| **Orders** | List + status; detail with timeline if API supports it |
| **Profile** | Editable profile fields |
| **Admin** | Login, dashboard charts, CRUD tables with server pagination |

---

## Inventory and concurrency (product note)

If `stock` is tracked, order placement should use database transactions (and appropriate locking or atomic decrements) to avoid overselling. If stock is not tracked, document that orders are best-effort fulfillment.

---

## Summary

Parfumbox optimizes for **fast Telegram-native shopping** without a traditional registration funnel, with a clear **admin** layer for catalog and order lifecycle. Scope stays extensible for payments, notifications, and i18n when needed.
