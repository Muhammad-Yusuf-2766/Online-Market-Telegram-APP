import { execSync } from "node:child_process";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

const API_ROOT = join(__dirname, "..", "..");

let migrated = false;

const DEFAULT_TEST_DATABASE_URL =
  "postgresql://postgres:postgres@localhost:5433/parfumbox_test?schema=public";

export function getTestDatabaseUrl(): string {
  return process.env.E2E_DATABASE_URL ?? process.env.DATABASE_URL ?? DEFAULT_TEST_DATABASE_URL;
}

export function prepareTestDb(): void {
  if (migrated) {
    return;
  }
  const databaseUrl = getTestDatabaseUrl();
  execSync("npx prisma migrate deploy", {
    cwd: API_ROOT,
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      DOTENV_CONFIG_OVERRIDE: "true",
    },
    stdio: "inherit",
  });
  migrated = true;
}

export async function truncateAll(prisma: PrismaClient): Promise<void> {
  await prisma.$executeRawUnsafe(`
    DO $$ DECLARE r RECORD;
    BEGIN
      FOR r IN (
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename NOT LIKE '_prisma%'
      ) LOOP
        EXECUTE 'TRUNCATE TABLE "' || r.tablename || '" CASCADE';
      END LOOP;
    END $$;
  `);
}

export function createTestPrisma(): PrismaClient {
  return new PrismaClient({
    datasources: { db: { url: getTestDatabaseUrl() } },
  });
}
