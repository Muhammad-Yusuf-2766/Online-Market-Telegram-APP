import { Module } from "@nestjs/common";
import { AdminAuthModule } from "../admin-auth/admin-auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { AdminCampaignsController } from "./admin-campaigns.controller";
import { AdminCampaignsService } from "./admin-campaigns.service";

@Module({
  imports: [PrismaModule, AdminAuthModule],
  controllers: [AdminCampaignsController],
  providers: [AdminCampaignsService],
  exports: [AdminCampaignsService],
})
export class AdminCampaignsModule {}
