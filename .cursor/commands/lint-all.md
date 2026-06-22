# Lint All

Run lint across all workspace apps and report results.

## Steps

1. From the repo root, run:
   ```
   pnpm -r run lint
   ```

2. Report per-app results (web, admin, api if applicable).

3. For each failure, show the file path, line number, and rule name.

4. Fix only lint errors in files you changed unless the user asks to fix all.
