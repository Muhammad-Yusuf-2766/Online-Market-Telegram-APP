# Build from repository root: docker compose build api
FROM node:22-bookworm-slim AS build
ARG GIT_SHA=unknown
ARG BUILD_TIME=unknown
ENV GIT_SHA=$GIT_SHA
ENV BUILD_TIME=$BUILD_TIME
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY apps/admin/package.json apps/admin/
RUN pnpm install --frozen-lockfile --filter api...
COPY apps/api apps/api
WORKDIR /app/apps/api
RUN pnpm run build

FROM node:22-bookworm-slim AS runner
ARG GIT_SHA=unknown
ARG BUILD_TIME=unknown
ENV GIT_SHA=$GIT_SHA
ENV BUILD_TIME=$BUILD_TIME
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY apps/admin/package.json apps/admin/
RUN pnpm install --frozen-lockfile --filter api...
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
COPY docker/api/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
WORKDIR /app/apps/api
ENV NODE_ENV=production
EXPOSE 3000
ENTRYPOINT ["/bin/sh", "/docker-entrypoint.sh"]
