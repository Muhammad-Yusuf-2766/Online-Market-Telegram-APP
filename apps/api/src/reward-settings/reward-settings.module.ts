import { Module } from "@nestjs/common";
import { AdminAuthModule } from "../admin-auth/admin-auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { AdminRewardSettingsController } from "./admin-reward-settings.controller";
import { PublicRewardSettingsController } from "./public-reward-settings.controller";
import { RewardSettingsService } from "./reward-settings.service";

@Module({
  imports: [PrismaModule, AdminAuthModule],
  controllers: [PublicRewardSettingsController, AdminRewardSettingsController],
  providers: [RewardSettingsService],
  exports: [RewardSettingsService],
})
export class RewardSettingsModule {}
