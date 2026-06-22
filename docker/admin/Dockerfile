FROM node:22-bookworm-slim AS build
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY apps/admin/package.json apps/admin/
RUN pnpm install --frozen-lockfile --filter admin...
COPY apps/admin apps/admin
# Railway: set VITE_API_BASE_URL on the admin service before build (public API HTTPS URL).
ARG VITE_API_BASE_URL=http://localhost:3000
ARG GIT_SHA=unknown
ARG BUILD_TIME=unknown
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV GIT_SHA=$GIT_SHA
ENV BUILD_TIME=$BUILD_TIME
RUN pnpm --filter admin build

FROM nginx:alpine
COPY --from=build /app/apps/admin/dist /usr/share/nginx/html
COPY docker/nginx-spa.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
