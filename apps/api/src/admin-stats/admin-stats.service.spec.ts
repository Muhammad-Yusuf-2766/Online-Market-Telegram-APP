import { BadRequestException } from "@nestjs/common";
import { OrderStatus } from "@prisma/client";
import { Test } from "@nestjs/testing";
import { PrismaService } from "../prisma/prisma.service";
import { createPrismaMock, PrismaMock } from "../../test/setup/prisma-mock";
import { AdminStatsService } from "./admin-stats.service";

describe("AdminStatsService", () => {
  let service: AdminStatsService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = createPrismaMock();

    prisma.product.count.mockResolvedValue(0);
    prisma.order.count.mockResolvedValue(0);
    prisma.user.count.mockResolvedValue(0);
    prisma.order.findMany.mockResolvedValue([]);
    prisma.user.findMany.mockResolvedValue([]);
    prisma.analyticsEvent.findMany.mockResolvedValue([]);
    prisma.order.aggregate.mockResolvedValue({
      _count: { id: 0 },
      _sum: { cashPaidUzs: 0, coinsAppliedUzs: 0 },
    } as never);
    (prisma.order.groupBy as jest.Mock).mockResolvedValue([]);
    prisma.orderItem.findMany.mockResolvedValue([]);
    prisma.product.findMany.mockResolvedValue([]);
    (prisma.user.groupBy as jest.Mock).mockResolvedValue([]);
    prisma.user.aggregate.mockResolvedValue({ _sum: { coinBalance: 0 } } as never);
    prisma.product.aggregate.mockResolvedValue({
      _avg: { priceUzs: 0 },
      _sum: { stockGrams: 0, stock: 0 },
    } as never);
    prisma.product.count.mockResolvedValue(0);
    prisma.wishlist.count.mockResolvedValue(0);
    prisma.cartItem.count.mockResolvedValue(0);
    prisma.referralReward.count.mockResolvedValue(0);
    prisma.productFeedback.count.mockResolvedValue(0);

    const moduleRef = await Test.createTestingModule({
      providers: [AdminStatsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(AdminStatsService);
  });

  describe("getDashboardStats", () => {
    it("throws when date range is reversed", async () => {
      await expect(service.getDashboardStats("2026-05-10", "2026-05-01")).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it("computes totals from finance rows", async () => {
      (prisma.order.findMany as jest.Mock).mockImplementation((args: any) => {
        if (args.select?.cashPaidUzs !== undefined) {
          return Promise.resolve([
            {
              createdAt: new Date("2026-05-01T12:00:00.000Z"),
              status: OrderStatus.PENDING,
              cashPaidUzs: 1000,
              coinsAppliedUzs: 200,
            },
            {
              createdAt: new Date("2026-05-01T13:00:00.000Z"),
              status: OrderStatus.CANCELLED,
              cashPaidUzs: 500,
              coinsAppliedUzs: 0,
            },
          ] as never[]);
        }
        if (args.select && Object.keys(args.select).length === 1 && args.select.createdAt) {
          return Promise.resolve([{ createdAt: new Date("2026-05-01T10:00:00.000Z") }] as never[]);
        }
        return Promise.resolve([]);
      });

      (prisma.user.findMany as jest.Mock).mockImplementation((args: any) => {
        if (args.where?.campaignId) {
          return Promise.resolve([{ createdAt: new Date("2026-05-01T08:00:00.000Z") }] as never[]);
        }
        return Promise.resolve([{ createdAt: new Date("2026-05-01T09:00:00.000Z") }] as never[]);
      });

      prisma.product.count.mockResolvedValue(42);
      prisma.order.count.mockResolvedValue(2);
      prisma.user.count.mockResolvedValue(3);

      const stats = await service.getDashboardStats("2026-05-01", "2026-05-01");

      expect(stats.totals.productCount).toBe(42);
      expect(stats.totals.cashNonCancelledUzs).toBe(1000);
      expect(stats.totals.coinsAppliedNonCancelledUzs).toBe(200);
      expect(stats.totals.cancelledOrdersInRange).toBe(1);
      expect(stats.totals.campaignSignupsInRange).toBe(1);
      expect(stats.series).toHaveLength(1);
    });
  });

  describe("getAovLtv", () => {
    it("returns zeros when there are no orders", async () => {
      prisma.order.aggregate.mockResolvedValue({
        _count: { id: 0 },
        _sum: { cashPaidUzs: 0, coinsAppliedUzs: 0 },
      } as never);
      prisma.order.count.mockResolvedValue(0);

      const result = await service.getAovLtv("2026-05-01", "2026-05-02");

      expect(result.ordersCount).toBe(0);
      expect(result.aovUzs).toBe(0);
      expect(result.ltvUzs).toBe(0);
    });
  });

  describe("getOverview", () => {
    it("aggregates dashboard overview sections", async () => {
      prisma.user.count.mockResolvedValueOnce(100).mockResolvedValueOnce(40);
      (prisma.user.groupBy as jest.Mock).mockResolvedValue([
        { tier: "BRONZE", _count: { _all: 60 } },
        { tier: "GOLD", _count: { _all: 40 } },
      ]);
      prisma.analyticsEvent.findMany.mockResolvedValue([{ userId: "u1" }, { userId: "u2" }] as never);
      prisma.user.aggregate.mockResolvedValue({ _sum: { coinBalance: 5000 } } as never);
      prisma.order.count.mockResolvedValue(25);
      (prisma.order.groupBy as jest.Mock).mockResolvedValue([
        { status: OrderStatus.PENDING, _count: { _all: 5 } },
        { status: OrderStatus.DELIVERED, _count: { _all: 10 } },
      ]);
      prisma.product.count
        .mockResolvedValueOnce(200)
        .mockResolvedValueOnce(12)
        .mockResolvedValueOnce(8)
        .mockResolvedValueOnce(30)
        .mockResolvedValueOnce(15)
        .mockResolvedValueOnce(22);
      prisma.product.aggregate
        .mockResolvedValueOnce({ _avg: { priceUzs: 120000 }, _sum: {} } as never)
        .mockResolvedValueOnce({ _sum: { stockGrams: 1000 } } as never)
        .mockResolvedValueOnce({ _sum: { stock: 500 } } as never);
      prisma.product.findMany.mockResolvedValue([
        { stockGrams: 0, stock: null, lowStockGramsThreshold: null, lowStockThreshold: null },
      ] as never);
      prisma.wishlist.count.mockResolvedValue(300);
      prisma.cartItem.count.mockResolvedValue(120);
      prisma.referralReward.count.mockResolvedValue(45);
      prisma.productFeedback.count.mockResolvedValue(7);

      const overview = await service.getOverview();

      expect(overview.users.total).toBe(100);
      expect(overview.users.tierDistribution.BRONZE).toBe(60);
      expect(overview.users.activeLast7d).toBe(2);
      expect(overview.orders.pendingCount).toBe(5);
      expect(overview.orders.deliveredCount).toBe(10);
      expect(overview.catalog.productCount).toBe(200);
      expect(overview.catalog.bestsellerCount).toBe(12);
      expect(overview.inventory.lowStockCount).toBe(1);
      expect(overview.engagement.wishlistCount).toBe(300);
      expect(overview.engagement.productFeedbackPending).toBe(7);
    });
  });
});
