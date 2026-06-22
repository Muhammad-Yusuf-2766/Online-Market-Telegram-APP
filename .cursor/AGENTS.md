# Parfumbox — Agent Brief

Monorepo for a **Telegram Mini App** storefront, **admin panel**, and **NestJS API**.

## Stack

| App | Path | Stack |
|-----|------|-------|
| API | `apps/api` | NestJS, Prisma, PostgreSQL, MinIO, JWT (user + admin) |
| Web | `apps/web` | Vite, React, RTK Query, Telegram UI, Telegram Mini Apps SDK |
| Admin | `apps/admin` | Vite, React, Mantine v7, RTK Query |

Package manager: **pnpm** workspaces (`pnpm-workspace.yaml`).

## Layout

```
apps/api/     # NestJS modules per domain (auth/, products/, orders/, …)
apps/web/     # FSD: app/, pages/, widgets/, features/, shared/
apps/admin/   # FSD-style: app/, pages/, features/, shared/
docs/         # Architecture and ops docs
```

## Commands (from repo root)

- Dev: `pnpm dev:api` | `pnpm dev:web` | `pnpm dev:admin`
- Test: `pnpm test` | `pnpm test:api` | `pnpm test:api:e2e`
- DB: `pnpm --filter api db:migrate:dev` | `db:generate` | `db:seed`
- Docker: `pnpm docker:up` | `pnpm docker:test-db`

## Docs

- [docs/BACKEND_ARCHITECTURE.md](../docs/BACKEND_ARCHITECTURE.md) — API modules, auth, Prisma
- [docs/FRONTEND_ARCHITECTURE.md](../docs/FRONTEND_ARCHITECTURE.md) — Web + admin conventions
- [docs/DEVOPS.md](../docs/DEVOPS.md) — Env vars, Docker, HTTPS, BotFather
- [docs/PRODUCT_ARCHITECTURE.md](../docs/PRODUCT_ARCHITECTURE.md) — Personas, journeys

## Hard rules

- Never commit secrets (`TELEGRAM_BOT_TOKEN`, JWT secrets, MinIO keys).
- Never put the bot token in `apps/web` or `apps/admin` (`VITE_*` is public).
- Do not hand-edit `dist/`, `coverage/`, `node_modules/`, or `pnpm-lock.yaml`.
