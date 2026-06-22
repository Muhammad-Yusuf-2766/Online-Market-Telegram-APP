export type ProductSizeOption = {
  id: string;
  presetId: string;
  label: string;
  grams: number;
  priceUzs: number;
};

export const DEFAULT_CART_SIZE_ID = 'default';

export function cartLineKey(productId: string, sizeId: string): string {
  return `${productId}::${sizeId}`;
}

function sortedByGrams(sizes: ProductSizeOption[]): ProductSizeOption[] {
  return [...sizes].sort((a, b) => a.grams - b.grams);
}

/**
 * Smallest-gram option is the baseline. Returns savings when a larger pack is cheaper per gram.
 */
export function sizeSavingsVsSmallest(
  selected: ProductSizeOption,
  all: ProductSizeOption[],
): { perGramUzs: number; totalUzs: number } | null {
  const sorted = sortedByGrams(all);
  if (sorted.length < 2) {
    return null;
  }
  const baseline = sorted[0];
  if (baseline.id === selected.id) {
    return null;
  }
  const basePpg = baseline.priceUzs / baseline.grams;
  const selPpg = selected.priceUzs / selected.grams;
  const perGramUzs = Math.round(basePpg - selPpg);
  if (perGramUzs <= 0) {
    return null;
  }
  const totalUzs = Math.round(basePpg * selected.grams - selected.priceUzs);
  if (totalUzs <= 0) {
    return null;
  }
  return { perGramUzs, totalUzs };
}

/** Catalog “from” uses 10 g price when that option exists; otherwise minimum UZS among sizes. */
export function catalogListingDisplay(
  priceUzs: number,
  sizes: ProductSizeOption[] | null | undefined,
): { displayPrice: number; showFromPrefix: boolean } {
  if (!sizes?.length) {
    return { displayPrice: priceUzs, showFromPrefix: false };
  }
  const tenG = sizes.find((s) => s.id === '10g');
  const minPrice = Math.min(...sizes.map((s) => s.priceUzs));
  const maxPrice = Math.max(...sizes.map((s) => s.priceUzs));
  const displayPrice = tenG ? tenG.priceUzs : minPrice;
  const showFromPrefix = minPrice !== maxPrice;
  return { displayPrice, showFromPrefix };
}
