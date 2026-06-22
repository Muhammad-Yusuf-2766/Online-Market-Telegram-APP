# Parfumbox

Parfumbox is a monorepo for a **Telegram Mini App** storefront, an **admin panel**, and a **NestJS API** (with Prisma and MinIO). The repository is organized as a workspace containing `apps/web`, `apps/admin`, and `apps/api` once scaffolded.

## Documentation

| Document | Description |
|----------|-------------|
| [docs/FRONTEND_ARCHITECTURE.md](docs/FRONTEND_ARCHITECTURE.md) | Mini app and admin: stack, routing, state, RTK Query, theming, layouts |
| [docs/BACKEND_ARCHITECTURE.md](docs/BACKEND_ARCHITECTURE.md) | NestJS modules, auth, Prisma model outline, MinIO, API surface |
| [docs/DEVOPS.md](docs/DEVOPS.md) | Environments, env vars, Docker Compose, HTTPS, BotFather checklist |
| [docs/URL_CONFIGURATION.md](docs/URL_CONFIGURATION.md) | API ↔ web ↔ admin URL contract (REST + Socket.IO), per environment |
| [railway/README.md](railway/README.md) | Railway.com: Postgres, api/web/admin services, env templates |
| [docs/PRODUCT_ARCHITECTURE.md](docs/PRODUCT_ARCHITECTURE.md) | Personas, user journeys, feature alignment with pages |
| [docs/RELEASING.md](docs/RELEASING.md) | Semantic versioning, Conventional Commits, release-please |

## Releases

Version **1.0.0** is the current baseline. New versions are cut automatically via [release-please](https://github.com/googleapis/release-please) when Release PRs merge to `main`. See [docs/RELEASING.md](docs/RELEASING.md) and [GitHub Releases](https://github.com/asadulloh-pro/parfumbox/releases).

## Monorepo layout (target)

```
apps/
  web/      # Telegram Mini App (Vite + React)
  admin/    # Admin panel (Vite + React)
  api/      # NestJS + Prisma
docs/       # Architecture and operations documentation
```

The repo uses **pnpm** workspaces (`pnpm-workspace.yaml`). From the repo root: `pnpm install`, then `pnpm run dev:web` or `pnpm run dev:admin` to start each Vite app.

To expose the mini app over HTTPS for Telegram (after `ngrok config add-authtoken …`): `pnpm run dev:web:tunnel` (Vite on port 5173 + ngrok). Paste the printed **https** URL into BotFather as the Web App / menu button URL. Do **not** put your Telegram bot token in the web app — it belongs only in the API server env (see `docs/DEVOPS.md`).

## Next steps

Follow the implementation roadmap: scaffold frontends and API, add Prisma schema and migrations, implement auth and CRUD, then wire RTK Query on both clients. See the linked docs for conventions and environment expectations.
