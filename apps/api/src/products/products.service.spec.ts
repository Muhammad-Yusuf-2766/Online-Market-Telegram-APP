import { NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { PrismaService } from "../prisma/prisma.service";
import { OrderEventsService } from "../realtime/order-events.service";
import { createPrismaMock, PrismaMock } from "../../test/setup/prisma-mock";
import { ProductsService } from "./products.service";

describe("ProductsService", () => {
  let service: ProductsService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = createPrismaMock();
    const moduleRef = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: prisma },
        { provide: OrderEventsService, useValue: { emitProductUpdated: jest.fn() } },
      ],
    }).compile();
    service = moduleRef.get(ProductsService);
  });

  it("findOne throws when product missing", async () => {
    prisma.productSizePreset.findMany.mockResolvedValue([]);
    prisma.product.findUnique.mockResolvedValue(null);
    await expect(service.findOne("missing")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("findAll returns paginated products", async () => {
    prisma.productSizePreset.findMany.mockResolvedValue([]);
    prisma.product.count.mockResolvedValue(1);
    prisma.product.findMany.mockResolvedValue([
      {
        id: "p1",
        title: "Test",
        description: "",
        priceUzs: 100000,
        sizes: null,
        images: [],
        stock: 10,
        stockGrams: null,
        lowStockGramsThreshold: null,
        ratingAvg: null,
        ratingCount: 0,
        categoryId: null,
        brandId: null,
        familyId: null,
        gender: "UNISEX",
        notesTop: [],
        notesHeart: [],
        notesBase: [],
        isBestseller: false,
        isNewArrival: false,
        releaseYear: null,
        oldPriceUzs: null,
        discountPercent: null,
        lowStockThreshold: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as never);
    const result = await service.findAll({ page: 1, pageSize: 20 });
    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
  });

  const baseProductRow = {
    id: "p1",
    title: "Test",
    description: "",
    priceUzs: 100000,
    sizes: null,
    images: [],
    stock: 10,
    stockGrams: null,
    lowStockGramsThreshold: null,
    ratingAvg: null,
    ratingCount: 0,
    categoryId: "cat-1",
    brandId: "brand-1",
    familyId: "fam-1",
    gender: "UNISEX",
    notesTop: [],
    notesHeart: [],
    notesBase: [],
    isBestseller: false,
    isNewArrival: false,
    releaseYear: null,
    oldPriceUzs: null,
    discountPercent: null,
    lowStockThreshold: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("findOne returns public product when found", async () => {
    prisma.productSizePreset.findMany.mockResolvedValue([]);
    prisma.product.findUnique.mockResolvedValue(baseProductRow as never);
    const result = await service.findOne("p1");
    expect(result.id).toBe("p1");
    expect(result.title).toBe("Test");
  });

  it("highlights returns grouped lists", async () => {
    prisma.productSizePreset.findMany.mockResolvedValue([]);
    (prisma.product.findMany as jest.Mock).mockImplementation((args: any) => {
      const w = args?.where ?? {};
      if (w.isBestseller === true)
        return Promise.resolve([{ ...baseProductRow, id: "best", isBestseller: true }]);
      if (w.isNewArrival === true)
        return Promise.resolve([{ ...baseProductRow, id: "new", isNewArrival: true }]);
      if ("OR" in w) return Promise.resolve([{ ...baseProductRow, id: "sale", discountPercent: 10 }]);
      return Promise.resolve([]);
    });

    const result = await service.highlights();

    expect(result.bestseller).toHaveLength(1);
    expect(result.newArrivals).toHaveLength(1);
    expect(result.discounted).toHaveLength(1);
  });

  it("similar returns related products excluding base", async () => {
    prisma.productSizePreset.findMany.mockResolvedValue([]);
    prisma.product.findUnique.mockResolvedValue(baseProductRow as never);
    prisma.product.findMany.mockResolvedValue([{ ...baseProductRow, id: "p2" }] as never);

    const result = await service.similar("p1");

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("p2");
  });

  it("similar returns empty when base product missing", async () => {
    prisma.productSizePreset.findMany.mockResolvedValue([]);
    prisma.product.findUnique.mockResolvedValue(null);

    await expect(service.similar("missing")).resolves.toEqual([]);
  });
});
