import { NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { UserTier } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { UsersService } from "../users/users.service";
import { createPrismaMock, PrismaMock } from "../../test/setup/prisma-mock";
import { AdminUsersService } from "./admin-users.service";

describe("AdminUsersService", () => {
  let service: AdminUsersService;
  let prisma: PrismaMock;
  let usersService: jest.Mocked<Pick<UsersService, "getReferralTree">>;

  beforeEach(async () => {
    prisma = createPrismaMock();
    usersService = { getReferralTree: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AdminUsersService,
        { provide: PrismaService, useValue: prisma },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    service = moduleRef.get(AdminUsersService);
  });

  describe("findAllPaginated", () => {
    it("applies search filters and returns paginated users", async () => {
      prisma.user.count.mockResolvedValue(1);
      prisma.user.findMany.mockResolvedValue([
        { id: "u1", telegramId: "t1", tier: UserTier.BRONZE } as never,
      ]);

      const result = await service.findAllPaginated({
        page: 1,
        pageSize: 20,
        q: "john",
        tier: UserTier.GOLD,
      });

      expect(prisma.user.count).toHaveBeenCalledWith({
        where: {
          OR: expect.any(Array),
          tier: UserTier.GOLD,
        },
      });
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it("works without optional filters", async () => {
      prisma.user.count.mockResolvedValue(0);
      prisma.user.findMany.mockResolvedValue([]);

      const result = await service.findAllPaginated({ page: 2, pageSize: 10 });

      expect(prisma.user.count).toHaveBeenCalledWith({ where: {} });
      expect(result.items).toEqual([]);
      expect(result.page).toBe(2);
    });
  });

  describe("getReferralTree", () => {
    it("throws when user does not exist", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.getReferralTree("missing", 3)).rejects.toBeInstanceOf(NotFoundException);
      expect(usersService.getReferralTree).not.toHaveBeenCalled();
    });

    it("delegates to UsersService when user exists", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: "u1" } as never);
      usersService.getReferralTree.mockResolvedValue({ id: "u1", children: [] } as never);

      const tree = await service.getReferralTree("u1", 2);

      expect(usersService.getReferralTree).toHaveBeenCalledWith("u1", 2);
      expect(tree).toEqual({ id: "u1", children: [] });
    });
  });

  describe("getUser360", () => {
    it("throws when user is not found", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.getUser360("x")).rejects.toBeInstanceOf(NotFoundException);
    });

    it("returns user bundle with KPI rollups", async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: "u1",
        orders: [
          {
            cashPaidUzs: 1000,
            coinsAppliedUzs: 500,
            status: "DELIVERED",
            createdAt: new Date("2026-01-02"),
          },
          {
            cashPaidUzs: 200,
            coinsAppliedUzs: 0,
            status: "CANCELLED",
            createdAt: new Date("2026-01-01"),
          },
        ],
        coinLedger: [{ delta: 100 }, { delta: -40 }],
        _count: { orders: 2, referrals: 3, wishlistItems: 4 },
      } as never);

      const result = await service.getUser360("u1");

      expect(result.kpis.deliveredOrders).toBe(1);
      expect(result.kpis.cancelledOrders).toBe(1);
      expect(result.kpis.ltvUzs).toBe(1700);
      expect(result.kpis.coinsLifetimeEarned).toBe(100);
      expect(result.kpis.coinsLifetimeSpent).toBe(40);
    });
  });
});
