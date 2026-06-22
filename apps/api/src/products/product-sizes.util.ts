import { BadRequestException } from "@nestjs/common";
import type { ProductSizePreset } from "@prisma/client";
import type { ProductSizeLineDto } from "./dto/product-size-line.dto";

export type StoredProductSizeLine = { presetId: string; priceUzs: number };

export type PublicSizeLine = {
  id: string;
  presetId: string;
  label: string;
  grams: number;
  priceUzs: number;
};

export function normalizeSizeLines(
  input: ProductSizeLineDto[],
  presetsById: Map<string, ProductSizePreset>,
): StoredProductSizeLine[] {
  if (input.length === 0) {
    throw new BadRequestException("sizes must not be empty when provided");
  }
  const ids = new Set<string>();
  const out: StoredProductSizeLine[] = [];
  for (const row of input) {
    if (!presetsById.has(row.presetId)) {
      throw new BadRequestException(`Unknown size preset: ${row.presetId}`);
    }
    if (ids.has(row.presetId)) {
      throw new BadRequestException("Duplicate preset in sizes");
    }
    ids.add(row.presetId);
    out.push({ presetId: row.presetId, priceUzs: row.priceUzs });
  }
  return out;
}

export function parseStoredSizeLines(raw: unknown): StoredProductSizeLine[] | null {
  if (raw === null || raw === undefined) {
    return null;
  }
  if (!Array.isArray(raw)) {
    return null;
  }
  const out: StoredProductSizeLine[] = [];
  for (const el of raw) {
    if (!el || typeof el !== "object") {
      return null;
    }
    const o = el as Record<string, unknown>;
    if (typeof o.presetId !== "string" || typeof o.priceUzs !== "number") {
      return null;
    }
    out.push({ presetId: o.presetId, priceUzs: o.priceUzs });
  }
  return out.length === 0 ? null : out;
}

export function listingPriceFromSizeLines(
  lines: StoredProductSizeLine[],
  presetsById: Map<string, ProductSizePreset>,
): number {
  const tenG = lines.find((l) => presetsById.get(l.presetId)?.slug === "10g");
  if (tenG) {
    return tenG.priceUzs;
  }
  return Math.min(...lines.map((l) => l.priceUzs));
}

export function expandSizesForResponse(
  lines: StoredProductSizeLine[] | null,
  presetsById: Map<string, ProductSizePreset>,
): PublicSizeLine[] | null {
  if (!lines?.length) {
    return null;
  }
  return lines
    .map((l) => {
      const preset = presetsById.get(l.presetId);
      if (!preset) {
        return null;
      }
      return {
        id: preset.slug,
        presetId: preset.id,
        label: preset.label,
        grams: preset.grams,
        priceUzs: l.priceUzs,
      };
    })
    .filter((x): x is PublicSizeLine => x !== null);
}

export type ResolvedUnitPrice = {
  unitPriceUzs: number;
  sizeIdForDb: string | null;
  sizeLabelSnapshot: string | null;
  gramsSnapshot: number | null;
};

export function resolveProductUnitPrice(
  basePriceUzs: number,
  sizesJson: unknown,
  presetById: Map<string, ProductSizePreset>,
  sizeId: string | undefined,
): ResolvedUnitPrice {
  const lines = parseStoredSizeLines(sizesJson);
  if (!lines) {
    if (sizeId !== undefined && sizeId !== "" && sizeId !== "default") {
      throw new BadRequestException("This product does not use sizes");
    }
    return {
      unitPriceUzs: basePriceUzs,
      sizeIdForDb: null,
      sizeLabelSnapshot: null,
      gramsSnapshot: null,
    };
  }
  if (!sizeId || sizeId === "default") {
    throw new BadRequestException("sizeId is required for this product");
  }
  for (const line of lines) {
    const preset = presetById.get(line.presetId);
    if (!preset) {
      continue;
    }
    if (preset.slug === sizeId) {
      return {
        unitPriceUzs: line.priceUzs,
        sizeIdForDb: preset.slug,
        sizeLabelSnapshot: preset.label,
        gramsSnapshot: preset.grams,
      };
    }
  }
  throw new BadRequestException("Invalid product size");
}

export function orderItemTitleSnapshot(productTitle: string, sizeLabel: string | null): string {
  return sizeLabel ? `${productTitle} (${sizeLabel})` : productTitle;
}
