import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { RewardSettings } from "@prisma/client";
import { JwtAdminGuard } from "../admin-auth/guards/jwt-admin.guard";
import { PERMISSIONS } from "../common/rbac/permissions.constants";
import { PermissionsGuard } from "../common/rbac/permissions.guard";
import { RequirePermissions } from "../common/rbac/require-permissions.decorator";
import { UpdateRewardSettingsDto } from "./dto/update-reward-settings.dto";
import { RewardSettingsService } from "./reward-settings.service";

@ApiTags("admin-reward-settings")
@ApiBearerAuth("admin-jwt")
@UseGuards(JwtAdminGuard, PermissionsGuard)
@Controller("admin/settings/rewards")
export class AdminRewardSettingsController {
  constructor(private readonly rewardSettings: RewardSettingsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.rewards.view)
  @ApiOperation({ summary: "Get reward settings" })
  @ApiOkResponse()
  async get(): Promise<RewardSettings> {
    return this.rewardSettings.getOrCreate();
  }

  @Patch()
  @RequirePermissions(PERMISSIONS.rewards.manage)
  @ApiOperation({ summary: "Update reward settings" })
  @ApiOkResponse()
  async patch(@Body() body: UpdateRewardSettingsDto): Promise<RewardSettings> {
    const data: Record<string, number> = {};
    if (body.referralCoins !== undefined) {
      data.referralCoins = body.referralCoins;
    }
    if (body.profileBirthdayCoins !== undefined) {
      data.profileBirthdayCoins = body.profileBirthdayCoins;
    }
    if (body.profileGenderCoins !== undefined) {
      data.profileGenderCoins = body.profileGenderCoins;
    }
    if (body.profileLastNameCoins !== undefined) {
      data.profileLastNameCoins = body.profileLastNameCoins;
    }
    if (body.profileFullCoins !== undefined) {
      data.profileFullCoins = body.profileFullCoins;
    }
    return this.rewardSettings.update(data);
  }
}
