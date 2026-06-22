import { BadRequestException } from "@nestjs/common";
import type { ProductSizePreset } from "@prisma/client";
import {
  listingPriceFromSizeLines,
  normalizeSizeLines,
  orderItemTitleSnapshot,
  parseStoredSizeLines,
  resolveProductUnitPrice,
} from "./product-sizes.util";

const preset10g: ProductSizePreset = {
  id: "p10",
  slug: "10g",
  label: "10 g",
  grams: 10,
  sortOrder: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const preset5g: ProductSizePreset = {
  id: "p5",
  slug: "5g",
  label: "5 g",
  grams: 5,
  sortOrder: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const presetsById = new Map([
  [preset10g.id, preset10g],
  [preset5g.id, preset5g],
]);

describe("product-sizes.util", () => {
  describe("normalizeSizeLines", () => {
    it("rejects empty input", () => {
      expect(() => normalizeSizeLines([], presetsById)).toThrow(BadRequestException);
    });

    it("rejects unknown preset", () => {
      expect(() => normalizeSizeLines([{ presetId: "unknown", priceUzs: 100 }], presetsById)).toThrow(
        BadRequestException,
      );
    });

    it("rejects duplicate presets", () => {
      expect(() =>
        normalizeSizeLines(
          [
            { presetId: preset10g.id, priceUzs: 100 },
            { presetId: preset10g.id, priceUzs: 200 },
          ],
          presetsById,
        ),
      ).toThrow(BadRequestException);
    });
  });

  describe("parseStoredSizeLines", () => {
    it("returns null for invalid shapes", () => {
      expect(parseStoredSizeLines(null)).toBeNull();
      expect(parseStoredSizeLines("bad")).toBeNull();
      expect(parseStoredSizeLines([{ presetId: "x" }])).toBeNull();
    });

    it("parses valid array", () => {
      expect(parseStoredSizeLines([{ presetId: "p10", priceUzs: 50000 }])).toEqual([
        { presetId: "p10", priceUzs: 50000 },
      ]);
    });
  });

  describe("listingPriceFromSizeLines", () => {
    it("prefers 10g price when available", () => {
      const price = listingPriceFromSizeLines(
        [
          { presetId: preset5g.id, priceUzs: 30000 },
          { presetId: preset10g.id, priceUzs: 50000 },
        ],
        presetsById,
      );
      expect(price).toBe(50000);
    });
  });

  describe("resolveProductUnitPrice", () => {
    it("returns base price for products without sizes", () => {
      const result = resolveProductUnitPrice(120000, null, presetsById, undefined);
      expect(result.unitPriceUzs).toBe(120000);
    });

    it("requires sizeId when product has sizes", () => {
      const sizes = [{ presetId: preset10g.id, priceUzs: 50000 }];
      expect(() => resolveProductUnitPrice(0, sizes, presetsById, undefined)).toThrow(BadRequestException);
    });

    it("resolves price by size slug", () => {
      const sizes = [{ presetId: preset10g.id, priceUzs: 50000 }];
      const result = resolveProductUnitPrice(0, sizes, presetsById, "10g");
      expect(result.unitPriceUzs).toBe(50000);
    });
  });

  describe("orderItemTitleSnapshot", () => {
    it("appends size label when present", () => {
      expect(orderItemTitleSnapshot("Aventus", "10 g")).toBe("Aventus (10 g)");
      expect(orderItemTitleSnapshot("Aventus", null)).toBe("Aventus");
    });
  });
});
