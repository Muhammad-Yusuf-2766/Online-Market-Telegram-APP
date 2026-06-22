import { Test } from "@nestjs/testing";
import { PrismaService } from "../prisma/prisma.service";
import { createPrismaMock, PrismaMock } from "../../test/setup/prisma-mock";
import { RewardSettingsService } from "./reward-settings.service";

describe("RewardSettingsService", () => {
  let service: RewardSettingsService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = createPrismaMock();
    const moduleRef = await Test.createTestingModule({
      providers: [RewardSettingsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(RewardSettingsService);
  });

  it("getOrCreate upserts singleton", async () => {
    prisma.rewardSettings.upsert.mockResolvedValue({ id: "singleton" } as never);
    await service.getOrCreate();
    expect(prisma.rewardSettings.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "singleton" } }),
    );
  });

  it("update ensures singleton then updates", async () => {
    prisma.rewardSettings.upsert.mockResolvedValue({ id: "singleton" } as never);
    prisma.rewardSettings.update.mockResolvedValue({ id: "singleton", referralCoins: 10 } as never);
    await service.update({ referralCoins: 10 });
    expect(prisma.rewardSettings.update).toHaveBeenCalledWith({
      where: { id: "singleton" },
      data: { referralCoins: 10 },
    });
  });
});
