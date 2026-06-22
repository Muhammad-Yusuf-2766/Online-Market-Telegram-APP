import { BadRequestException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { PrismaService } from "../prisma/prisma.service";
import { createPrismaMock, PrismaMock } from "../../test/setup/prisma-mock";
import { PromotionsService } from "./promotions.service";

describe("PromotionsService", () => {
  let service: PromotionsService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = createPrismaMock();
    const moduleRef = await Test.createTestingModule({
      providers: [PromotionsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(PromotionsService);
  });

  it("throws when promo code is invalid", async () => {
    prisma.promoCode.findUnique.mockResolvedValue(null);
    await expect(service.validate("MISSING", 10000)).rejects.toBeInstanceOf(BadRequestException);
  });

  it("calculates percent discount", async () => {
    prisma.promoCode.findUnique.mockResolvedValue({
      id: "p1",
      code: "SAVE10",
      kind: "PERCENT",
      value: 10,
      isActive: true,
      startsAt: null,
      endsAt: null,
      minOrderUzs: null,
      usageLimit: null,
      perUserLimit: null,
    } as never);
    prisma.promoRedemption.count.mockResolvedValue(0);
    const result = await service.validate("save10", 100000);
    expect(result.discountUzs).toBe(10000);
  });

  it("throws when min order not reached", async () => {
    prisma.promoCode.findUnique.mockResolvedValue({
      id: "p1",
      code: "BIG",
      kind: "FIXED",
      value: 5000,
      isActive: true,
      startsAt: null,
      endsAt: null,
      minOrderUzs: 50000,
      usageLimit: null,
      perUserLimit: null,
    } as never);
    await expect(service.validate("BIG", 1000)).rejects.toBeInstanceOf(BadRequestException);
  });

  it("listPromoCodes delegates to prisma findMany", async () => {
    prisma.promoCode.findMany.mockResolvedValue([{ id: "pc1", code: "X" }] as never);

    const rows = await service.listPromoCodes();

    expect(prisma.promoCode.findMany).toHaveBeenCalledWith({ orderBy: { createdAt: "desc" } });
    expect(rows).toHaveLength(1);
  });

  it("createPromoCode normalizes code and passes dates", async () => {
    prisma.promoCode.create.mockResolvedValue({ id: "new" } as never);

    await service.createPromoCode({
      code: "  summer21 ",
      kind: "PERCENT",
      value: 15,
      minOrderUzs: 10000,
      startsAt: "2026-06-01T00:00:00.000Z",
      endsAt: "2026-06-30T23:59:59.000Z",
      usageLimit: 100,
      perUserLimit: 1,
    });

    expect(prisma.promoCode.create).toHaveBeenCalledWith({
      data: {
        code: "SUMMER21",
        kind: "PERCENT",
        value: 15,
        minOrderUzs: 10000,
        startsAt: new Date("2026-06-01T00:00:00.000Z"),
        endsAt: new Date("2026-06-30T23:59:59.000Z"),
        usageLimit: 100,
        perUserLimit: 1,
      },
    });
  });
});
