import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../prisma/prisma.service";
import { TelegramNotifyService } from "../telegram/telegram-notify.service";
import { createPrismaMock, PrismaMock } from "../../test/setup/prisma-mock";
import { AdminCoinsService } from "./admin-coins.service";

jest.mock("bcrypt", () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

const bcryptMock = bcrypt as jest.Mocked<typeof bcrypt>;

describe("AdminCoinsService", () => {
  let service: AdminCoinsService;
  let prisma: PrismaMock;
  let telegram: jest.Mocked<Pick<TelegramNotifyService, "notifyCoinGift" | "notifyCoinsCredit">>;

  beforeEach(async () => {
    prisma = createPrismaMock();
    telegram = {
      notifyCoinGift: jest.fn().mockResolvedValue(undefined),
      notifyCoinsCredit: jest.fn().mockResolvedValue(undefined),
    };

    prisma.$transaction.mockImplementation(async (fn: (tx: PrismaMock) => Promise<unknown>) =>
      fn(prisma),
    );

    const moduleRef = await Test.createTestingModule({
      providers: [
        AdminCoinsService,
        { provide: PrismaService, useValue: prisma },
        { provide: TelegramNotifyService, useValue: telegram },
      ],
    }).compile();

    service = moduleRef.get(AdminCoinsService);
    bcryptMock.compare.mockResolvedValue(false as never);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("giftCoins", () => {
    it("rejects non-positive amounts", async () => {
      await expect(
        service.giftCoins({
          adminId: "a1",
          targetUserId: "u1",
          title: "Gift",
          description: "",
          imageUrl: "",
          coins: 0,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it("throws when target user is missing", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.giftCoins({
          adminId: "a1",
          targetUserId: "missing",
          title: "Gift",
          description: "",
          imageUrl: "",
          coins: 10,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("creates gift, updates balance, notifies telegram", async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: "u1",
        telegramId: "tg1",
        locale: "en",
      } as never);
      prisma.adminCoinGift.create.mockResolvedValue({
        id: "gift-1",
        coins: 50,
        title: "Bonus",
      } as never);

      const row = await service.giftCoins({
        adminId: "a1",
        targetUserId: "u1",
        title: "Bonus",
        description: "Hello",
        imageUrl: "",
        coins: 50,
      });

      expect(row.id).toBe("gift-1");
      expect(prisma.user.update).toHaveBeenCalled();
      expect(prisma.coinLedgerEntry.create).toHaveBeenCalled();
      expect(telegram.notifyCoinGift).toHaveBeenCalledWith("tg1", "Bonus", "Hello", "", 50, "en");
    });
  });

  describe("adjustBalance", () => {
    it("rejects zero delta", async () => {
      await expect(
        service.adjustBalance({
          adminUser: { id: "a1", passwordHash: "h" },
          targetUserId: "u1",
          password: "p",
          deltaUzs: 0,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("throws when admin password is wrong", async () => {
      bcryptMock.compare.mockResolvedValue(false as never);
      await expect(
        service.adjustBalance({
          adminUser: { id: "a1", passwordHash: "h" },
          targetUserId: "u1",
          password: "wrong",
          deltaUzs: 100,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("throws when adjustment would make balance negative", async () => {
      bcryptMock.compare.mockResolvedValue(true as never);
      prisma.user.findUnique.mockResolvedValue({ id: "u1", coinBalance: 10, telegramId: "tg", locale: "en" } as never);

      await expect(
        service.adjustBalance({
          adminUser: { id: "a1", passwordHash: "h" },
          targetUserId: "u1",
          password: "ok",
          deltaUzs: -50,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("updates balance and writes ledger", async () => {
      bcryptMock.compare.mockResolvedValue(true as never);
      prisma.user.findUnique.mockResolvedValue({ id: "u1", coinBalance: 100, telegramId: "tg", locale: "ru" } as never);

      const result = await service.adjustBalance({
        adminUser: { id: "a1", passwordHash: "h" },
        targetUserId: "u1",
        password: "ok",
        deltaUzs: 25,
        note: "manual",
      });

      expect(result.newBalance).toBe(125);
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe("listGiftsPaginated", () => {
    it("returns paginated gifts with target user", async () => {
      prisma.adminCoinGift.count.mockResolvedValue(1);
      prisma.adminCoinGift.findMany.mockResolvedValue([
        {
          id: "g1",
          targetUser: { telegramId: "t", firstName: "A", lastName: "B", locale: "en" },
        } as never,
      ]);

      const page = await service.listGiftsPaginated({ page: 1, pageSize: 10 });

      expect(page.total).toBe(1);
      expect(page.items[0].targetUser.telegramId).toBe("t");
    });
  });

  describe("listLedgerPaginated", () => {
    it("filters by userId when provided", async () => {
      prisma.coinLedgerEntry.count.mockResolvedValue(2);
      prisma.coinLedgerEntry.findMany.mockResolvedValue([
        { id: "l1", userId: "u1", delta: 5, kind: "ADMIN_GIFT", metadata: {}, createdAt: new Date() } as never,
      ]);

      const page = await service.listLedgerPaginated({ page: 1, pageSize: 5, userId: "u1" });

      expect(prisma.coinLedgerEntry.count).toHaveBeenCalledWith({ where: { userId: "u1" } });
      expect(page.items).toHaveLength(1);
    });
  });
});
