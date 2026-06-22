-- Per-product gram-based inventory tracking (parfum is sold in ml/grams, not pieces).
ALTER TABLE "Product"
  ADD COLUMN "stockGrams" INTEGER,
  ADD COLUMN "lowStockGramsThreshold" INTEGER;

-- Optional: gram delta on stock movements (positive on restock, negative on sale).
ALTER TABLE "StockMovement"
  ADD COLUMN "deltaGrams" INTEGER NOT NULL DEFAULT 0;
