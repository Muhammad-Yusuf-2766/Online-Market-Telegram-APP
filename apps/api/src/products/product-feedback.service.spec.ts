import { NotFoundException } from "@nestjs/common";
import { OrderStatus, ProductFeedbackStatus } from "@prisma/client";
import { Test } from "@nestjs/testing";
import { PrismaService } from "../prisma/prisma.service";
import { createPrismaMock, PrismaMock } from "../../test/setup/prisma-mock";
import { ProductFeedbackService } from "./product-feedback.service";

describe("ProductFeedbackService", () => {
  let service: ProductFeedbackService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = createPrismaMock();
    const moduleRef = await Test.createTestingModule({
      providers: [ProductFeedbackService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(ProductFeedbackService);
  });

  it("listPublic throws when product missing", async () => {
    prisma.product.findUnique.mockResolvedValue(null);
    await expect(service.listPublic("missing", { page: 1, pageSize: 10 })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("recomputeProductRatings updates product aggregate", async () => {
    prisma.productFeedback.aggregate.mockResolvedValue({ _avg: { stars: 4.5 } } as never);
    prisma.productFeedback.count.mockResolvedValue(2);
    prisma.product.update.mockResolvedValue({} as never);
    await service.recomputeProductRatings("prod-1");
    expect(prisma.product.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "prod-1" },
        data: { ratingCount: 2, ratingAvg: 4.5 },
      }),
    );
  });

  it("listPublic returns paginated approved feedback", async () => {
    prisma.product.findUnique.mockResolvedValue({ id: "prod-1" } as never);
    prisma.productFeedback.count.mockResolvedValue(1);
    prisma.productFeedback.findMany.mockResolvedValue([
      {
        id: "fb1",
        stars: 5,
        comment: "Great",
        createdAt: new Date("2026-05-01T10:00:00.000Z"),
        user: { firstName: "Anna" },
      },
    ] as never);

    const page = await service.listPublic("prod-1", { page: 1, pageSize: 10 });

    expect(page.total).toBe(1);
    expect(page.items).toHaveLength(1);
    expect(page.items[0].authorDisplay).toBe("Anna");
    expect(page.items[0].stars).toBe(5);
  });

  it("getSubmitEligibility requires order id", async () => {
    prisma.product.findUnique.mockResolvedValue({ id: "prod-1" } as never);

    const result = await service.getSubmitEligibility({ id: "u1" } as never, "prod-1", "   ");

    expect(result.canSubmit).toBe(false);
    expect(result.reason).toBe("ORDER_DETAIL_REQUIRED");
  });

  it("getSubmitEligibility blocks when feedback already approved", async () => {
    prisma.product.findUnique.mockResolvedValue({ id: "prod-1" } as never);
    prisma.productFeedback.findUnique.mockResolvedValue({
      status: ProductFeedbackStatus.APPROVED,
    } as never);

    const result = await service.getSubmitEligibility({ id: "u1" } as never, "prod-1", "order-1");

    expect(result.canSubmit).toBe(false);
    expect(result.reason).toBe("ALREADY_PUBLISHED");
  });

  it("getSubmitEligibility returns invalid when order line missing", async () => {
    prisma.product.findUnique.mockResolvedValue({ id: "prod-1" } as never);
    prisma.productFeedback.findUnique.mockResolvedValue(null);
    prisma.orderItem.findFirst.mockResolvedValue(null);

    const result = await service.getSubmitEligibility({ id: "u1" } as never, "prod-1", "order-1");

    expect(result.canSubmit).toBe(false);
    expect(result.reason).toBe("INVALID_ORDER_CONTEXT");
  });

  it("getSubmitEligibility returns not_delivered when order pending", async () => {
    prisma.product.findUnique.mockResolvedValue({ id: "prod-1" } as never);
    prisma.productFeedback.findUnique.mockResolvedValue(null);
    prisma.orderItem.findFirst.mockResolvedValue({
      order: { userId: "u1", status: OrderStatus.PENDING },
    } as never);

    const result = await service.getSubmitEligibility({ id: "u1" } as never, "prod-1", "order-1");

    expect(result.canSubmit).toBe(false);
    expect(result.reason).toBe("ORDER_NOT_DELIVERED");
  });

  it("getSubmitEligibility allows submit when delivered order matches user", async () => {
    prisma.product.findUnique.mockResolvedValue({ id: "prod-1" } as never);
    prisma.productFeedback.findUnique.mockResolvedValue(null);
    prisma.orderItem.findFirst.mockResolvedValue({
      order: { userId: "u1", status: OrderStatus.DELIVERED },
    } as never);

    const result = await service.getSubmitEligibility({ id: "u1" } as never, "prod-1", "order-1");

    expect(result.canSubmit).toBe(true);
    expect(result.reason).toBeNull();
  });
});
