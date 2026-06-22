# DevOps — Parfumbox

This document covers environments, environment variables, local containers, HTTPS requirements for Telegram, and a BotFather checklist. Adjust values to match your deployment target (VPS, PaaS, Kubernetes).

## Environments

| Environment | Purpose |
|-------------|---------|
| **development** | Local API, DB, MinIO; optional tunnel for Telegram testing |
| **staging** | Pre-production parity; separate secrets and database |
| **production** | Live traffic; strict secrets rotation and backups |

---

## Environment variables (representative)

Document the exact names in your `.env.example` once the apps exist. Typical groups:

### API (`apps/api`)

| Variable | Purpose |
|----------|---------|
| `NODE_ENV` | `development` \| `production` |
| `PORT` | HTTP listen port |
| `DATABASE_URL` | PostgreSQL connection string for Prisma |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | User JWT signing (Telegram flow) |
| `ADMIN_JWT_SECRET` / `ADMIN_JWT_EXPIRES_IN` | Admin JWT (if separate) |
| `TELEGRAM_BOT_TOKEN` | Required to validate Web App `initData` |
| `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_USE_SSL` | MinIO connection |
| `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY` | MinIO credentials |
| `MINIO_BUCKET` | Default bucket for uploads |
| `CORS_ORIGINS` | Comma-separated allowed origins for web and admin (non-production may use localhost) |

### Web / admin (Vite or similar)

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | Base URL of the API (HTTPS in production) |

Never commit real secrets; use CI/CD secret stores in production.

---

## Containers (local development)

A `docker-compose` stack often includes:

- **PostgreSQL** — primary database for Prisma.
- **MinIO** — S3-compatible storage for product images.
- **API** — optional: run NestJS in Docker or on the host with `DATABASE_URL` pointing at the compose network.

Optional later: **reverse proxy** (nginx/Caddy) terminating TLS in staging/production.

### Typical workflow

1. Copy `.env.example` to `.env` and fill placeholders.
2. `docker compose up -d` for Postgres and MinIO.
3. Run Prisma migrations against `DATABASE_URL`.
4. Start the API; seed demo data if a seed script exists.

---

## HTTPS and Telegram Web Apps

- Telegram **requires** the mini app to be served over **HTTPS** in production (valid certificate).
- The Web App URL configured in BotFather must match the deployed origin (scheme, host, path if applicable).
- For local development, tools such as HTTPS tunnels (e.g. ngrok, Cloudflare Tunnel) can expose a temporary HTTPS URL for testing `initData` in a real Telegram client.

### Local testing with ngrok (Parfumbox `apps/web`)

1. Install [ngrok](https://ngrok.com/download) and sign in so you get a stable-enough HTTPS URL (free tier may show an interstitial page unless you use a paid reserved domain).
2. In one terminal, from the repo root: `pnpm --filter web dev` (Vite listens on port **5173** with `allowedHosts` enabled for tunnel hostnames).
3. In another terminal: `ngrok http 5173` (or `ngrok http http://localhost:5173`).
4. Copy the **https** forwarding URL ngrok prints (for example `https://abcd-12-34-56-78.ngrok-free.app`).
5. In [@BotFather](https://t.me/BotFather), open your bot → **Bot Settings** → **Menu Button** → **Configure menu button** (or the Mini App / Web App URL setting) and set the URL to that HTTPS origin (path `/` is fine).
6. Open your bot in Telegram, tap the **menu** button (or your Web App entry point), and the Mini App should load your local Vite app through the tunnel.

**Secrets:** the **bot token** is only for your **API** (validating `initData`). Never put `TELEGRAM_BOT_TOKEN` in `VITE_*` variables or commit it — those values are exposed to the browser. If a token was pasted into chat or committed, **revoke it in BotFather** and create a new one.

---

## Railway

Deploy as **four logical pieces** on [Railway](https://railway.com): PostgreSQL (plugin) plus three Docker services (`api`, `web`, `admin`). Railway does not run the root `docker-compose.yml` as a full stack; it only builds services from Dockerfiles unless you import a compose file manually.

| Piece | Source |
|-------|--------|
| API | `docker/api/Dockerfile`, config `railway/api.json` |
| Web (mini app) | `docker/web/Dockerfile`, config `railway/web.json` |
| Admin | `docker/admin/Dockerfile`, config `railway/admin.json` |
| PostgreSQL | Railway **Database → PostgreSQL** |

On each app service set `RAILWAY_CONFIG_FILE` to the matching file under `railway/`. Wire `DATABASE_URL=${{Postgres.DATABASE_URL}}` on **api** (adjust `Postgres` to your DB service name). Set `VITE_API_BASE_URL` on **web** and **admin** to the public API URL before build.

Variable templates and step-by-step setup: [railway/README.md](../railway/README.md).

### Railway checklist

1. Add PostgreSQL; reference its URL on the api service.
2. Set `RAILWAY_CONFIG_FILE` and api secrets (`JWT_*`, `TELEGRAM_BOT_TOKEN`, `CORS_ORIGINS`, `MINIO_*`).
3. Set `VITE_API_BASE_URL` on web and admin; redeploy frontends after API domain is known.
4. Generate public HTTPS domains; update BotFather Web App URL to the web origin.
5. Provision object storage (MinIO template or S3-compatible) for admin image uploads.

---

## Production deployment notes

- Run the API behind HTTPS (load balancer or reverse proxy).
- Use managed PostgreSQL or regular backups and point-in-time recovery where available.
- Restrict MinIO bucket policies: public read only for intended asset paths, or serve images through the API/CDN.
- Rotate JWT secrets and bot token on compromise; prefer short JWT lifetimes and refresh strategy if implemented later.

---

## BotFather checklist

1. Create a bot with [@BotFather](https://t.me/BotFather) and obtain the **bot token** (used only on the server for validation and optional Bot API calls).
2. Set the **Web App URL** (Menu Button or direct link) to your **production** HTTPS origin of `apps/web`.
3. Confirm **domain** requirements: Telegram may require you to verify the domain linked to the Web App (follow current Telegram docs for Web Apps).
4. Document the **staging** Web App URL separately if you test against staging from Telegram (separate bot or same bot with URL changes — be careful not to break production testers).

---

## Summary

Keep secrets out of git, run Postgres and MinIO in compose for dev, and treat HTTPS and BotFather URL configuration as mandatory steps for a working Telegram Mini App in production.
