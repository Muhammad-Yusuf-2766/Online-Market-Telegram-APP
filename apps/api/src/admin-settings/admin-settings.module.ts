import { Module } from "@nestjs/common";
import { AdminAuthModule } from "../admin-auth/admin-auth.module";
import { AdminUsersMgmtController } from "./admin-users-mgmt.controller";
import { AdminUsersMgmtService } from "./admin-users-mgmt.service";
import { MarketBrandingController } from "./market-branding.controller";
import { MarketBrandingService } from "./market-branding.service";

@Module({
  imports: [AdminAuthModule],
  controllers: [AdminUsersMgmtController, MarketBrandingController],
  providers: [AdminUsersMgmtService, MarketBrandingService],
})
export class AdminSettingsModule {}
