import {
  catalogListingDisplay,
  type ProductSizeOption,
} from './productSizes';

export type ProductDiscountDisplay = {
  currentPrice: number;
  oldPrice: number;
  percent: number;
};

type ProductDiscountFields = {
  priceUzs: number;
  oldPriceUzs?: number | null;
  discountPercent?: number | null;
  sizes?: ProductSizeOption[] | null;
};

/**
 * Resolves storefront discount display from product-level fields.
 * Supports percent-only (admin "Chegirma %") by deriving old price from the listing price.
 */
export function resolveProductDiscount(
  product: ProductDiscountFields,
  currentPriceOverride?: number,
): ProductDiscountDisplay | null {
  const { displayPrice } = catalogListingDisplay(
    product.priceUzs,
    product.sizes,
  );
  const currentPrice = currentPriceOverride ?? displayPrice;
  const storedPercent = Math.max(0, Math.floor(product.discountPercent ?? 0));
  let oldPrice = product.oldPriceUzs ?? null;

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
