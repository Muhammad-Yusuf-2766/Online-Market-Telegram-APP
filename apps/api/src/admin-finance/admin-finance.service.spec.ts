import { BadRequestException } from "@nestjs/common";
import { OrderStatus, UserTier } from "@prisma/client";
import { Test } from "@nestjs/testing";
import { PrismaService } from "../prisma/prisma.service";
import { createPrismaMock, PrismaMock } from "../../test/setup/prisma-mock";
import { AdminFinanceService } from "./admin-finance.service";

describe("AdminFinanceService", () => {
  let service: AdminFinanceService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = createPrismaMock();

    prisma.order.findMany.mockResolvedValue([]);
    prisma.promoRedemption.findMany.mockResolvedValue([]);
    prisma.coinLedgerEntry.findMany.mockResolvedValue([]);
    prisma.user.aggregate.mockResolvedValue({ _sum: { coinBalance: 1000 } } as never);

    const moduleRef = await Test.createTestingModule({
      providers: [AdminFinanceService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(AdminFinanceService);
  });

  describe("getReport", () => {
    it("throws when `from` is after `to`", async () => {
      await expect(service.getReport("2026-05-10", "2026-05-01")).rejects.toBeInstanceOf(BadRequestException);
    });

    it("returns KPI bundle for empty data", async () => {
      const report = await service.getReport("2026-05-01", "2026-05-02", false);

      expect(report.range.days).toBe(2);
      expect(report.kpis.ordersCount).toBe(0);
      expect(report.series.length).toBe(2);
      expect(report.coinEconomy.outstandingLiabilityNow).toBe(1000);
      expect(report.previousRange).toBeUndefined();
    });

    it("includes previous KPIs when compare is enabled", async () => {
      const report = await service.getReport("2026-05-01", "2026-05-02", true);

      expect(report.previousRange).toBeDefined();
      expect(report.kpisPrev).toBeDefined();
    });

    it("aggregates non-cancelled orders into KPIs", async () => {
      (prisma.order.findMany as jest.Mock).mockImplementation((args: any) => {
        if (args.where?.promoCodeId?.not === null) {
          return Promise.resolve([{ promoCodeId: "pc1" }] as never[]);
        }
        return Promise.resolve([
          {
            createdAt: new Date("2026-05-01T12:00:00.000Z"),
            status: OrderStatus.DELIVERED,
            userId: "u1",
            subtotalUzs: 10_000,
            cashPaidUzs: 7000,
            coinsAppliedUzs: 3000,
            discountUzs: 500,
            user: {
              tier: UserTier.GOLD,
              telegramId: "tg",
              telegramUsername: null,
              firstName: "A",
              lastName: "B",
            },
          },
          {
            createdAt: new Date("2026-05-01T15:00:00.000Z"),
            status: OrderStatus.CANCELLED,
            userId: "u2",
            subtotalUzs: 5000,
            cashPaidUzs: 2000,
            coinsAppliedUzs: 0,
            discountUzs: 0,
            user: {
              tier: UserTier.BRONZE,
              telegramId: "tg2",
              telegramUsername: null,
              firstName: null,
              lastName: null,
            },
          },
        ] as never[]);
      });

      const report = await service.getReport("2026-05-01", "2026-05-01", false);

      expect(report.kpis.ordersCount).toBe(1);
      expect(report.kpis.cancelledCount).toBe(1);
      expect(report.kpis.grossRevenueUzs).toBe(10_000);
      expect(report.byStatus.find((r) => r.status === OrderStatus.CANCELLED)?.count).toBe(1);
    });
  });

  describe("getSeriesCsv", () => {
    it("returns CSV with header row", async () => {
      const { filename, content } = await service.getSeriesCsv("2026-05-01", "2026-05-01");

      expect(filename).toContain("finance-");
      expect(content.startsWith("date,")).toBe(true);
    });
  });

  describe("getOrdersCsv", () => {
    it("throws when range is invalid", async () => {
      await expect(service.getOrdersCsv("2026-06-01", "2026-05-01")).rejects.toBeInstanceOf(BadRequestException);
    });

    it("exports orders as CSV rows", async () => {
      prisma.order.findMany.mockResolvedValueOnce([
        {
          id: "o1",
          createdAt: new Date("2026-05-01T10:00:00.000Z"),
          status: OrderStatus.PENDING,
          userId: "u1",
          subtotalUzs: 100,
          discountUzs: 0,
          coinsAppliedUzs: 0,
          cashPaidUzs: 100,
          totalUzs: 100,
          user: { telegramId: "tg" },
          promoCode: null,
        },
      ] as never);

      const { content } = await service.getOrdersCsv("2026-05-01", "2026-05-01");

      expect(content).toContain("id,");
      expect(content).toContain("o1");
      expect(content).toContain("tg");
    });
  });
});
