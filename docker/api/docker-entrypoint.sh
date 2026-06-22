#!/bin/sh
set -e
cd /app/apps/api

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set. On Railway, add: DATABASE_URL=\${{Postgres.DATABASE_URL}}"
  exit 1
fi

pnpm exec prisma generate

max_attempts="${DB_MIGRATE_MAX_ATTEMPTS:-30}"
attempt=0
until pnpm exec prisma migrate deploy; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge "$max_attempts" ]; then
    echo "ERROR: prisma migrate deploy failed after ${max_attempts} attempts"
    exit 1
  fi
  echo "Waiting for database... (${attempt}/${max_attempts})"
  sleep 2
done

pnpm exec prisma db seed || true
exec node dist/main.js
