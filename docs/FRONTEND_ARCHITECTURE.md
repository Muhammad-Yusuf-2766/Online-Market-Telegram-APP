# Frontend architecture — Parfumbox

This document describes the intended structure and conventions for the **Telegram mini app** (`apps/web`) and **admin panel** (`apps/admin`) in the Parfumbox monorepo.

## Monorepo placement

| App | Role | Primary audience |
|-----|------|------------------|
| `apps/web` | Telegram Mini App (TMA) | End customers inside Telegram |
| `apps/admin` | Back-office UI | Operators on desktop browsers |

Shared UI logic or API types may live in workspace packages (e.g. `packages/shared`) if duplication becomes costly; start simple and extract when needed.

---

## Mini app (`apps/web`)

### Stack (recommended)

- **UI**: [Telegram UI](https://github.com/Telegram-Mini-Apps/TelegramUI) (`@telegram-apps/telegram-ui`) for components that feel native in Telegram.
- **Telegram integration**: [Telegram Mini Apps SDK](https://docs.telegram-mini-apps.com/) (`@telegram-apps/sdk-react`) — theme params, back button, viewport/safe areas.
- **Routing**: React Router with routes such as `/` (catalog), `/product/:id`, `/cart`, `/checkout`, `/orders`, `/profile`.
- **State**: Redux Toolkit with RTK Query for server state; local UI state in slices where appropriate.

### Theming and layout

- **Brand tokens**: Dark green, sand, cream, and soft gold as **CSS variables** (design tokens), synced where sensible with Telegram `themeParams` from the SDK so light/dark modes stay coherent.
- **Layout**: Mobile-first; when opened in a desktop browser for testing, constrain width (for example `max-width` ~430px) and center the column. Respect safe-area insets for notches.

### State boundaries

| Concern | Where it lives |
|---------|----------------|
| Session / JWT / Telegram user snapshot | `entities/session` (or similar) |
| Shopping cart (lines with product snapshots) | `entities/cart` or `features/cart` |
| API calls, caching, invalidation | RTK Query `baseApi` |
| Page-specific UI (filters, step state) | Feature or page modules |

**RTK Query**: One `baseApi` using `fetchBaseQuery`. After exchanging Telegram `initData` for a JWT, attach `Authorization: Bearer <token>` on requests. Use tags for lists and detail (e.g. `Product`, `Order`) so mutations invalidate the right queries.

### Auth bootstrap (no standalone login screen)

1. Mount SDK provider and read `initData` / `initDataRaw` as provided by Telegram.
2. On load, call `POST /auth/telegram` (or the agreed endpoint) with the raw init data string.
3. Store the returned JWT in memory and optionally `sessionStorage`, with awareness of expiry (refresh or re-bootstrap when 401).

There is **no** separate registration page; profile fields are collected at checkout and editable on profile.

### Feature-sliced style (optional)

A practical folder layout:

- `app/` — store, providers, root shell
- `entities/` — session, cart models
- `features/` — reusable feature UI (e.g. cart controls, checkout form sections)
- `pages/` — route-level composition
- `widgets/` — larger composites (e.g. app header)
- `shared/` — API client config, env, utilities, Telegram helpers

Adjust names to match the repo; consistency matters more than the exact labels.

### Catalog “Explore”

- **Grid**: CSS Grid, two columns on small screens; cards with consistent `aspect-square` (or similar) imagery, short title, price.
- **Pagination**: Cursor-based infinite scroll or “load more” optional; API should support cursor or offset limits.
- **Optional**: `react-masonry-css` only if uneven image heights hurt layout; default to a uniform grid first.

---

## Admin (`apps/admin`)

### Stack (recommended)

- **UI**: [Mantine v7](https://mantine.dev/) (or Ant Design) for tables, forms, DatePicker, and [Mantine Charts](https://mantine.dev/charts/getting-started/) on the dashboard.
- **Routing**: React Router with protected routes; redirect unauthenticated users to login.
- **State**: Redux Toolkit + RTK Query mirroring the mini app pattern, with admin-only endpoints and credentials.

### Layout and UX

- **Desktop-first**: Sidebar navigation + main content area.
- **Tables**: Server-side pagination, sorting, and filters; align query params with the API.
- **Dashboard**: Date-range picker driving charts for orders count, new users, and product KPIs (totals, optional low-stock alerts later).

### Admin auth

- Separate from Telegram user JWT: e.g. email/password or a single admin user from environment variables, issuing an **admin** JWT.
- Guard routes and RTK Query base queries with the admin token only.

---

## API contract (optional but valuable)

- Generate or maintain OpenAPI from NestJS (`@nestjs/swagger`).
- Use `openapi-typescript` codegen or hand-written types in `parfumApi` slices so the mini app and admin stay aligned with the backend.

---

## Summary

The mini app prioritizes Telegram-native UX, token-synced theming, and RTK Query with JWT after Telegram auth. The admin prioritizes dense data workflows, charts, and a distinct admin auth path. Both share a clear split between entity state, feature UI, and shared API configuration.
