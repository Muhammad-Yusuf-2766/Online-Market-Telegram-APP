import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { RewardSettings } from "@prisma/client";
import { RewardSettingsService } from "./reward-settings.service";

@ApiTags("reward-settings")
@Controller("settings")
export class PublicRewardSettingsController {
  constructor(private readonly rewardSettings: RewardSettingsService) {}

  @Get("rewards")
  @ApiOperation({ summary: "Public coin reward amounts (for mini app UI)" })
  @ApiOkResponse({ description: "Reward settings" })
  async getRewards(): Promise<
    Pick<
      RewardSettings,
      | "referralCoins"
      | "profileBirthdayCoins"
      | "profileGenderCoins"
      | "profileLastNameCoins"
      | "profileFullCoins"
    >
  > {
    const row = await this.rewardSettings.getOrCreate();
    return {
      referralCoins: row.referralCoins,
      profileBirthdayCoins: row.profileBirthdayCoins,
      profileGenderCoins: row.profileGenderCoins,
      profileLastNameCoins: row.profileLastNameCoins,
      profileFullCoins: row.profileFullCoins,
    };
  }
}
