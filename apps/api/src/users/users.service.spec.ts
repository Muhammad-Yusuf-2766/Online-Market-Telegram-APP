import { Test } from "@nestjs/testing";
import { UserGender } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { TelegramNotifyService } from "../telegram/telegram-notify.service";
import { createPrismaMock, PrismaMock } from "../../test/setup/prisma-mock";
import { UsersService } from "./users.service";

describe("UsersService", () => {
  let service: UsersService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = createPrismaMock();
    const telegramNotify = {
      notifyCoinsCredit: jest.fn(),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
        { provide: TelegramNotifyService, useValue: telegramNotify },
      ],
    }).compile();
    service = moduleRef.get(UsersService);
  });

  it("getMe returns user", async () => {
    prisma.user.findUniqueOrThrow.mockResolvedValue({ id: "user-1" } as never);
    const user = await service.getMe("user-1");
    expect(user.id).toBe("user-1");
  });

  it("getRecentlyViewed returns product ids from analytics", async () => {
    prisma.analyticsEvent.findMany.mockResolvedValue([
      { productId: "p1" },
      { productId: "p2" },
      { productId: "p1" },
    ] as never);
    prisma.product.findMany.mockResolvedValue([{ id: "p1" }, { id: "p2" }] as never);
    const result = await service.getRecentlyViewed("user-1");
    expect(result).toHaveLength(2);
  });

  it("updateMe runs transaction and returns final user", async () => {
    const before = {
      id: "user-1",
      phone: "",
      firstName: "Old",
      lastName: "",
      birthDate: null,
      gender: UserGender.UNSPECIFIED,
      tier: "BRONZE",
      profileBonusLastNameDone: false,
      profileBonusBirthdateDone: false,
      profileBonusGenderDone: false,
      profileBonusFullDone: false,
    };
    const updated = {
      ...before,
      firstName: "New",
    };
    const txRewardSettings = {
      findUnique: jest.fn().mockResolvedValue(null),
    };
    const txUser = {
      update: jest.fn().mockResolvedValue(updated),
    };
    const txMock = {
      user: txUser,
      rewardSettings: txRewardSettings,
      coinLedgerEntry: { create: jest.fn() },
    };
    prisma.user.findUniqueOrThrow
      .mockResolvedValueOnce(before as never)
      .mockResolvedValueOnce({ telegramId: null, locale: "ru" } as never)
      .mockResolvedValueOnce(updated as never);
    prisma.$transaction.mockImplementation((fn: any) => fn(txMock));

    const result = await service.updateMe("user-1", { firstName: "New" });

    expect(txUser.update).toHaveBeenCalled();
    expect(txRewardSettings.findUnique).toHaveBeenCalledWith({ where: { id: "singleton" } });
    expect(result.firstName).toBe("New");
  });

  it("getReferralTree builds nested nodes up to depth", async () => {
    const rootDate = new Date("2026-01-01T00:00:00.000Z");
    prisma.user.findUniqueOrThrow
      .mockResolvedValueOnce({
        id: "u1",
        firstName: "Root",
        lastName: "User",
        referralCode: "R1",
        createdAt: rootDate,
      } as never)
      .mockResolvedValueOnce({
        id: "u2",
        firstName: "Child",
        lastName: "One",
        referralCode: "R2",
        createdAt: rootDate,
      } as never);
    prisma.user.findMany
      .mockResolvedValueOnce([{ id: "u2" }] as never)
      .mockResolvedValueOnce([] as never);

    const tree = await service.getReferralTree("u1", 3);

    expect(tree.id).toBe("u1");
    expect(tree.createdAt).toBe(rootDate.toISOString());
    expect(tree.children).toHaveLength(1);
    expect(tree.children[0].id).toBe("u2");
    expect(tree.children[0].children).toEqual([]);
  });

  it("getCoinInbox maps ledger rows without ack filter", async () => {
    prisma.user.findUniqueOrThrow.mockResolvedValue({ coinInboxAckAt: null } as never);
    prisma.coinLedgerEntry.findMany.mockResolvedValue([
      {
        id: "e1",
        kind: "REFERRAL_EARNED",
        delta: 10,
        metadata: {},
        createdAt: new Date("2026-05-01T12:00:00.000Z"),
      },
    ] as never);

    const rows = await service.getCoinInbox("user-1");

    expect(rows).toHaveLength(1);
    expect(rows[0].createdAt).toBe("2026-05-01T12:00:00.000Z");
  });
});
