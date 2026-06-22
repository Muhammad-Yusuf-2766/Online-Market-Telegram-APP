import { Module } from "@nestjs/common";
import { AdminAuthModule } from "../admin-auth/admin-auth.module";
import { AdminUsersMgmtController } from "./admin-users-mgmt.controller";
import { AdminUsersMgmtService } from "./admin-users-mgmt.service";

@Module({
  imports: [AdminAuthModule],
  controllers: [AdminUsersMgmtController],
  providers: [AdminUsersMgmtService],
})
export class AdminSettingsModule {}
