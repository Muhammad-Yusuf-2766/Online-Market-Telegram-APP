import { Test } from "@nestjs/testing";
import { PrismaService } from "../prisma/prisma.service";
import { TelegramNotifyService } from "../telegram/telegram-notify.service";
import { createPrismaMock, PrismaMock } from "../../test/setup/prisma-mock";
import { LifecycleService } from "./lifecycle.service";

describe("LifecycleService", () => {
  let service: LifecycleService;
  let prisma: PrismaMock;
  let telegram: { sendPlainText: jest.Mock };

  beforeEach(async () => {
    prisma = createPrismaMock();
    telegram = { sendPlainText: jest.fn().mockResolvedValue(undefined) };
    const moduleRef = await Test.createTestingModule({
      providers: [
        LifecycleService,
        { provide: PrismaService, useValue: prisma },
        { provide: TelegramNotifyService, useValue: telegram },
      ],
    }).compile();
    service = moduleRef.get(LifecycleService);
  });

  it("runHourlyAbandonedCartNudges does nothing when no stale carts", async () => {
    prisma.cart.findMany.mockResolvedValue([]);
    await service.runHourlyAbandonedCartNudges();
    expect(telegram.sendPlainText).not.toHaveBeenCalled();
  });

  it("runHourlyAbandonedCartNudges sends one message per cart", async () => {
    prisma.cart.findMany.mockResolvedValue([
      {
        id: "c1",
        user: { telegramId: "tg99" },
        items: [{ qty: 1 }, { qty: 2 }],
      },
    ] as never);
    await service.runHourlyAbandonedCartNudges();
    expect(telegram.sendPlainText).toHaveBeenCalledTimes(1);
    expect(telegram.sendPlainText.mock.calls[0][0]).toBe("tg99");
    expect(telegram.sendPlainText.mock.calls[0][1]).toContain("Savatchangizda 2 ta mahsulot");
  });

  it("runDailyLifecycleJobs recomputes tier from order aggregates", async () => {
    prisma.user.findMany.mockResolvedValue([{ id: "u1" }] as never);
    prisma.order.aggregate.mockResolvedValue({ _sum: { cashPaidUzs: 5_000_000, coinsAppliedUzs: 2_000_000 } } as never);
    prisma.user.update.mockResolvedValue({} as never);
    await service.runDailyLifecycleJobs();
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: expect.objectContaining({ tier: "SILVER", tierComputedAt: expect.any(Date) }),
    });
  });
});
