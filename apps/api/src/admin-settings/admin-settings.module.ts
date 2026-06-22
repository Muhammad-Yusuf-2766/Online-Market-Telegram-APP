import { Module } from "@nestjs/common";
import { AdminAuthModule } from "../admin-auth/admin-auth.module";
import { AdminUsersMgmtController } from "./admin-users-mgmt.controller";
import { AdminUsersMgmtService } from "./admin-users-mgmt.service";
import { PermissionsController } from "./permissions.controller";
import { PermissionsService } from "./permissions.service";
import { RolesController } from "./roles.controller";
import { RolesService } from "./roles.service";

@Module({
  imports: [AdminAuthModule],
  controllers: [AdminUsersMgmtController, RolesController, PermissionsController],
  providers: [AdminUsersMgmtService, RolesService, PermissionsService],
})
export class AdminSettingsModule {}
