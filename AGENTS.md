# Ansor Market Agent Instructions

This repository is a refactor of the original Parfumbox project into Ansor Market.

Ansor Market is a Telegram Mini App online market for halal products in Korea.

## Main rule

Preserve the existing Parfumbox architecture, UI design, layout, component style, coding patterns, API patterns, admin panel style, Telegram Mini App style, and realtime notification patterns as much as possible.

Do not redesign the project from scratch.

Refactor the existing project into Ansor Market by removing perfume-specific and reward/referral features, then adapting the remaining system to halal market products.

## Apps

- `apps/api`: NestJS + Prisma + PostgreSQL + Socket.IO backend
- `apps/web`: Telegram Mini App frontend
- `apps/admin`: Admin panel frontend

## Remove

Remove or deprecate these features:

- coins
- referrals
- rewards
- gifts
- campaigns
- segments
- automations
- brands
- fragrance families
- perfume notes
- perfume gender filters
- UZS-specific naming
- visible Parfumbox branding

## Implement

Implement or adapt these features:

- Telegram auth
- Ansor Market branding
- products
- categories
- measurement units
- banners
- wishlist
- cart
- checkout
- max 3 saved addresses per user
- Kakao address search through backend only
- orders
- order status notifications
- admin dashboard
- admin orders
- product reviews
- product settings
- users
- finance
- broadcast messages
- inventory
- admin users with only Super Admin type

## Required docs

Create and maintain:

- `docs/ANSOR_MARKET_REQUIREMENTS.md`
- `docs/ANSOR_MARKET_IMPLEMENTATION_PLAN.md`
- `docs/ANSOR_MARKET_PROJECT_STATE.md`
- `docs/ANSOR_MARKET_TODO.md`

At the end of every major task, update:

- what was completed
- what files changed
- what still remains
- build/test status
- next exact steps

At the start of every new session, read:

1. `AGENTS.md`
2. `docs/ANSOR_MARKET_REQUIREMENTS.md`
3. `docs/ANSOR_MARKET_PROJECT_STATE.md`
4. `docs/ANSOR_MARKET_TODO.md`

Continue from the last checkpoint. Do not restart from scratch.

## Verification

Before considering work complete, run relevant commands:

```bash
pnpm install
pnpm --filter api build
pnpm --filter web build
pnpm --filter admin build
```
