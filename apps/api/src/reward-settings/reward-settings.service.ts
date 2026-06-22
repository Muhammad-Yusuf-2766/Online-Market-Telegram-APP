import { Injectable } from "@nestjs/common";
import type { Prisma, RewardSettings } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

const SINGLETON_ID = "singleton";

@Injectable()
export class RewardSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreate(): Promise<RewardSettings> {
    return this.prisma.rewardSettings.upsert({
      where: { id: SINGLETON_ID },
      create: {
        id: SINGLETON_ID,
        referralCoins: 0,
        profileBirthdayCoins: 0,
        profileGenderCoins: 0,
        profileLastNameCoins: 0,
        profileFullCoins: 0,
      },
      update: {},
    });
  }

  async update(data: Prisma.RewardSettingsUncheckedUpdateInput): Promise<RewardSettings> {
    await this.getOrCreate();
    return this.prisma.rewardSettings.update({
      where: { id: SINGLETON_ID },
      data,
    });
  }
}
