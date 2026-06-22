import { Test } from "@nestjs/testing";
import { PrismaService } from "../prisma/prisma.service";
import { createPrismaMock, PrismaMock } from "../../test/setup/prisma-mock";
import { InventoryService } from "./inventory.service";

describe("InventoryService", () => {
  let service: InventoryService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = createPrismaMock();
    const moduleRef = await Test.createTestingModule({
      providers: [InventoryService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(InventoryService);
  });

  it("lowStock filters gram-tracked products below threshold", async () => {
    prisma.product.findMany.mockResolvedValue([
      { stockGrams: 5, lowStockGramsThreshold: 10 },
      { stockGrams: 50, lowStockGramsThreshold: 10 },
    ] as never);
    const result = await service.lowStock();
    expect(result).toHaveLength(1);
    expect(result[0].stockGrams).toBe(5);
  });

  it("summary aggregates inventory counts", async () => {
    prisma.product.count.mockResolvedValue(10);
    prisma.product.aggregate.mockResolvedValue({ _sum: { stockGrams: 100, stock: 50 } } as never);
    const result = await service.summary();
    expect(result.productCount).toBe(10);
    expect(result.totalStockGrams).toBe(100);
  });

  it("movements paginates stock movements", async () => {
    prisma.stockMovement.count.mockResolvedValue(2);
    prisma.stockMovement.findMany.mockResolvedValue([
      {
        id: "m1",
        delta: 0,
        deltaGrams: -10,
        reason: "sale",
        createdAt: new Date(),
        product: { title: "Scent" },
      },
    ] as never);

    const page = await service.movements(2, 10);

    expect(page.total).toBe(2);
    expect(page.page).toBe(2);
    expect(page.items).toHaveLength(1);
    expect(prisma.stockMovement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 }),
    );
  });

  it("adjustGrams updates stock inside transaction", async () => {
    prisma.product.findUniqueOrThrow.mockResolvedValue({ id: "p1", stockGrams: 100 } as never);
    const txProduct = { update: jest.fn().mockResolvedValue({}) };
    const txMovement = { create: jest.fn().mockResolvedValue({}) };
    const txMock = {
      product: txProduct,
      stockMovement: txMovement,
    };
    prisma.$transaction.mockImplementation((fn: any) => fn(txMock));

    const result = await service.adjustGrams("p1", -40, "manual");

    expect(result.stockGrams).toBe(60);
    expect(txProduct.update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { stockGrams: 60 },
    });
    expect(txMovement.create).toHaveBeenCalledWith({
      data: { productId: "p1", delta: 0, deltaGrams: -40, reason: "manual" },
    });
  });

  it("adjustGrams rejects negative resulting stock", async () => {
    prisma.product.findUniqueOrThrow.mockResolvedValue({ id: "p1", stockGrams: 10 } as never);

    await expect(service.adjustGrams("p1", -20, "x")).rejects.toThrow(
      "stockGrams cannot go below 0",
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
