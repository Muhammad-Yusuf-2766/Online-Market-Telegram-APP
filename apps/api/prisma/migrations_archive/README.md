# Prisma Migration Archive

This folder keeps historical Parfumbox migrations out of Prisma's active
`prisma/migrations` deploy path.

Ansor Market is currently treated as a clean local/dev refactor without a
production Parfumbox data migration requirement. The active migration chain is
therefore a single fresh Ansor Market baseline in:

- `../migrations/20260622193000_ansor_market_baseline`

If production Parfumbox data migration is needed later, create a separate
destructive/transform migration plan instead of re-enabling these historical
migrations ahead of the Ansor baseline.
