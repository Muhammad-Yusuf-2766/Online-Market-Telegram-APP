const DEFAULT_TEST_DATABASE_URL =
  "postgresql://postgres:postgres@localhost:5433/parfumbox_test?schema=public";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = process.env.E2E_DATABASE_URL ?? DEFAULT_TEST_DATABASE_URL;
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-jwt-secret";
process.env.ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET ?? "test-admin-jwt-secret";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "7d";
process.env.ADMIN_JWT_EXPIRES_IN = process.env.ADMIN_JWT_EXPIRES_IN ?? "1d";
process.env.TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "test-bot-token";
process.env.TELEGRAM_INIT_DATA_MAX_AGE_SEC = process.env.TELEGRAM_INIT_DATA_MAX_AGE_SEC ?? "86400";
