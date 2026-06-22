import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Prisma } from "@prisma/client";
import { Test } from "@nestjs/testing";
import { PrismaService } from "../prisma/prisma.service";
import { createPrismaMock, PrismaMock } from "../../test/setup/prisma-mock";
import { AdminCampaignsService } from "./admin-campaigns.service";

describe("AdminCampaignsService", () => {
  let service: AdminCampaignsService;
  let prisma: PrismaMock;
  let config: jest.Mocked<Pick<ConfigService, "get">>;

  beforeEach(async () => {
    prisma = createPrismaMock();
    config = { get: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AdminCampaignsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = moduleRef.get(AdminCampaignsService);
  });

  describe("telegramMiniAppStartUrl", () => {
    it("returns null when bot username missing", () => {
      config.get.mockReturnValue(undefined);
      expect(service.telegramMiniAppStartUrl("spring-sale")).toBeNull();
    });

    it("builds start app URL when env configured", () => {
      config.get.mockImplementation((key: string) =>
        key === "TELEGRAM_BOT_USERNAME" ? "@MyBot" : key === "TELEGRAM_WEB_APP_SHORT_NAME" ? "shop" : undefined,
      );

      const url = service.telegramMiniAppStartUrl("spring-sale");

      expect(url).toContain("https://t.me/MyBot/shop");
      expect(url).toContain("c_spring-sale");
    });
  });

  describe("checkSlug", () => {
    it("marks invalid slugs as unavailable", async () => {
      const result = await service.checkSlug("!!!");

      expect(result.formatOk).toBe(false);
      expect(result.available).toBe(false);
      expect(prisma.trafficCampaign.findUnique).not.toHaveBeenCalled();
    });

    it("returns availability when format passes", async () => {
      prisma.trafficCampaign.findUnique.mockResolvedValue(null);
      config.get.mockImplementation((key: string) =>
        key === "TELEGRAM_BOT_USERNAME" ? "bot" : key === "TELEGRAM_WEB_APP_SHORT_NAME" ? "app" : undefined,
      );

      const result = await service.checkSlug("Valid-Slug");

      expect(result.formatOk).toBe(true);
      expect(result.available).toBe(true);
      expect(result.previewUrl).toContain("valid-slug");
    });
  });

  describe("create", () => {
    it("maps prisma unique violations to conflict", async () => {
      prisma.trafficCampaign.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError("dup", {
          code: "P2002",
          clientVersion: "jest",
        }),
      );

      await expect(service.create("dup", "Dup")).rejects.toBeInstanceOf(ConflictException);
    });

    it("returns list row for new campaign", async () => {
      prisma.trafficCampaign.create.mockResolvedValue({
        id: "c1",
        slug: "launch",
        name: "Launch",
        createdAt: new Date("2026-01-01"),
      } as never);

      const row = await service.create("launch", "Launch");

      expect(row.slug).toBe("launch");
      expect(row.attributedUsers).toBe(0);
    });
  });

  describe("stats", () => {
    it("throws when campaign slug unknown", async () => {
      prisma.trafficCampaign.findUnique.mockResolvedValue(null);

      await expect(service.stats("missing", "2026-05-01", "2026-05-05")).rejects.toBeInstanceOf(NotFoundException);
    });

    it("throws when date range invalid", async () => {
      prisma.trafficCampaign.findUnique.mockResolvedValue({
        id: "c1",
        slug: "x",
        name: "X",
        users: [],
      } as never);

      await expect(service.stats("x", "2026-06-01", "2026-05-01")).rejects.toBeInstanceOf(BadRequestException);
    });

    it("returns signup series for campaign", async () => {
      prisma.trafficCampaign.findUnique.mockResolvedValue({
        id: "c1",
        slug: "spring",
        name: "Spring",
        users: [{ createdAt: new Date("2026-05-01T12:00:00.000Z") }],
      } as never);
      prisma.user.count.mockResolvedValue(10);
      prisma.order.count.mockResolvedValue(3);
      prisma.order.aggregate.mockResolvedValue({
        _sum: { cashPaidUzs: 1000, coinsAppliedUzs: 500 },
      } as never);
      (prisma.order.groupBy as jest.Mock).mockResolvedValue([]);

      const result = await service.stats("spring", "2026-05-01", "2026-05-02");

      expect(result.signupsInRange).toBe(1);
      expect(result.series.length).toBeGreaterThan(0);
      expect(result.attributedOrders).toBe(3);
    });
  });
});
