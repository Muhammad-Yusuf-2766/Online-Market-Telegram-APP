# Test API

Run API tests and summarize results.

## Steps

1. If the user provided a test name pattern, run:
   ```
   pnpm --filter api test -- <pattern>
   ```
   Otherwise run all unit tests:
   ```
   pnpm --filter api test
   ```

2. If the user asked for e2e tests, ensure the test DB is up (`pnpm docker:test-db`) then run:
   ```
   pnpm test:api:e2e
   ```

3. Report: total passed/failed, failing test names, and the first error message for each failure.

4. If tests fail due to missing Prisma client, suggest `pnpm --filter api db:generate`.
