export type ProductDiscountDisplay = {
  currentPrice: number;
  oldPrice: number;
  percent: number;
};

type ProductDiscountFields = {
  priceKrw: number;
  oldPriceKrw?: number | null;
  discountPercent?: number | null;
};

/**
 * Resolves storefront discount display from product-level fields.
 * Supports percent-only (admin "Chegirma %") by deriving old price from the listing price.
 */
export function resolveProductDiscount(
  product: ProductDiscountFields,
  currentPriceOverride?: number,
): ProductDiscountDisplay | null {
  const currentPrice = currentPriceOverride ?? product.priceKrw;
  const storedPercent = Math.max(0, Math.floor(product.discountPercent ?? 0));
  let oldPrice = product.oldPriceKrw ?? null;

  if (storedPercent > 0 && storedPercent < 100) {
    const derivedOld = Math.round(currentPrice / (1 - storedPercent / 100));
    if (oldPrice == null || oldPrice <= currentPrice) {
      oldPrice = derivedOld;
    }
  }

  if (oldPrice != null && oldPrice > currentPrice) {
    const percent =
      storedPercent > 0
        ? storedPercent
        : Math.round(((oldPrice - currentPrice) / oldPrice) * 100);
    if (percent > 0) {
      return { currentPrice, oldPrice, percent };
    }
  }

  if (storedPercent > 0 && storedPercent < 100) {
    return {
      currentPrice,
      oldPrice: Math.round(currentPrice / (1 - storedPercent / 100)),
      percent: storedPercent,
    };
  }

  return null;
}
